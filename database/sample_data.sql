-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2026 at 06:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smartlib`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_logs`
--

CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) NOT NULL,
  `genre` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `available_quantity` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `genre`, `quantity`, `available_quantity`, `description`, `image`, `created_at`, `updated_at`) VALUES
(1, 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 5, 5, 'A gripping tale of racial injustice and childhood innocence', 'https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg', '2026-05-23 01:48:59', '2026-06-15 12:51:06'),
(2, '1984', 'George Orwell', 'Dystopian', 4, 4, 'A dark future society under totalitarian rule', 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', '2026-05-23 01:48:59', '2026-06-15 14:26:35'),
(3, 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 6, 5, 'A classic American novel set in the Jazz Age', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', '2026-05-23 01:48:59', '2026-06-15 14:26:24'),
(4, 'Pride and Prejudice', 'Jane Austen', 'Romance', 5, 4, 'A witty exploration of love and marriage', 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', '2026-05-23 01:48:59', '2026-06-15 14:26:23'),
(5, 'The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 4, 4, 'A young man\'s journey through New York City', 'https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg', '2026-05-23 01:48:59', '2026-06-13 01:45:30'),
(6, 'Python Programming', 'Mark Lutz', 'Technical', 5, 5, 'Comprehensive guide to Python', '/uploads/book_images/6257009_466b-b76558f19cdfeeee.jpg', '2026-05-23 01:48:59', '2026-06-15 14:26:25'),
(7, 'Clean Code', 'Robert Martin', 'Technical', 3, 2, 'A guide to writing better code', 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg', '2026-05-23 01:48:59', '2026-06-15 14:26:34'),
(8, 'Noli Me Tangere', 'Dr. Jose Rizal', 'Historical Fiction', 10, 9, 'A novel exposing social injustices and abuses during Spanish rule in the Philippines.', '/uploads/book_images/27-df891fed2a570f74.jpg', '2026-06-13 01:33:29', '2026-06-17 16:24:15'),
(10, 'Cultural Center of the Philippines Encyclopedia of Philippine Art', 'Dr. Nicanor G. Tiongson', 'Reference', 10, 8, 'A comprehensive encyclopedia documenting the rich artistic and cultural heritage of the Philippines. Published by the Cultural Center of the Philippines, it covers visual arts, architecture, music, dance, theater, literature, film, and other cultural traditions. The work serves as an authoritative reference for students, researchers, educators, and anyone interested in Philippine art and culture.', '/uploads/book_images/images_3-cf80363fe751fc51.jpg', '2026-06-13 01:59:54', '2026-06-17 16:22:22'),
(11, 'El Filibusterismo', 'Dr. Jose Rizal', 'Historical Fiction', 15, 15, 'Sequel to Noli Me Tangere that explores revolution, oppression, and the struggle for reform.', '/uploads/book_images/images_2-cfd0a063948899a0.jpg', '2026-06-13 14:13:08', '2026-06-15 07:14:40');

-- --------------------------------------------------------

--
-- Table structure for table `borrow_records`
--

CREATE TABLE `borrow_records` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `borrow_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `due_date` datetime NOT NULL,
  `status` enum('borrowed','returned','overdue','pending_return') DEFAULT 'borrowed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `return_request_date` datetime DEFAULT NULL,
  `actual_return_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrow_records`
--

INSERT INTO `borrow_records` (`id`, `user_id`, `book_id`, `borrow_date`, `due_date`, `status`, `created_at`, `updated_at`, `return_request_date`, `actual_return_date`) VALUES
(5, 6, 2, '2026-05-23 02:30:50', '2026-06-06 00:00:00', 'returned', '2026-05-23 02:30:50', '2026-05-29 07:43:12', NULL, NULL),
(6, 6, 7, '2026-05-23 02:30:58', '2026-06-06 00:00:00', 'returned', '2026-05-23 02:30:58', '2026-05-29 07:43:10', NULL, NULL),
(7, 6, 4, '2026-05-23 02:31:04', '2026-06-06 00:00:00', 'returned', '2026-05-23 02:31:04', '2026-05-29 07:43:07', NULL, NULL),
(8, 6, 1, '2026-05-29 07:42:47', '2026-06-12 00:00:00', 'returned', '2026-05-29 07:42:47', '2026-05-29 07:43:14', NULL, NULL),
(9, 6, 7, '2026-05-29 08:19:48', '2026-06-12 00:00:00', 'returned', '2026-05-29 08:19:48', '2026-05-29 08:45:09', NULL, NULL),
(10, 6, 5, '2026-05-29 08:35:26', '2026-06-12 00:00:00', 'returned', '2026-05-29 08:35:26', '2026-05-29 08:41:44', NULL, NULL),
(11, 6, 4, '2026-05-29 08:44:25', '2026-06-12 00:00:00', 'returned', '2026-05-29 08:44:25', '2026-05-29 08:44:45', NULL, NULL),
(12, 27, 3, '2026-06-12 15:42:42', '2026-06-26 15:42:35', 'returned', '2026-06-12 15:42:42', '2026-06-12 15:48:31', '2026-06-12 15:43:00', '2026-06-12 15:48:31'),
(13, 6, 4, '2026-06-12 15:58:42', '2026-06-26 15:58:39', 'returned', '2026-06-12 15:58:42', '2026-06-12 16:02:52', '2026-06-12 16:02:18', '2026-06-12 16:02:52'),
(14, 6, 2, '2026-06-12 16:00:37', '2026-06-13 17:00:00', 'returned', '2026-06-12 16:00:37', '2026-06-13 01:44:37', '2026-06-13 01:44:02', '2026-06-13 01:44:37'),
(15, 27, 10, '2026-06-13 02:03:25', '2026-06-13 02:10:55', 'returned', '2026-06-13 02:03:25', '2026-06-13 08:59:45', NULL, '2026-06-13 08:59:45'),
(17, 27, 10, '2026-06-13 09:03:12', '2026-06-27 09:03:09', 'returned', '2026-06-13 09:03:12', '2026-06-13 14:40:45', '2026-06-13 14:14:52', '2026-06-13 14:40:45'),
(18, 30, 3, '2026-06-13 09:04:44', '2026-06-20 09:04:33', 'returned', '2026-06-13 09:04:44', '2026-06-14 01:59:22', '2026-06-14 01:56:58', '2026-06-14 01:59:22'),
(19, 27, 7, '2026-06-13 13:56:58', '2026-06-27 13:56:57', 'borrowed', '2026-06-13 13:56:58', '2026-06-15 04:33:52', NULL, NULL),
(20, 27, 2, '2026-06-13 13:57:03', '2026-06-27 13:57:02', 'returned', '2026-06-13 13:57:03', '2026-06-15 12:23:10', '2026-06-15 12:18:11', '2026-06-15 12:23:10'),
(22, 30, 7, '2026-06-13 14:45:11', '2026-06-13 14:46:25', 'returned', '2026-06-13 14:45:11', '2026-06-14 06:13:20', NULL, '2026-06-14 06:13:20'),
(23, 6, 10, '2026-06-14 05:23:28', '2026-06-18 05:23:19', 'borrowed', '2026-06-14 05:23:28', '2026-06-15 04:33:52', NULL, NULL),
(24, 30, 11, '2026-06-14 07:16:34', '2026-06-14 07:17:00', 'returned', '2026-06-14 07:16:34', '2026-06-15 07:14:40', '2026-06-15 07:13:52', '2026-06-15 07:14:40'),
(25, 6, 1, '2026-06-15 04:36:05', '2026-06-20 04:35:54', 'returned', '2026-06-15 04:36:05', '2026-06-15 12:51:06', '2026-06-15 12:50:48', '2026-06-15 12:51:06'),
(26, 6, 4, '2026-06-15 04:41:28', '2026-06-24 04:41:21', 'returned', '2026-06-15 04:41:28', '2026-06-15 14:26:23', '2026-06-15 13:57:11', '2026-06-15 14:26:23'),
(27, 31, 6, '2026-06-15 09:05:14', '2026-06-29 09:05:12', 'returned', '2026-06-15 09:05:14', '2026-06-15 09:06:22', '2026-06-15 09:05:40', '2026-06-15 09:06:22'),
(28, 31, 3, '2026-06-15 09:05:57', '2026-06-21 09:05:52', 'borrowed', '2026-06-15 09:05:57', '2026-06-15 09:05:57', NULL, NULL),
(29, 31, 2, '2026-06-15 09:13:06', '2026-06-16 09:12:56', 'returned', '2026-06-15 09:13:06', '2026-06-15 09:16:44', '2026-06-15 09:13:21', '2026-06-15 09:16:44'),
(30, 31, 8, '2026-06-15 09:17:28', '2026-06-29 09:17:26', 'returned', '2026-06-15 09:17:28', '2026-06-15 09:18:14', '2026-06-15 09:17:50', '2026-06-15 09:18:14'),
(31, 31, 4, '2026-06-15 09:20:34', '2026-06-15 09:21:30', 'overdue', '2026-06-15 09:20:34', '2026-06-15 09:21:30', NULL, NULL),
(32, 27, 10, '2026-06-15 12:11:29', '2026-06-15 12:13:13', 'overdue', '2026-06-15 12:11:29', '2026-06-15 12:13:13', NULL, NULL),
(33, 30, 8, '2026-06-15 13:38:44', '2026-06-29 13:38:42', 'returned', '2026-06-15 13:38:44', '2026-06-15 13:51:44', '2026-06-15 13:39:17', '2026-06-15 13:51:44'),
(39, 6, 3, '2026-06-15 14:22:57', '2026-06-15 14:23:03', 'returned', '2026-06-15 14:22:57', '2026-06-15 14:26:24', '2026-06-15 14:25:15', '2026-06-15 14:26:24'),
(40, 6, 6, '2026-06-15 14:23:15', '2026-06-15 14:24:03', 'returned', '2026-06-15 14:23:15', '2026-06-15 14:26:25', '2026-06-15 14:25:17', '2026-06-15 14:26:25'),
(41, 6, 7, '2026-06-15 14:24:10', '2026-06-15 14:25:04', 'returned', '2026-06-15 14:24:10', '2026-06-15 14:26:34', '2026-06-15 14:25:18', '2026-06-15 14:26:34'),
(42, 6, 2, '2026-06-15 14:24:20', '2026-06-15 14:25:12', 'returned', '2026-06-15 14:24:20', '2026-06-15 14:26:35', '2026-06-15 14:25:31', '2026-06-15 14:26:35'),
(43, 6, 8, '2026-06-15 14:24:38', '2026-06-15 14:25:32', 'returned', '2026-06-15 14:24:38', '2026-06-17 15:28:00', '2026-06-15 14:26:58', '2026-06-17 15:28:00'),
(50, 30, 10, '2026-06-17 16:10:37', '2026-06-17 16:11:09', 'returned', '2026-06-17 16:10:37', '2026-06-17 16:22:22', '2026-06-17 16:11:50', '2026-06-18 00:22:22'),
(53, 6, 8, '2026-06-17 16:24:15', '2026-06-18 00:25:01', 'overdue', '2026-06-17 16:24:15', '2026-06-17 16:25:05', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title` varchar(255) NOT NULL,
  `book_title` varchar(255) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `is_read`, `created_at`, `title`, `book_title`, `due_date`, `updated_at`) VALUES
(1, 6, 'Your borrowed book \'To Kill a Mockingbird\' is due on 2026-06-20 04:35 AM. Please return it on or before the due date.', 1, '2026-06-15 04:37:00', 'Book Due Reminder', 'To Kill a Mockingbird', '2026-06-20 04:35:54', '2026-06-15 04:38:33'),
(2, 6, 'Your borrowed book \'Cultural Center of the Philippines Encyclopedia of Philippine Art\' is due on 2026-06-18 05:23 AM. Please return it on or before the due date.', 1, '2026-06-15 04:37:04', 'Book Due Reminder', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-18 05:23:19', '2026-06-15 04:38:35'),
(3, 6, 'Your borrowed book \'Cultural Center of the Philippines Encyclopedia of Philippine Art\' is due on 2026-06-18 05:23 AM. Please return it on or before the due date.', 1, '2026-06-15 04:39:40', 'Book Due Reminder', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-18 05:23:19', '2026-06-15 04:40:01'),
(4, 6, 'Your borrowed book \'To Kill a Mockingbird\' is due on 2026-06-20 04:35 AM. Please return it on or before the due date.', 1, '2026-06-15 04:39:42', 'Book Due Reminder', 'To Kill a Mockingbird', '2026-06-20 04:35:54', '2026-06-15 04:40:01'),
(5, 6, 'Your borrowed book \'To Kill a Mockingbird\' is due on 2026-06-20 04:35 AM. Please return it on or before the due date.', 1, '2026-06-15 04:41:00', 'Book Due Reminder', 'To Kill a Mockingbird', '2026-06-20 04:35:54', '2026-06-17 16:23:50'),
(6, 6, 'Your borrowed book \'Cultural Center of the Philippines Encyclopedia of Philippine Art\' is due on 2026-06-18 05:23 AM. Please return it on or before the due date.', 1, '2026-06-15 04:41:01', 'Book Due Reminder', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-18 05:23:19', '2026-06-17 16:23:48'),
(7, 30, 'Your borrowed book \'El Filibusterismo\' is overdue. Please return it.', 1, '2026-06-15 07:11:24', 'Book Due Reminder', 'El Filibusterismo', '2026-06-14 07:17:00', '2026-06-15 13:38:10'),
(8, 6, 'Your borrowed book \'To Kill a Mockingbird\' is due on 2026-06-20 04:35 AM. Please return it on or before the due date.', 1, '2026-06-15 07:11:39', 'Book Due Reminder', 'To Kill a Mockingbird', '2026-06-20 04:35:54', '2026-06-17 16:23:47'),
(9, 6, 'Your borrowed book \'Pride and Prejudice\' is due on 2026-06-24 04:41 AM. Please return it on or before the due date.', 1, '2026-06-15 07:11:40', 'Book Due Reminder', 'Pride and Prejudice', '2026-06-24 04:41:21', '2026-06-17 16:23:46'),
(10, 31, 'Your borrowed book \'The Great Gatsby\' is due on 2026-06-21 09:05 AM. Please return it on or before the due date.', 1, '2026-06-15 09:16:29', 'Book Due Reminder', 'The Great Gatsby', '2026-06-21 09:05:52', '2026-06-15 09:20:39'),
(11, 31, 'Your borrowed book \'The Great Gatsby\' is due on 2026-06-21 09:05 AM. Please return it on or before the due date.', 1, '2026-06-15 09:18:32', 'Book Due Reminder', 'The Great Gatsby', '2026-06-21 09:05:52', '2026-06-15 09:20:39'),
(13, 27, 'Your borrowed book \'1984\' is due on 2026-06-27 01:57 PM. Please return it on or before the due date.', 0, '2026-06-15 12:16:51', 'Book Due Reminder', '1984', '2026-06-27 13:57:02', '2026-06-15 12:16:51'),
(16, 6, 'Your account has been automatically suspended due to reaching five (5) late returns. Please contact an administrator.', 1, '2026-06-17 15:28:00', 'Account Suspended', NULL, NULL, '2026-06-17 16:23:44'),
(21, 31, 'The book \"Pride and Prejudice\" was due on June 15, 2026, 09:21 AM and is now overdue. Please return it as soon as possible.', 0, '2026-06-17 16:00:04', 'Book Overdue Notice', 'Pride and Prejudice', '2026-06-15 09:21:30', '2026-06-17 16:00:04'),
(22, 27, 'The book \"Cultural Center of the Philippines Encyclopedia of Philippine Art\" was due on June 15, 2026, 12:13 PM and is now overdue. Please return it as soon as possible.', 0, '2026-06-17 16:00:04', 'Book Overdue Notice', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-15 12:13:13', '2026-06-17 16:00:04'),
(25, 30, 'Reminder: The book \"Cultural Center of the Philippines Encyclopedia of Philippine Art\" is due tomorrow (June 17, 2026, 04:11 PM). Please return it on time.', 1, '2026-06-17 16:10:40', 'Book Due Reminder', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-17 16:11:09', '2026-06-17 16:11:37'),
(26, 30, 'The book \"Cultural Center of the Philippines Encyclopedia of Philippine Art\" was due on June 17, 2026, 04:11 PM and is now overdue. Please return it as soon as possible.', 1, '2026-06-17 16:11:09', 'Book Overdue Notice', 'Cultural Center of the Philippines Encyclopedia of Philippine Art', '2026-06-17 16:11:09', '2026-06-17 16:22:51'),
(29, 30, 'You have accumulated three (3) late returns. Two (2) more late returns will result in account suspension.', 0, '2026-06-17 16:22:22', 'Account Warning', NULL, NULL, '2026-06-17 16:22:22'),
(30, 6, 'Reminder: The book \"Noli Me Tangere\" is due tomorrow (June 18, 2026, 12:25 AM). Please return it on time.', 0, '2026-06-17 16:24:16', 'Book Due Reminder', 'Noli Me Tangere', '2026-06-18 00:25:01', '2026-06-17 16:24:16'),
(31, 6, 'The book \"Noli Me Tangere\" was due on June 18, 2026, 12:25 AM and is now overdue. Please return it as soon as possible.', 0, '2026-06-17 16:25:05', 'Book Overdue Notice', 'Noli Me Tangere', '2026-06-18 00:25:01', '2026-06-17 16:25:05');

-- --------------------------------------------------------

--
-- Table structure for table `recommendations`
--

CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','librarian','admin') DEFAULT 'student',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `late_return_count` int(11) NOT NULL DEFAULT 0,
  `warning_status` varchar(20) NOT NULL DEFAULT 'None',
  `account_status` varchar(20) NOT NULL DEFAULT 'Active',
  `late_returns` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `student_id`, `name`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`, `failed_login_attempts`, `late_return_count`, `warning_status`, `account_status`, `late_returns`) VALUES
(5, 'ADMIN001', 'Sion', 'admin@gmail.com', '$2a$12$V0o1mmnjqJ4w7Qp6FdTdiOgPxIPdPhfJDo8VYAOKedhfRwYrRjlaC', 'admin', 1, '2026-05-23 01:48:59', '2026-06-14 05:25:21', 0, 0, 'None', 'Active', 0),
(6, '2023-00001-PQ-0', 'Rommel Ronquillo', 'rommelrronquillo@iskolarngbayan.pup.edu.ph', '$2a$12$I7lsCRsGHnwzs/vWrKx1KuZp/z9y9LaCNwYdGsFnpwnGjQCMGWUya', 'student', 1, '2026-05-23 02:30:08', '2026-06-17 16:04:44', 0, 4, 'Pending', 'Active', 0),
(27, '2023-22322-PQ-0', 'Ivan V. Salazar', 'ivanvsalazar@iskolarngbayan.pup.edu.ph', '$2a$12$UpBD0YT2odT8eadYtRPkWO3WlEX7cGBDZTF1wOvDfIH.kkLttEqgi', 'student', 1, '2026-06-12 15:40:39', '2026-06-17 15:26:15', 0, 0, 'None', 'Active', 1),
(30, '2023-11111-PQ-0', 'Erika Wendy D. Gualberto', 'erikawendydgualberto@iskolarngbayan.pup.edu.ph', '$2b$12$x0ONbHQrRYiRbxSTCij1OO./kpxL3XGVtbsyMlrG.mqhUDcxdLV9G', 'student', 1, '2026-06-13 08:58:41', '2026-06-17 16:22:22', 0, 0, 'None', 'Active', 3),
(31, '2023-00298-PQ-0', 'Sebastian G. Villarosa', 'sebastiangvillarosa@iskolarngbayan.pup.edu.ph', '$2b$12$Snz8ZqlJC4vn2pmtgVve1ebPmv2MNL2Qt2XggJcSHC9uxI5PcPwfC', 'student', 1, '2026-06-15 09:04:28', '2026-06-15 09:11:53', 0, 0, 'None', 'Active', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_title` (`title`),
  ADD KEY `idx_author` (`author`),
  ADD KEY `idx_genre` (`genre`);

--
-- Indexes for table `borrow_records`
--
ALTER TABLE `borrow_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_book_id` (`book_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_book_id` (`book_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `borrow_records`
--
ALTER TABLE `borrow_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `recommendations`
--
ALTER TABLE `recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `borrow_records`
--
ALTER TABLE `borrow_records`
  ADD CONSTRAINT `borrow_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `borrow_records_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD CONSTRAINT `recommendations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recommendations_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
