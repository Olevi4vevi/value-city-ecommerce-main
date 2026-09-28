-- Value City E-Commerce System
-- MIGRATION: stops account deletion from taking order history down with it.
--
-- REQ-24 / NREQ-7 require order and transaction records to survive account
-- deletion, but the original schema has orders.user_id as
-- "ON DELETE CASCADE" -- so once the 30-day grace period lapses and a user
-- row is actually removed (see server/routes/customerAuth.js), MySQL would
-- silently delete every one of their orders along with it. This migration
-- lets user_id go NULL instead, so the order row (and its order_items)
-- stay in the database for accounting/auditing even after the account
-- itself is gone.
--
-- Run this AFTER add_user_dashboard_tables.sql. In phpMyAdmin: select the
-- value_city_admin database, then run this file's SQL tab.

USE value_city_admin;

ALTER TABLE orders MODIFY user_id INT(11) NULL;

ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1;

ALTER TABLE orders
  ADD CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL;

-- Note: an order with user_id = NULL will no longer show up in that
-- customer's Order History (there's no one to scope it to any more), which
-- is expected -- the point of REQ-24 is that the record itself isn't
-- destroyed, not that it stays attached to a deleted account.
