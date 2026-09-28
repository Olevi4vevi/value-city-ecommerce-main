const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    const [[{ unread }]] = await db.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE is_read = 0'
    );
    res.json({ notifications, unreadCount: unread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};