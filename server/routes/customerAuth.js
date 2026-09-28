const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // reuses Shifali's existing pool -- do not add a second db.js
const { generateCode, generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
require('dotenv').config();

const router = express.Router();
const SALT_ROUNDS = 10;
const CODE_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes, for both verification and reset codes

// POST /api/auth/customer/register
// Creates the account as unverified and emails a confirmation *link*
// (REQ-4/5/6). No token is issued here -- login is blocked until the link
// is clicked and confirmed via POST /verify-email, so registering doesn't
// log anyone in by itself.
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone_number, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = generateVerificationToken();
    const expires = new Date(Date.now() + CODE_LIFETIME_MS);

    await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, address, verification_code, verification_code_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, phone_number || null, address || null, verificationToken, expires]
    );

    let emailSent = true;
    try {
      await sendVerificationEmail(email, full_name, verificationToken);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
      emailSent = false;
    }

    res.status(201).json({
      message: emailSent
        ? 'Account created. Check your email for a confirmation link.'
        : "Account created, but we couldn't send the confirmation email. Use \"Resend link\" to try again.",
      email,
      emailSent
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/customer/verify-email
// Consumes the token from the confirmation link and, on success, is the
// point the account actually becomes usable -- it issues the auth token,
// same shape as login. The client's VerifyEmail page calls this
// automatically as soon as it loads with a ?token= in the URL, so clicking
// the emailed link is the whole action -- nothing to type.
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing verification token.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE verification_code = ?', [token]);
    if (rows.length === 0) {
      return res.status(400).json({
        message: 'This link is invalid or has already been used. If you already confirmed your email, just log in.'
      });
    }

    const user = rows[0];

    if (user.email_verified) {
      return res.status(400).json({ message: 'This email is already verified. You can log in.' });
    }

    if (!user.verification_code_expires || new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ message: 'This link has expired. Request a new one.' });
    }

    await db.query(
      "UPDATE users SET email_verified = 1, verification_code = NULL, verification_code_expires = NULL WHERE user_id = ?",
      [user.user_id]
    );

    const authToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      message: 'Email confirmed! Welcome to Value City.',
      token: authToken,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email }
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error verifying email.' });
  }
});

// POST /api/auth/customer/resend-verification
// Takes an email rather than the old token (the whole point of resending is
// that the person doesn't have a working link anymore), issues a fresh
// token and emails a new link.
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const user = rows[0];
    if (user.email_verified) {
      return res.status(400).json({ message: 'This email is already verified. You can log in.' });
    }

    const verificationToken = generateVerificationToken();
    const expires = new Date(Date.now() + CODE_LIFETIME_MS);
    await db.query(
      'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE user_id = ?',
      [verificationToken, expires, user.user_id]
    );

    await sendVerificationEmail(email, user.full_name, verificationToken);
    res.json({ message: 'A new confirmation link has been sent to your email.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Server error resending the confirmation link.' });
  }
});

// POST /api/auth/customer/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Email verification check is switched off for now (see /register), so
    // accounts created before that change, which were never confirmed, can
    // still log in. To turn it back on, restore:
    //   if (!user.email_verified) {
    //     return res.status(403).json({
    //       message: 'Please verify your email before logging in.',
    //       needsVerification: true,
    //       email: user.email
    //     });
    //   }

    // A pending-deletion account is restored automatically on login (REQ-23
    // -- no confirmation needed, it just un-does the deletion request). A
    // deactivated account is different: REQ-11 asks the system to *offer*
    // reactivation rather than do it silently, so that case stops here and
    // hands back to the client instead of logging them straight in --
    // POST /confirm-reactivation below is what actually flips it back on.
    let reactivated = null;

    if (user.account_status === 'pending_deletion') {
      const requestedAt = new Date(user.deletion_requested_at);
      const daysSinceRequest = (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceRequest > 30) {
        // Past the 30-day undo window. There's no scheduled job to purge
        // this on its own, so this login attempt is the first chance to
        // actually remove the row -- do that now and answer as if the
        // account never existed, rather than confirming it once did.
        await db.query('DELETE FROM users WHERE user_id = ?', [user.user_id]);
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      await db.query(
        "UPDATE users SET account_status = 'active', deletion_requested_at = NULL WHERE user_id = ?",
        [user.user_id]
      );
      reactivated = 'deletion_cancelled';
    } else if (user.account_status === 'deactivated') {
      return res.status(403).json({
        message: 'This account is deactivated. Reactivate it to sign in?',
        needsReactivationOffer: true,
        email: user.email
      });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email },
      reactivated
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/customer/confirm-reactivation
// REQ-11: the follow-up to the 403/needsReactivationOffer response above --
// re-checks the same email/password (the account offering reactivation
// shouldn't be reactivatable by anyone who merely knows the email) and, if
// it's still deactivated, flips it back to active and logs them in.
router.post('/confirm-reactivation', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.account_status !== 'deactivated') {
      return res.status(400).json({ message: "This account isn't waiting on reactivation." });
    }

    await db.query("UPDATE users SET account_status = 'active' WHERE user_id = ?", [user.user_id]);

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      message: 'Account reactivated. Welcome back!',
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email },
      reactivated: 'reactivated'
    });
  } catch (err) {
    console.error('Confirm reactivation error:', err);
    res.status(500).json({ message: 'Server error reactivating account.' });
  }
});

// POST /api/auth/customer/forgot-password
// Always responds with the same generic message whether or not the email
// exists, so this endpoint can't be used to check which emails are
// registered. The reset code is only actually generated/sent when the
// account is real.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      const code = generateCode();
      const expires = new Date(Date.now() + CODE_LIFETIME_MS);

      await db.query(
        'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE user_id = ?',
        [code, expires, user.user_id]
      );

      try {
        await sendPasswordResetEmail(email, user.full_name, code);
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr);
      }
    }

    res.json({ message: 'If an account exists for that email, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error requesting password reset.' });
  }
});

// POST /api/auth/customer/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ message: 'Email, code and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least six characters.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Incorrect code. Double check and try again.' });
    }

    const user = rows[0];
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ message: 'Incorrect code. Double check and try again.' });
    }
    if (!user.reset_code_expires || new Date(user.reset_code_expires) < new Date()) {
      return res.status(400).json({ message: 'This code has expired. Request a new one.' });
    }

    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.query(
      'UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expires = NULL WHERE user_id = ?',
      [password_hash, user.user_id]
    );

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
});

module.exports = router;
