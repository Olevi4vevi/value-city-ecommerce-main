const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Where the client app runs -- used to build the clickable verification
// link (e.g. http://valuecity.localhost:5173/verify-email?token=...).
// Defaults to the team's standard local dev address (see vite.config.js /
// server.js CORS whitelist) so nobody has to set this by hand just to run
// the project locally. Set CLIENT_URL in server/.env to override it for
// anything else (a teammate's different local setup, or once this is
// actually deployed somewhere).
const CLIENT_URL = process.env.CLIENT_URL || 'http://valuecity.localhost:5173';

// Gmail SMTP, sending as whatever account the group sets up for the project.
// Needs an "app password" (not the account's normal login password) --
// generate one under the Google Account's Security > 2-Step Verification >
// App passwords settings, then set these two in server/.env:
//   EMAIL_USER=yourprojectaddress@gmail.com
//   EMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (the 16-character app password)
//
// `family: 4` forces the connection to Gmail over IPv4. Some networks
// advertise IPv6 without actually routing it properly, which makes Node
// try the (broken) IPv6 address first and fail with ECONNREFUSED before
// ever getting a chance to fall back to IPv4 -- this skips straight past
// that.
//
// If sending still fails with "self-signed certificate in certificate
// chain", that's a *different* problem: something on the network or this
// machine (antivirus "web/mail protection", a school/office network doing
// SSL inspection, etc.) is swapping in its own certificate for the
// connection to Gmail, and Node -- unlike browsers -- doesn't trust
// certificates from the Windows certificate store by default, so it
// correctly rejects it. That's not fixable from inside this file; it needs
// to be fixed (or temporarily disabled for testing) on whatever machine/
// network is doing the intercepting. As a LAST-RESORT, LOCAL-TESTING-ONLY
// workaround (never in production -- this disables certificate
// verification entirely), set EMAIL_ALLOW_INSECURE_TLS=true in .env.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  family: 4,
  ...(process.env.EMAIL_ALLOW_INSECURE_TLS === 'true'
    ? { tls: { rejectUnauthorized: false } }
    : {})
});

// 6-digit numeric code, e.g. "042917". Still used for password reset --
// REQ-12/13 asks for a typed code there, and that flow already shipped
// this way with Lei's sign-off.
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Long random token for the registration verification *link* (REQ-4/5/6).
// 32 random bytes as hex = 64 characters -- long enough that it can't be
// guessed or brute-forced before it expires.
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(to, fullName, token) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Value City" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Confirm your Value City account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #24392E;">Welcome to Value City${fullName ? `, ${fullName.split(' ')[0]}` : ''}!</h2>
        <p>Click the button below to confirm your email address and activate your account:</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="display: inline-block; background: #24392E; color: #F8F6F0; font-weight: bold; text-decoration: none; padding: 14px 28px;">Confirm my email</a>
        </p>
        <p style="color: #77877C; font-size: 12px; word-break: break-all;">Or paste this link into your browser: ${link}</p>
        <p style="color: #77877C; font-size: 13px;">This link expires in 15 minutes. If you didn't create a Value City account, you can ignore this email.</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(to, fullName, code) {
  await transporter.sendMail({
    from: `"Value City" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Value City password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #24392E;">Reset your password</h2>
        <p>${fullName ? fullName.split(' ')[0] : 'Hi'}, use this code to set a new password for your Value City account:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #24392E; margin: 24px 0;">${code}</p>
        <p style="color: #77877C; font-size: 13px;">This code expires in 15 minutes. If you didn't request a password reset, you can ignore this email -- your password won't change.</p>
      </div>
    `
  });
}

module.exports = { generateCode, generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail };
