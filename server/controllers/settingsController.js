const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
    if (rows.length === 0) return res.status(404).json({ error: 'Settings not found' });

    const [admin] = await db.query('SELECT username, display_name FROM admins WHERE id = ?', [req.admin.id]);

    res.json({
      ...rows[0],
      username: admin[0]?.username || '',
      display_name: admin[0]?.display_name || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStore = async (req, res) => {
  const { store_name, contact_email, location } = req.body;

  if (!store_name || !store_name.trim()) {
    return res.status(400).json({ error: 'Store name is required' });
  }
  if (contact_email && !/^\S+@\S+\.\S+$/.test(contact_email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  try {
    await db.query(
      'UPDATE settings SET store_name = ?, contact_email = ?, location = ? WHERE id = 1',
      [store_name.trim(), contact_email?.trim() || null, location?.trim() || null]
    );
    res.json({ message: 'Store details saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateThresholds = async (req, res) => {
  const low = Number(req.body.low_stock_threshold);
  const target = Number(req.body.stock_target);

  if (!Number.isInteger(low) || low < 1) {
    return res.status(400).json({ error: 'Low stock threshold must be at least 1' });
  }
  if (!Number.isInteger(target) || target < 1) {
    return res.status(400).json({ error: 'Stock target must be at least 1' });
  }
  if (low >= target) {
    return res.status(400).json({ error: 'Low stock threshold must be below the stock target' });
  }

  try {
    await db.query(
      'UPDATE settings SET low_stock_threshold = ?, stock_target = ? WHERE id = 1',
      [low, target]
    );
    res.json({ message: 'Stock thresholds saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { display_name } = req.body;

  if (!display_name || !display_name.trim()) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  if (display_name.trim().length > 80) {
    return res.status(400).json({ error: 'Display name is too long' });
  }

  try {
    await db.query('UPDATE admins SET display_name = ? WHERE id = ?', [display_name.trim(), req.admin.id]);
    res.json({ message: 'Display name saved', display_name: display_name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUsername = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Enter your password to confirm this change' });
  }

  const clean = username.trim();

  if (clean.length < 2 || clean.length > 50) {
    return res.status(400).json({ error: 'Username must be between 2 and 50 characters' });
  }
  if (/\s/.test(clean)) {
    return res.status(400).json({ error: 'Username cannot contain spaces' });
  }

  try {
    const [rows] = await db.query('SELECT username, password_hash FROM admins WHERE id = ?', [req.admin.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'That password is incorrect' });

    if (clean === rows[0].username) {
      return res.status(400).json({ error: 'That is already your username' });
    }

    const [taken] = await db.query(
      'SELECT id FROM admins WHERE BINARY username = ? AND id != ?',
      [clean, req.admin.id]
    );
    if (taken.length > 0) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    await db.query('UPDATE admins SET username = ? WHERE id = ?', [clean, req.admin.id]);

    res.json({ message: 'Username changed. Please sign in again.', username: clean });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};