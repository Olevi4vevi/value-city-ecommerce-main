-- Value City E-Commerce System
-- MIGRATION: adds User Dashboard & Order History tables
--
-- Run this AFTER importing Shifali's value_city_admin (2).sql dump.
-- Do NOT run "CREATE DATABASE" here -- it already exists from her dump.
-- In phpMyAdmin: select the value_city_admin database first, then run this file's SQL tab.

USE value_city_admin;

-- Customer accounts. Kept separate from her `admins` table on purpose --
-- admins log in through /api/auth (her existing route), customers log in
-- through /api/auth/customer (new route below). Two separate, simple auth
-- systems -- avoids touching her working admin login at all.
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders placed by customers. product_id links to Shifali's existing
-- `products` table (id) so order history reflects real product data --
-- item_name/condition_grade/price are still stored per-line so an order
-- keeps its original details even if a product is later edited or deleted.
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  item_name VARCHAR(150) NOT NULL,
  size VARCHAR(20),
  condition_grade ENUM('new','like_new','good','fair') DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Sample data so Order History has something to show right away.
-- Uses two of Shifali's real products (ids 1 and 2 from her dump).
INSERT INTO users (full_name, email, password_hash, phone_number, address)
VALUES ('Test User', 'test@example.com', '$2b$10$replace_with_real_bcrypt_hash', '9990000', 'Suva, Fiji');

INSERT INTO orders (user_id, total_amount, status) VALUES (1, 6.00, 'completed');
INSERT INTO order_items (order_id, product_id, item_name, size, condition_grade, price, quantity)
VALUES
  (1, 1, 'Cotton Shirt', 'M', 'good', 3.00, 1),
  (1, 2, 'Top', 'S', 'fair', 3.00, 1);
