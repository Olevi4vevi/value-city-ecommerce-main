const db = require('../config/db');

exports.listUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.user_id, u.full_name, u.email, u.phone_number, u.created_at,
             COUNT(o.order_id) AS order_count,
             COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.user_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
