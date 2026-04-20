-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2026 at 09:53 AM
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
-- Database: `county_connect`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointment_requests`
--

CREATE TABLE `appointment_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `service_category` enum('Health','Education','Social Support') NOT NULL,
  `facility_id` int(10) UNSIGNED DEFAULT NULL,
  `program_id` int(10) UNSIGNED DEFAULT NULL,
  `service_type` varchar(100) NOT NULL,
  `preferred_date` date NOT NULL,
  `preferred_time` time DEFAULT NULL,
  `urgency` enum('Low','Medium','High','Emergency') NOT NULL DEFAULT 'Medium',
  `description` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(10) UNSIGNED DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `citizens`
--

CREATE TABLE `citizens` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_code` varchar(30) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `id_number` varchar(30) NOT NULL,
  `gender` varchar(20) NOT NULL DEFAULT '',
  `age` int(11) NOT NULL,
  `ward` varchar(60) NOT NULL,
  `status` enum('Active','Deceased') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `citizens`
--

INSERT INTO `citizens` (`id`, `citizen_code`, `full_name`, `id_number`, `gender`, `age`, `ward`, `status`, `created_at`) VALUES
(1, 'CIT-001', 'John Kamau', '12345678', 'Male', 34, 'Ward 1', 'Active', '2026-02-05 12:37:26'),
(2, 'CIT-002', 'Mary Wanjiku', '23456789', 'Female', 28, 'Ward 3', 'Active', '2026-02-05 12:37:26'),
(3, 'CIT-003', 'Peter Ochieng', '34567890', 'Male', 45, 'Ward 2', 'Active', '2026-02-05 12:37:26'),
(4, 'CIT-004', 'Grace Muthoni', '45678901', 'Female', 52, 'Ward 1', 'Deceased', '2026-02-05 12:37:26'),
(5, 'CIT-005', 'James Kiprop', '56789012', 'Male', 19, 'Ward 4', 'Active', '2026-02-05 12:37:26'),
(6, 'CIT-006', 'Sarah Akinyi', '67890123', 'Female', 37, 'Ward 5', 'Active', '2026-02-05 12:37:26'),
(7, 'CIT-007', 'David Mwangi', '78901234', 'Male', 41, 'Ward 2', 'Active', '2026-02-05 12:37:26'),
(8, 'CIT-008', 'Jane Njeri', '89012345', 'Female', 25, 'Ward 6', 'Active', '2026-02-05 12:37:26');

-- --------------------------------------------------------

--
-- Table structure for table `disease_cases`
--

CREATE TABLE `disease_cases` (
  `id` int(10) UNSIGNED NOT NULL,
  `disease` varchar(120) NOT NULL,
  `cases` int(11) NOT NULL DEFAULT 0,
  `reported_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `education_enrollments`
--

CREATE TABLE `education_enrollments` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `school_id` int(10) UNSIGNED DEFAULT NULL,
  `level` enum('Pre-Primary','Primary','Secondary','Tertiary') NOT NULL,
  `year` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `education_facilities`
--

CREATE TABLE `education_facilities` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('Pre-primary','Primary School','Secondary School','Tertiary Institution','Vocational Training','Special Education') NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `ward` varchar(60) NOT NULL,
  `sub_county` varchar(60) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `current_enrollment` int(11) DEFAULT 0,
  `status` enum('Active','Inactive','Under Construction') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `education_facilities`
--

INSERT INTO `education_facilities` (`id`, `name`, `type`, `level`, `ward`, `sub_county`, `address`, `phone`, `email`, `capacity`, `current_enrollment`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Ward 1 Primary School', 'Primary School', 'Primary', 'Ward 1', 'Central Sub-County', '111 Education Street', '+254 700 567 890', NULL, 500, 450, 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(2, 'Ward 2 Secondary School', 'Secondary School', 'Secondary', 'Ward 2', 'North Sub-County', '222 Learning Road', '+254 700 678 901', NULL, 800, 720, 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(3, 'County Vocational Training Center', 'Vocational Training', 'Tertiary', 'Ward 3', 'South Sub-County', '333 Skills Avenue', '+254 700 789 012', NULL, 200, 150, 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(4, 'Ward 1 Pre-Primary School', 'Pre-primary', 'Pre-primary', 'Ward 1', 'Central Sub-County', '444 Early Learning Lane', '+254 700 890 123', NULL, 100, 85, 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21');

-- --------------------------------------------------------

--
-- Table structure for table `education_services`
--

CREATE TABLE `education_services` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `service_type` enum('Enrollment','Attendance','Exam Results','Transfer','Dropout','Graduation','Scholarship','Other') NOT NULL,
  `institution_name` varchar(150) NOT NULL,
  `institution_level` enum('Pre-primary','Primary','Secondary','Tertiary','Vocational','Other') NOT NULL,
  `grade_level` varchar(50) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `service_date` date NOT NULL,
  `status` enum('Active','Completed','Pending','Cancelled') NOT NULL DEFAULT 'Active',
  `performance_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`performance_data`)),
  `notes` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_facilities`
--

CREATE TABLE `health_facilities` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('Hospital','Clinic','Health Center','Dispensary','Maternity Home','Specialized Center') NOT NULL,
  `level` enum('Level 1','Level 2','Level 3','Level 4','Level 5','Level 6') NOT NULL,
  `ward` varchar(60) NOT NULL,
  `sub_county` varchar(60) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `services_offered` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`services_offered`)),
  `capacity` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive','Under Construction') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `health_facilities`
--

INSERT INTO `health_facilities` (`id`, `name`, `type`, `level`, `ward`, `sub_county`, `address`, `phone`, `email`, `services_offered`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, 'County General Hospital', 'Hospital', 'Level 5', 'Central Ward', 'Central Sub-County', '123 Main Street', '+254700000000', 'info@countyhospital.go.ke', NULL, 200, 'Active', '2026-04-08 18:41:48', '2026-04-08 18:41:48'),
(2, 'Central Health Center', 'Health Center', 'Level 3', 'Central Ward', 'Central Sub-County', '456 Health Avenue', '+254700000001', 'central@health.go.ke', NULL, 50, 'Active', '2026-04-08 18:42:03', '2026-04-08 18:42:03'),
(3, 'Rural Dispensary', 'Dispensary', 'Level 2', 'Rural Ward', 'Rural Sub-County', '789 Village Road', '+254700000002', 'rural@health.go.ke', NULL, 20, 'Active', '2026-04-08 18:42:03', '2026-04-08 18:42:03');

-- --------------------------------------------------------

--
-- Table structure for table `health_records`
--

CREATE TABLE `health_records` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_services`
--

CREATE TABLE `health_services` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `service_type` enum('Routine Checkup','Emergency Care','Vaccination','Maternal Care','Child Health','Chronic Disease','Other') NOT NULL,
  `service_description` text DEFAULT NULL,
  `facility_name` varchar(150) DEFAULT NULL,
  `service_date` date NOT NULL,
  `provider_name` varchar(150) DEFAULT NULL,
  `status` enum('Scheduled','Completed','Cancelled','No Show') NOT NULL DEFAULT 'Completed',
  `notes` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `households`
--

CREATE TABLE `households` (
  `id` int(10) UNSIGNED NOT NULL,
  `household_code` varchar(30) NOT NULL,
  `head_of_household_id` int(10) UNSIGNED DEFAULT NULL,
  `address` text DEFAULT NULL,
  `ward` varchar(60) NOT NULL,
  `sub_county` varchar(60) DEFAULT NULL,
  `family_type` enum('Nuclear','Extended','Single Parent','Other') DEFAULT 'Nuclear',
  `monthly_income` decimal(10,2) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `immunizations`
--

CREATE TABLE `immunizations` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `vaccine` varchar(80) NOT NULL,
  `given_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('System','Service','Report','Alert','Reminder') NOT NULL DEFAULT 'System',
  `priority` enum('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `action_url` varchar(500) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `email`, `otp`, `expires_at`, `created_at`) VALUES
(1, 'admin@county.go.ke', '133411', '2026-02-06 11:15:56', '2026-02-06 11:00:56');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `department` varchar(50) NOT NULL,
  `period` varchar(50) NOT NULL,
  `file_type` enum('PDF','EXCEL') NOT NULL DEFAULT 'PDF',
  `file_size` varchar(30) NOT NULL DEFAULT '0 KB',
  `generated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `level` enum('Pre-Primary','Primary','Secondary','Tertiary') NOT NULL,
  `ward` varchar(60) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `name`, `level`, `ward`, `created_at`) VALUES
(1, 'Ward 1 Primary School', 'Primary', 'Ward 1', '2026-02-05 12:37:27'),
(2, 'Ward 2 Secondary School', 'Secondary', 'Ward 2', '2026-02-05 12:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `service_tracking`
--

CREATE TABLE `service_tracking` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `service_category` enum('Health','Education','Social Support') NOT NULL,
  `service_id` int(10) UNSIGNED NOT NULL,
  `action` enum('Created','Updated','Completed','Cancelled','Rescheduled') NOT NULL,
  `action_date` datetime NOT NULL DEFAULT current_timestamp(),
  `performed_by` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(120) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('address', 'P.O. Box 1234, Sample Town', '2026-02-05 12:37:26'),
('countyCode', 'SC-001', '2026-02-05 12:37:26'),
('countyName', 'Sample County', '2026-02-05 12:37:26');

-- --------------------------------------------------------

--
-- Table structure for table `social_programs`
--

CREATE TABLE `social_programs` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('Cash Transfer','Food Assistance','Housing Support','Medical Aid','Education Support','Disability Support','Elderly Care','Orphan Support','Other') NOT NULL,
  `description` text DEFAULT NULL,
  `eligibility_criteria` text DEFAULT NULL,
  `coverage_area` varchar(100) DEFAULT NULL,
  `budget_allocated` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'KES',
  `status` enum('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `social_programs`
--

INSERT INTO `social_programs` (`id`, `name`, `type`, `description`, `eligibility_criteria`, `coverage_area`, `budget_allocated`, `currency`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Orphans and Vulnerable Children Program', 'Orphan Support', 'Support for orphaned and vulnerable children', 'Children under 18 who have lost one or both parents', 'All Wards', 5000000.00, 'KES', 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(2, 'Elderly Cash Transfer', 'Elderly Care', 'Monthly cash transfers for elderly citizens', 'Citizens aged 65 and above', 'All Wards', 10000000.00, 'KES', 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(3, 'Disability Support Program', 'Disability Support', 'Support for citizens with disabilities', 'Registered persons with disabilities', 'All Wards', 3000000.00, 'KES', 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21'),
(4, 'Food Security Program', 'Food Assistance', 'Food assistance for vulnerable households', 'Households below poverty line', 'Ward 1, Ward 2', 2000000.00, 'KES', 'Active', '2026-04-08 18:40:21', '2026-04-08 18:40:21');

-- --------------------------------------------------------

--
-- Table structure for table `social_services`
--

CREATE TABLE `social_services` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `service_type` enum('Cash Transfer','Food Assistance','Housing Support','Medical Aid','Education Support','Disability Support','Elderly Care','Orphan Support','Other') NOT NULL,
  `program_name` varchar(150) NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'KES',
  `frequency` enum('One-time','Weekly','Monthly','Quarterly','Annually') DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Completed','Suspended','Terminated') NOT NULL DEFAULT 'Active',
  `eligibility_criteria` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `department` varchar(100) NOT NULL DEFAULT 'All',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `department`, `status`, `last_login_at`, `created_at`) VALUES
(2, 'Ezekiel Malova', 'ezekielbusolo@gmail.com', '$2y$10$P4J/5AUNGpsvv76yRcXTOOmNFa0J9iBFWSwzt8aFdxMzNJ8KRMRD6', 'admin', 'All', 'Active', '2026-04-08 18:21:38', '2026-02-05 15:50:02'),
(3, 'Admin User', 'admin@county.go.ke', '$2y$10$KJv7BynwBc2B2Cp/8X6YtOThpwdmYLvCSmi0vUuYW7iZNmJEO4aCW', 'admin', 'All', 'Active', '2026-04-01 14:06:03', '2026-02-05 19:41:46'),
(4, 'MIGIZI JARED', 'migizijared@gmail.com', '$2y$10$5QUdX0e6c5UlD1puVn6WNe76srI76fLzioeWiZLDixSM5e2cnh3q6', 'admin', 'All', 'Active', '2026-02-06 10:28:15', '2026-02-06 10:26:51'),
(5, 'Steve', 'okothroni863@gmail.com', '$2y$10$ls40wDSXvndYhxlbI4e2peytMxpCILiVjjP7zeXY5z9TMLBtGqOsy', 'admin', 'All', 'Active', NULL, '2026-03-13 17:14:13');

-- --------------------------------------------------------

--
-- Table structure for table `vulnerable_cases`
--

CREATE TABLE `vulnerable_cases` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `issue` varchar(200) NOT NULL,
  `ward` varchar(60) NOT NULL,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `status` enum('Open','Closed') NOT NULL DEFAULT 'Open',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vulnerable_cases`
--

INSERT INTO `vulnerable_cases` (`id`, `citizen_id`, `name`, `issue`, `ward`, `priority`, `status`, `created_at`) VALUES
(1, NULL, 'Maria Wambui', 'Housing Emergency', 'Ward 3', 'High', 'Open', '2026-02-05 12:37:27'),
(2, NULL, 'Joseph Otieno', 'Medical Assistance', 'Ward 1', 'Critical', 'Open', '2026-02-05 12:37:27'),
(3, NULL, 'Agnes Chebet', 'Food Security', 'Ward 5', 'Medium', 'Open', '2026-02-05 12:37:27'),
(4, NULL, 'Samuel Mwangi', 'Child Protection', 'Ward 2', 'High', 'Open', '2026-02-05 12:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `welfare_beneficiaries`
--

CREATE TABLE `welfare_beneficiaries` (
  `id` int(10) UNSIGNED NOT NULL,
  `citizen_id` int(10) UNSIGNED NOT NULL,
  `program` varchar(120) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `welfare_beneficiaries`
--

INSERT INTO `welfare_beneficiaries` (`id`, `citizen_id`, `program`, `status`, `created_at`) VALUES
(1, 1, 'Cash Transfer', 'Active', '2026-02-05 12:37:27'),
(2, 2, 'Cash Transfer', 'Active', '2026-02-05 12:37:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_requests_citizen` (`citizen_id`),
  ADD KEY `idx_appointment_requests_category` (`service_category`),
  ADD KEY `idx_appointment_requests_status` (`status`),
  ADD KEY `idx_appointment_requests_date` (`preferred_date`),
  ADD KEY `fk_appointment_requests_approver` (`approved_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_user` (`user_id`),
  ADD KEY `idx_audit_logs_table` (`table_name`),
  ADD KEY `idx_audit_logs_date` (`created_at`);

--
-- Indexes for table `citizens`
--
ALTER TABLE `citizens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_citizens_code` (`citizen_code`),
  ADD UNIQUE KEY `uq_citizens_id_number` (`id_number`),
  ADD KEY `idx_citizens_ward` (`ward`);

--
-- Indexes for table `disease_cases`
--
ALTER TABLE `disease_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_disease_cases_reported_at` (`reported_at`);

--
-- Indexes for table `education_enrollments`
--
ALTER TABLE `education_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_education_enrollments_citizen` (`citizen_id`),
  ADD KEY `idx_education_enrollments_level_year` (`level`,`year`),
  ADD KEY `fk_education_enrollments_school` (`school_id`);

--
-- Indexes for table `education_facilities`
--
ALTER TABLE `education_facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_education_facilities_ward` (`ward`),
  ADD KEY `idx_education_facilities_type` (`type`),
  ADD KEY `idx_education_facilities_status` (`status`);

--
-- Indexes for table `education_services`
--
ALTER TABLE `education_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_education_services_citizen` (`citizen_id`),
  ADD KEY `idx_education_services_institution` (`institution_name`),
  ADD KEY `idx_education_services_type` (`service_type`),
  ADD KEY `fk_education_services_creator` (`created_by`);

--
-- Indexes for table `health_facilities`
--
ALTER TABLE `health_facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_health_facilities_ward` (`ward`),
  ADD KEY `idx_health_facilities_type` (`type`),
  ADD KEY `idx_health_facilities_status` (`status`);

--
-- Indexes for table `health_records`
--
ALTER TABLE `health_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_health_records_citizen` (`citizen_id`);

--
-- Indexes for table `health_services`
--
ALTER TABLE `health_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_health_services_citizen` (`citizen_id`),
  ADD KEY `idx_health_services_date` (`service_date`),
  ADD KEY `idx_health_services_type` (`service_type`),
  ADD KEY `fk_health_services_creator` (`created_by`);

--
-- Indexes for table `households`
--
ALTER TABLE `households`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_households_code` (`household_code`),
  ADD KEY `idx_households_ward` (`ward`),
  ADD KEY `fk_households_head` (`head_of_household_id`);

--
-- Indexes for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_immunizations_citizen` (`citizen_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`is_read`),
  ADD KEY `idx_notifications_type` (`type`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_password_resets_email` (`email`),
  ADD KEY `idx_password_resets_expires` (`expires_at`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_generated_at` (`generated_at`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_tracking`
--
ALTER TABLE `service_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_service_tracking_citizen` (`citizen_id`),
  ADD KEY `idx_service_tracking_category` (`service_category`),
  ADD KEY `idx_service_tracking_date` (`action_date`),
  ADD KEY `fk_service_tracking_performer` (`performed_by`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `social_programs`
--
ALTER TABLE `social_programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_social_programs_type` (`type`),
  ADD KEY `idx_social_programs_status` (`status`);

--
-- Indexes for table `social_services`
--
ALTER TABLE `social_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_social_services_citizen` (`citizen_id`),
  ADD KEY `idx_social_services_program` (`program_name`),
  ADD KEY `idx_social_services_type` (`service_type`),
  ADD KEY `fk_social_services_creator` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- Indexes for table `vulnerable_cases`
--
ALTER TABLE `vulnerable_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vulnerable_cases_status` (`status`),
  ADD KEY `fk_vulnerable_cases_citizen` (`citizen_id`);

--
-- Indexes for table `welfare_beneficiaries`
--
ALTER TABLE `welfare_beneficiaries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_welfare_beneficiaries_citizen` (`citizen_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `citizens`
--
ALTER TABLE `citizens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `disease_cases`
--
ALTER TABLE `disease_cases`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `education_enrollments`
--
ALTER TABLE `education_enrollments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `education_facilities`
--
ALTER TABLE `education_facilities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `education_services`
--
ALTER TABLE `education_services`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `health_facilities`
--
ALTER TABLE `health_facilities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `health_records`
--
ALTER TABLE `health_records`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `health_services`
--
ALTER TABLE `health_services`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `households`
--
ALTER TABLE `households`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `immunizations`
--
ALTER TABLE `immunizations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `service_tracking`
--
ALTER TABLE `service_tracking`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `social_programs`
--
ALTER TABLE `social_programs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `social_services`
--
ALTER TABLE `social_services`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vulnerable_cases`
--
ALTER TABLE `vulnerable_cases`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `welfare_beneficiaries`
--
ALTER TABLE `welfare_beneficiaries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD CONSTRAINT `fk_appointment_requests_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_appointment_requests_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `education_enrollments`
--
ALTER TABLE `education_enrollments`
  ADD CONSTRAINT `fk_education_enrollments_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_education_enrollments_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `education_services`
--
ALTER TABLE `education_services`
  ADD CONSTRAINT `fk_education_services_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_education_services_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `health_records`
--
ALTER TABLE `health_records`
  ADD CONSTRAINT `fk_health_records_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `health_services`
--
ALTER TABLE `health_services`
  ADD CONSTRAINT `fk_health_services_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_health_services_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `households`
--
ALTER TABLE `households`
  ADD CONSTRAINT `fk_households_head` FOREIGN KEY (`head_of_household_id`) REFERENCES `citizens` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD CONSTRAINT `fk_immunizations_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `service_tracking`
--
ALTER TABLE `service_tracking`
  ADD CONSTRAINT `fk_service_tracking_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_service_tracking_performer` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `social_services`
--
ALTER TABLE `social_services`
  ADD CONSTRAINT `fk_social_services_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_social_services_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vulnerable_cases`
--
ALTER TABLE `vulnerable_cases`
  ADD CONSTRAINT `fk_vulnerable_cases_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `welfare_beneficiaries`
--
ALTER TABLE `welfare_beneficiaries`
  ADD CONSTRAINT `fk_welfare_beneficiaries_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
