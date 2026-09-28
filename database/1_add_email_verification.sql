-- Value City E-Commerce System
-- MIGRATION: adds email verification (registration) + password reset support
-- to `users`.
--
-- Run this AFTER add_user_dashboard_tables.sql and add_account_status.sql
-- (or after importing a dump that already includes the users table).
-- In phpMyAdmin: select the value_city_admin database, then run this file's SQL tab.

USE value_city_admin;

ALTER TABLE users
  ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash,
  ADD COLUMN verification_code VARCHAR(6) NULL DEFAULT NULL AFTER email_verified,
  ADD COLUMN verification_code_expires TIMESTAMP NULL DEFAULT NULL AFTER verification_code,
  ADD COLUMN reset_code VARCHAR(6) NULL DEFAULT NULL AFTER verification_code_expires,
  ADD COLUMN reset_code_expires TIMESTAMP NULL DEFAULT NULL AFTER reset_code;

-- email_verified:
--   0  -- account created but the 6-digit code emailed at registration
--        hasn't been confirmed yet. Login is blocked until this is 1
--        (see server/routes/customerAuth.js).
--   1  -- confirmed. verification_code/verification_code_expires get
--        cleared out once this flips.
--
-- verification_code / verification_code_expires:
--   The registration confirmation code (15 min expiry) and "Resend code"
--   both write here. Cleared on successful verification.
--
-- reset_code / reset_code_expires:
--   Same shape, used by the forgot-password flow (15 min expiry). Cleared
--   on a successful reset.

-- IMPORTANT: any accounts that already existed before this migration will
-- default to email_verified = 0, which means they'll get locked out of
-- login (they were never sent a code, since they registered before this
-- feature existed). Uncomment and run the line below once to grandfather
-- your existing test accounts in as already-verified:
-- UPDATE users SET email_verified = 1 WHERE email_verified = 0;
