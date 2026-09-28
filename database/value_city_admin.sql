-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 26, 2026 at 01:44 PM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `value_city_admin`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `display_name` varchar(80) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `display_name`, `password_hash`, `created_at`) VALUES
(1, 'Dean', 'Dean', '$2b$10$xpjrGSNtd4OcBwIWauO4T.CCYRTm2XBMQ9BSCduxfK0q8m4vL/y7q', '2026-08-19 03:57:02');

--
-- Triggers `admins`
--
DELIMITER $$
CREATE TRIGGER `trg_admins_after_delete` AFTER DELETE ON `admins` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('admins', OLD.id, OLD.username,
    CONCAT('Admin account "', OLD.username, '" was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(80) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Men', '2026-08-19 03:51:55'),
(2, 'Women', '2026-08-19 03:51:55'),
(3, 'Kids', '2026-08-19 03:51:55'),
(4, 'Accessories', '2026-08-19 03:51:55');

--
-- Triggers `categories`
--
DELIMITER $$
CREATE TRIGGER `trg_categories_after_delete` AFTER DELETE ON `categories` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('categories', OLD.id, OLD.name,
    CONCAT('Category "', OLD.name, '" (ID ', OLD.id, ') was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `entity_label` varchar(150) DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `entity_type`, `entity_id`, `entity_label`, `message`, `is_read`, `created_at`) VALUES
(1, 'products', 7, 'Set Sale', 'Product \"Set Sale\" (ID 7) was deleted from the database.', 1, '2026-09-03 02:35:15'),
(2, 'products', 12, 'Kids Jumper Set (4)', 'Product \"Kids Jumper Set (4)\" (ID 12) was deleted from the database.', 1, '2026-09-03 02:35:45'),
(3, 'orders', 1, 'Order #1', 'Order #1 (total $6.00) was deleted from the database.', 1, '2026-09-03 03:07:42'),
(4, 'products', 10, 'Shirt', 'Product \"Shirt\" (ID 10) was deleted from the database.', 1, '2026-09-22 06:26:33');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Triggers `orders`
--
DELIMITER $$
CREATE TRIGGER `trg_orders_after_delete` AFTER DELETE ON `orders` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('orders', OLD.order_id, CONCAT('Order #', OLD.order_id),
    CONCAT('Order #', OLD.order_id, ' (total $', OLD.total_amount, ') was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `item_name` varchar(150) NOT NULL,
  `size` varchar(20) DEFAULT NULL,
  `condition_grade` enum('new','like_new','good','fair') DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Triggers `order_items`
--
DELIMITER $$
CREATE TRIGGER `trg_order_items_after_delete` AFTER DELETE ON `order_items` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('order_items', OLD.order_item_id, OLD.item_name,
    CONCAT('Order item "', OLD.item_name, '" (from order #', OLD.order_id, ') was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `condition_grade` enum('new','like_new','good','fair') DEFAULT 'good',
  `image_url` varchar(255) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT '0',
  `status` enum('available','sold','reserved') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category_id`, `price`, `condition_grade`, `image_url`, `stock_quantity`, `status`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(7, 'Set Sale', NULL, 1, '10.00', 'good', 'http://localhost:5000/uploads/1788162294512-904871586.jpeg', 5, 'available', '2026-08-31 07:45:36', '2026-09-02 11:36:42', 0, NULL),
(8, 'Maxi Skirt', NULL, 2, '10.00', 'new', 'http://localhost:5000/uploads/1788342883308-375525302.jpg', 1, 'available', '2026-09-02 09:54:56', '2026-09-02 09:54:56', 0, NULL),
(9, 'Wide leg Jeans', NULL, 2, '7.00', 'good', 'http://localhost:5000/uploads/1788345220167-736528003.webp', 1, 'available', '2026-09-02 10:33:49', '2026-09-02 10:33:49', 0, NULL),
(11, 'Jewelry Set', NULL, 4, '11.00', 'fair', 'http://localhost:5000/uploads/1788346263987-803576183.jpeg', 1, 'available', '2026-09-02 10:51:10', '2026-09-02 10:51:10', 0, NULL),
(12, 'Kids Jumper Set (4)', NULL, 3, '8.00', 'fair', 'http://localhost:5000/uploads/1788346295516-135299924.jpeg', 1, 'sold', '2026-09-02 10:51:43', '2026-09-02 12:58:53', 0, NULL),
(14, 'Jumka', NULL, 4, '5.00', 'good', 'http://localhost:5000/uploads/1788348460503-912541284.jpeg', 1, 'available', '2026-09-02 11:27:55', '2026-09-02 11:27:55', 0, NULL),
(16, 'Maxi Dress', NULL, 2, '13.00', 'new', 'http://localhost:5000/uploads/1788348506633-329352627.png', 1, 'reserved', '2026-09-02 11:28:41', '2026-09-03 01:31:09', 0, NULL),
(17, '2pcs Set', NULL, 3, '6.99', 'good', 'http://localhost:5000/uploads/1788348534036-985113144.jpg', 3, 'available', '2026-09-02 11:29:25', '2026-09-03 01:30:44', 0, NULL),
(18, 'Chain', NULL, 4, '4.00', 'good', 'http://localhost:5000/uploads/1788404344243-733493578.jpeg', 1, 'available', '2026-09-03 02:59:10', '2026-09-22 06:41:20', 0, NULL),
(19, 'Top', NULL, 2, '4.82', 'like_new', 'http://localhost:5000/uploads/1790425770924-424325111.jpeg', 1, 'available', '2026-09-26 12:29:35', '2026-09-26 12:29:51', 0, NULL);

--
-- Triggers `products`
--
DELIMITER $$
CREATE TRIGGER `trg_products_after_delete` AFTER DELETE ON `products` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('products', OLD.id, OLD.name,
    CONCAT('Product "', OLD.name, '" (ID ', OLD.id, ') was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `store_name` varchar(120) NOT NULL DEFAULT 'Value City',
  `contact_email` varchar(120) DEFAULT NULL,
  `location` varchar(160) DEFAULT NULL,
  `low_stock_threshold` int(11) NOT NULL DEFAULT '5',
  `stock_target` int(11) NOT NULL DEFAULT '10'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `store_name`, `contact_email`, `location`, `low_stock_threshold`, `stock_target`) VALUES
(1, 'Value City', NULL, NULL, 5, 10);

--
-- Triggers `settings`
--
DELIMITER $$
CREATE TRIGGER `trg_settings_after_delete` AFTER DELETE ON `settings` FOR EACH ROW BEGIN
  INSERT INTO notifications (entity_type, entity_id, entity_label, message)
  VALUES ('settings', OLD.id, OLD.store_name,
    CONCAT('Settings row for "', OLD.store_name, '" (ID ', OLD.id, ') was deleted from the database.'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `phone_number`, `address`, `created_at`, `updated_at`) VALUES
(1, 'Test User', 'test@example.com', '$2b$10$replace_with_real_bcrypt_hash', '9990000', 'Suva, Fiji', '2026-09-02 09:23:17', '2026-09-02 09:23:17'),
(2, 'Lora', 'lora@gmail.com', '$2b$10$iiZx1lusPFmr/8j426ibou72m3VdCprtovyWhQMLFS.t5topHTJDK', '2765677', NULL, '2026-09-02 09:42:14', '2026-09-02 09:42:14'),
(4, 'shifali shilvia', 'shilviashifali@gmail.com', '$2b$10$PmDmV14y18ba95c/fIyOAeMnE6xaIkm8VJSn3Y3E7SsuROtmQwwe2', NULL, NULL, '2026-09-03 03:02:43', '2026-09-03 03:02:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_category` (`category_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
