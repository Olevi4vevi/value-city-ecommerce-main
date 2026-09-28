const db = require('../config/db');
const { resolveRange, bucketKey, buildBuckets, formatDateOnly } = require('../utils/reportRanges');

exports.getKeyMetrics = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_sales }]] = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE status = 'completed'`
    );

    res.json({ totalUsers: total_users, totalSales: total_sales });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesTrend = async (req, res) => {
  try {
    const resolved = resolveRange(req.query);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    const { startDate, endDate, days, granularity } = resolved;

    const [rows] = await db.query(
      'SELECT order_date, status, total_amount FROM orders WHERE order_date >= ?',
      [startDate]
    );

    const buckets = buildBuckets(startDate, days, granularity, () => ({ volume: 0, revenue: 0 }));
    for (const row of rows) {
      const bucket = buckets.get(bucketKey(row.order_date, granularity));
      if (!bucket) continue;
      bucket.volume += 1;
      if (row.status === 'completed') bucket.revenue += Number(row.total_amount);
    }

    const series = [...buckets.values()];
    const hasData = series.some((b) => b.volume > 0 || b.revenue > 0);

    res.json({
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      granularity, series, hasData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const resolved = resolveRange(req.query);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    const { startDate, endDate, days, granularity } = resolved;

    const [rows] = await db.query(
      'SELECT order_date, status FROM orders WHERE order_date >= ?',
      [startDate]
    );

    const buckets = buildBuckets(startDate, days, granularity, () => ({
      pending: 0, paid: 0, shipped: 0, completed: 0, cancelled: 0, total: 0,
    }));
    for (const row of rows) {
      const bucket = buckets.get(bucketKey(row.order_date, granularity));
      if (!bucket) continue;
      bucket[row.status] = (bucket[row.status] || 0) + 1;
      bucket.total += 1;
    }

    const series = [...buckets.values()];
    const hasData = series.some((b) => b.total > 0);

    res.json({
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      granularity, series, hasData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
