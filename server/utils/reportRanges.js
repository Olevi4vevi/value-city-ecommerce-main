const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '6m': 182,
  '1y': 365,
};

// Parses a "YYYY-MM-DD" date-only string (e.g. from <input type="date">) as
// local midnight. `new Date(str)` would parse it as UTC midnight instead,
// which silently shifts by a day once reinterpreted in local time -- the
// rest of this module (buckets, order_date rows from mysql2) works in local
// time throughout, so date-only strings must be parsed the same way.
function parseDateOnly(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
  if (!match) return new Date(NaN);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function resolveRange(query = {}) {
  const { range, startDate: startStr, endDate: endStr } = query;

  if (startStr || endStr) {
    if (!startStr || !endStr) return { error: 'missing' };

    const startDate = parseDateOnly(startStr);
    const endDate = parseDateOnly(endStr);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: 'invalid' };
    }
    if (endDate < startDate) return { error: 'invalid' };

    const days = Math.round((endDate - startDate) / 86400000) + 1;
    const granularity = days <= 31 ? 'day' : days <= 182 ? 'week' : 'month';
    return { startDate, endDate, days, granularity };
  }

  const days = RANGE_DAYS[range] || RANGE_DAYS['30d'];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);
  const granularity = days <= 31 ? 'day' : days <= 182 ? 'week' : 'month';
  return { startDate, endDate, days, granularity };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function bucketKey(date, granularity) {
  const d = new Date(date);
  if (granularity === 'day') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (granularity === 'week') {
    const { year, week } = isoWeek(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function bucketLabel(key, granularity) {
  if (granularity === 'day') {
    return parseDateOnly(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (granularity === 'week') return key;
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// Formats a Date back to "YYYY-MM-DD" using its local calendar fields --
// `.toISOString()` would convert through UTC and, like the parsing issue
// above, can shift the displayed date by a day.
function formatDateOnly(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildBuckets(startDate, days, granularity, factory = () => ({})) {
  const buckets = new Map();
  const cursor = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + days - 1);

  while (cursor <= end) {
    const key = bucketKey(cursor, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: bucketLabel(key, granularity), ...factory() });
    }
    if (granularity === 'day') cursor.setDate(cursor.getDate() + 1);
    else if (granularity === 'week') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
}

module.exports = { resolveRange, bucketKey, buildBuckets, formatDateOnly };
