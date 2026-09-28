-- Value City E-Commerce System
-- MIGRATION: widens `verification_code` to hold a clickable-link token
-- instead of a 6-digit code.
--
-- REQ-4/5/6 ask for a verification *link*, not a typed code. The column
-- was VARCHAR(6) for the old 6-digit flow; a link needs a long random
-- token (32 bytes as hex = 64 characters) so it can't be guessed.
--
-- This does NOT touch `reset_code` -- password reset (REQ-12/13) already
-- says "code" and stays exactly as it is, a typed 6-digit code.
--
-- Run this AFTER add_email_verification.sql. In phpMyAdmin: select the
-- value_city_admin database, then run this file's SQL tab.

USE value_city_admin;

ALTER TABLE users MODIFY verification_code VARCHAR(64) NULL DEFAULT NULL;

-- Note: any account that was mid-verification (had an old 6-digit code
-- sitting in this column) will just have that short code widened in place
-- -- harmless, since resend-verification issues a fresh long token anyway.
