const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const verifyCustomerToken = require('../middleware/customerAuth');

const router = express.Router();
router.use(verifyCustomerToken);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone_number, address, created_at FROM users WHERE user_id = ?',
      [req.customer.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// PUT /api/profile
router.put('/', async (req, res) => {
  try {
    const { full_name, phone_number, address } = req.body;
    if (!full_name) {
      return res.status(400).json({ message: 'Full name cannot be empty.' });
    }

    await db.query(
      'UPDATE users SET full_name = ?, phone_number = ?, address = ? WHERE user_id = ?',
      [full_name, phone_number || null, address || null, req.customer.user_id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// PUT /api/profile/password
router.put('/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [req.customer.user_id]);
    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const new_hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [new_hash, req.customer.user_id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error changing password.' });
  }
});

// DELETE /api/profile
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = ?', [req.customer.user_id]);
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error deleting account.' });
  }
});

module.exports = router;
