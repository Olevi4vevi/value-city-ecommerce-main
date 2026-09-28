-- Value City E-Commerce System
-- MIGRATION: adds 5 more categories on top of the original 4
-- (Men, Women, Kids, Accessories) that ship in the base dump.
--
-- Safe to re-run -- INSERT IGNORE skips any category names that already
-- exist (categories.name has a UNIQUE constraint).
-- In phpMyAdmin: select the value_city_admin database, then run this file's SQL tab.

USE value_city_admin;

INSERT IGNORE INTO categories (name) VALUES
  ('Shoes'),
  ('Bags'),
  ('Books'),
  ('Toys'),
  ('Kitchenware');
