-- Value City E-Commerce System
-- MIGRATION: adds account deactivation + soft-delete support to `users`
--
-- Run this AFTER add_user_dashboard_tables.sql (or after importing a dump
-- that already includes the users/orders tables).
-- In phpMyAdmin: select the value_city_admin database, then run this file's SQL tab.

USE value_city_admin;

ALTER TABLE users
  ADD COLUMN account_status ENUM('active', 'deactivated', 'pending_deletion') NOT NULL DEFAULT 'active' AFTER address,
  ADD COLUMN deletion_requested_at TIMESTAMP NULL DEFAULT NULL AFTER account_status;

-- account_status:
--   active            -- normal account
--   deactivated       -- customer paused it; reversible anytime by logging in
--   pending_deletion  -- customer requested deletion; reversible by logging
--                        back in within 30 days of deletion_requested_at,
--                        after which the row is purged on the next login
--                        attempt (see server/routes/customerAuth.js) since
--                        there's no scheduled job to do it automatically.
