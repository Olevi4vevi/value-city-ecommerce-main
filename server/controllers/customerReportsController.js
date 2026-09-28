const db = require('../config/db');
const { resolveRange, bucketKey, buildBuckets, formatDateOnly } = require('../utils/reportRanges');

exports.getSpendingSummary = async (req, res) => {
  try {
    const resolved = resolveRange({ ...req.query, range: req.query.range || '6m' });
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    const { startDate, endDate, days, granularity } = resolved;

    const [rows] = await db.query(
      'SELECT order_date, total_amount FROM orders WHERE user_id = ? AND order_date >= ?',
      [req.customer.user_id, startDate]
    );

    const buckets = buildBuckets(startDate, days, granularity, () => ({ spent: 0, orders: 0 }));
    for (const row of rows) {
      const bucket = buckets.get(bucketKey(row.order_date, granularity));
      if (!bucket) continue;
      bucket.spent += Number(row.total_amount);
      bucket.orders += 1;
    }

    const series = [...buckets.values()];
    const hasData = series.some((b) => b.orders > 0);

    res.json({
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      granularity, series, hasData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
