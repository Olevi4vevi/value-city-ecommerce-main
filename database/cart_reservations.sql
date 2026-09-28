-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 26, 2026 at 01:41 PM
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
-- Table structure for table `cart_reservations`
--

CREATE TABLE `cart_reservations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reserved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `cart_reservations`
--

INSERT INTO `cart_reservations` (`id`, `user_id`, `product_id`, `quantity`, `reserved_at`, `expires_at`) VALUES
(1, 2, 10, 1, '2026-09-26 11:02:26', '2026-09-27 12:45:37'),
(3, 2, 11, 1, '2026-09-26 11:04:12', '2026-09-27 11:04:13'),
(4, 4, 9, 1, '2026-09-26 12:18:14', '2026-09-25 12:00:00'),
(5, 2, 17, 1, '2026-09-26 12:31:13', '2026-09-27 12:31:14'),
(6, 4, 14, 1, '2026-09-26 12:39:20', '2026-09-26 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart_reservations`
--
ALTER TABLE `cart_reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_reservation_product` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_reservations`
--
ALTER TABLE `cart_reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_reservations`
--
ALTER TABLE `cart_reservations`
  ADD CONSTRAINT `fk_reservation_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reservation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
