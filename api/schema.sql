CREATE DATABASE IF NOT EXISTS county_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE county_connect;

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'manager') NOT NULL DEFAULT 'staff',
  department VARCHAR(100) NOT NULL DEFAULT 'All',
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Citizens/Residents table
CREATE TABLE IF NOT EXISTS citizens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_code VARCHAR(30) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  id_number VARCHAR(30) NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  date_of_birth DATE NOT NULL,
  age INT GENERATED ALWAYS AS (TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())) STORED,
  phone VARCHAR(20) NULL,
  email VARCHAR(190) NULL,
  ward VARCHAR(60) NOT NULL,
  sub_county VARCHAR(60) NULL,
  household_id INT UNSIGNED NULL,
  status ENUM('Active', 'Deceased', 'Migrated', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_citizens_code (citizen_code),
  UNIQUE KEY uq_citizens_id_number (id_number),
  KEY idx_citizens_ward (ward),
  KEY idx_citizens_household (household_id),
  KEY idx_citizens_status (status)
) ENGINE=InnoDB;

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  household_code VARCHAR(30) NOT NULL,
  head_of_household_id INT UNSIGNED NULL,
  address TEXT NULL,
  ward VARCHAR(60) NOT NULL,
  sub_county VARCHAR(60) NULL,
  family_type ENUM('Nuclear', 'Extended', 'Single Parent', 'Other') DEFAULT 'Nuclear',
  monthly_income DECIMAL(10,2) NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_households_code (household_code),
  KEY idx_households_ward (ward),
  CONSTRAINT fk_households_head FOREIGN KEY (head_of_household_id) REFERENCES citizens(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Update citizens table to add foreign key constraint
ALTER TABLE citizens ADD CONSTRAINT fk_citizens_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL;

-- Health Services table
CREATE TABLE IF NOT EXISTS health_services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  service_type ENUM('Routine Checkup', 'Emergency Care', 'Vaccination', 'Maternal Care', 'Child Health', 'Chronic Disease', 'Other') NOT NULL,
  service_description TEXT NULL,
  facility_name VARCHAR(150) NULL,
  service_date DATE NOT NULL,
  provider_name VARCHAR(150) NULL,
  status ENUM('Scheduled', 'Completed', 'Cancelled', 'No Show') NOT NULL DEFAULT 'Completed',
  notes TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_health_services_citizen (citizen_id),
  KEY idx_health_services_date (service_date),
  KEY idx_health_services_type (service_type),
  CONSTRAINT fk_health_services_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_health_services_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Immunizations table
CREATE TABLE IF NOT EXISTS immunizations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  vaccine_name VARCHAR(80) NOT NULL,
  vaccine_type ENUM('BCG', 'Polio', 'DPT', 'Measles', 'Hepatitis B', 'Hib', 'PCV', 'Rotavirus', 'COVID-19', 'Other') NOT NULL,
  dose_number INT DEFAULT 1,
  given_at DATE NOT NULL,
  facility_name VARCHAR(150) NULL,
  provider_name VARCHAR(150) NULL,
  next_due_date DATE NULL,
  adverse_reactions TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_immunizations_citizen (citizen_id),
  KEY idx_immunizations_vaccine (vaccine_type),
  CONSTRAINT fk_immunizations_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_immunizations_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Education Services table
CREATE TABLE IF NOT EXISTS education_services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  service_type ENUM('Enrollment', 'Attendance', 'Exam Results', 'Transfer', 'Dropout', 'Graduation', 'Scholarship', 'Other') NOT NULL,
  institution_name VARCHAR(150) NOT NULL,
  institution_level ENUM('Pre-primary', 'Primary', 'Secondary', 'Tertiary', 'Vocational', 'Other') NOT NULL,
  grade_level VARCHAR(50) NULL,
  academic_year VARCHAR(20) NULL,
  service_date DATE NOT NULL,
  status ENUM('Active', 'Completed', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Active',
  performance_data JSON NULL,
  notes TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_education_services_citizen (citizen_id),
  KEY idx_education_services_institution (institution_name),
  KEY idx_education_services_type (service_type),
  CONSTRAINT fk_education_services_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_education_services_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Social Support Services table
CREATE TABLE IF NOT EXISTS social_services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  service_type ENUM('Cash Transfer', 'Food Assistance', 'Housing Support', 'Medical Aid', 'Education Support', 'Disability Support', 'Elderly Care', 'Orphan Support', 'Other') NOT NULL,
  program_name VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  frequency ENUM('One-time', 'Weekly', 'Monthly', 'Quarterly', 'Annually') NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  status ENUM('Active', 'Completed', 'Suspended', 'Terminated') NOT NULL DEFAULT 'Active',
  eligibility_criteria TEXT NULL,
  notes TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_social_services_citizen (citizen_id),
  KEY idx_social_services_program (program_name),
  KEY idx_social_services_type (service_type),
  CONSTRAINT fk_social_services_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_social_services_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Health Facilities table
CREATE TABLE IF NOT EXISTS health_facilities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  type ENUM('Hospital', 'Clinic', 'Health Center', 'Dispensary', 'Maternity Home', 'Specialized Center') NOT NULL,
  level ENUM('Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6') NOT NULL,
  ward VARCHAR(60) NOT NULL,
  sub_county VARCHAR(60) NULL,
  address TEXT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(190) NULL,
  services_offered JSON NULL,
  capacity INT NULL,
  status ENUM('Active', 'Inactive', 'Under Construction') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_health_facilities_ward (ward),
  KEY idx_health_facilities_type (type),
  KEY idx_health_facilities_status (status)
) ENGINE=InnoDB;

-- Education Facilities table
CREATE TABLE IF NOT EXISTS education_facilities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  type ENUM('Pre-primary', 'Primary School', 'Secondary School', 'Tertiary Institution', 'Vocational Training', 'Special Education') NOT NULL,
  level VARCHAR(50) NULL,
  ward VARCHAR(60) NOT NULL,
  sub_county VARCHAR(60) NULL,
  address TEXT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(190) NULL,
  capacity INT NULL,
  current_enrollment INT DEFAULT 0,
  status ENUM('Active', 'Inactive', 'Under Construction') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_education_facilities_ward (ward),
  KEY idx_education_facilities_type (type),
  KEY idx_education_facilities_status (status)
) ENGINE=InnoDB;

-- Social Programs table
CREATE TABLE IF NOT EXISTS social_programs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  type ENUM('Cash Transfer', 'Food Assistance', 'Housing Support', 'Medical Aid', 'Education Support', 'Disability Support', 'Elderly Care', 'Orphan Support', 'Other') NOT NULL,
  description TEXT NULL,
  eligibility_criteria TEXT NULL,
  coverage_area VARCHAR(100) NULL,
  budget_allocated DECIMAL(15,2) NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_social_programs_type (type),
  KEY idx_social_programs_status (status)
) ENGINE=InnoDB;

-- Appointment Requests table
CREATE TABLE IF NOT EXISTS appointment_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  service_category ENUM('Health', 'Education', 'Social Support') NOT NULL,
  facility_id INT UNSIGNED NULL,
  program_id INT UNSIGNED NULL,
  service_type VARCHAR(100) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NULL,
  urgency ENUM('Low', 'Medium', 'High', 'Emergency') NOT NULL DEFAULT 'Medium',
  description TEXT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  approved_by INT UNSIGNED NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointment_requests_citizen (citizen_id),
  KEY idx_appointment_requests_category (service_category),
  KEY idx_appointment_requests_status (status),
  KEY idx_appointment_requests_date (preferred_date),
  CONSTRAINT fk_appointment_requests_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_requests_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Service Tracking table (for monitoring all services)
CREATE TABLE IF NOT EXISTS service_tracking (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  citizen_id INT UNSIGNED NOT NULL,
  service_category ENUM('Health', 'Education', 'Social Support') NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  action ENUM('Created', 'Updated', 'Completed', 'Cancelled', 'Rescheduled') NOT NULL,
  action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  performed_by INT UNSIGNED NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_service_tracking_citizen (citizen_id),
  KEY idx_service_tracking_category (service_category),
  KEY idx_service_tracking_date (action_date),
  CONSTRAINT fk_service_tracking_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_tracking_performer FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  type ENUM('Population', 'Health', 'Education', 'Social Support', 'Department', 'Custom') NOT NULL,
  description TEXT NULL,
  parameters JSON NULL,
  generated_by INT UNSIGNED NULL,
  file_path VARCHAR(500) NULL,
  file_format ENUM('PDF', 'Excel', 'CSV') NOT NULL DEFAULT 'PDF',
  status ENUM('Generating', 'Completed', 'Failed') NOT NULL DEFAULT 'Generating',
  generated_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reports_type (type),
  KEY idx_reports_status (status),
  KEY idx_reports_generated_by (generated_by),
  CONSTRAINT fk_reports_generator FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('System', 'Service', 'Report', 'Alert', 'Reminder') NOT NULL DEFAULT 'System',
  priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url VARCHAR(500) NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_read (is_read),
  KEY idx_notifications_type (type),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Password Resets table for OTP functionality
CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_resets_email (email),
  KEY idx_password_resets_expires (expires_at)
) ENGINE=InnoDB;

-- Audit Logs table for tracking system activities
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT UNSIGNED NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_user (user_id),
  KEY idx_audit_logs_table (table_name),
  KEY idx_audit_logs_date (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- System Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  description TEXT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_settings_key (setting_key),
  CONSTRAINT fk_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert default admin user
INSERT INTO users (name, email, password_hash, role, department, status)
VALUES ('Admin User', 'admin@county.go.ke', '$2y$10$g6RLgKcx9sYHkl8ZcAm9m.2GKTzaaQh2cQjSqg.Fc6dP7Rj8oWw9a', 'admin', 'All', 'Active')
ON DUPLICATE KEY UPDATE email = email;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description, is_public) VALUES
  ('countyName', 'Sample County', 'County name for display', true),
  ('countyCode', 'SC-001', 'County code', true),
  ('address', 'P.O. Box 1234, Sample Town', 'County address', true),
  ('phone', '+254 700 000 000', 'County phone number', true),
  ('email', 'info@county.go.ke', 'County email address', true),
  ('systemVersion', '1.0.0', 'Current system version', false),
  ('maxFileSize', '10485760', 'Maximum file upload size in bytes', false),
  ('sessionTimeout', '28800', 'Session timeout in seconds', false)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert sample health facilities (10 hospitals and clinics)
INSERT INTO health_facilities (name, type, level, ward, sub_county, address, phone, services_offered, capacity, status) VALUES
  ('County General Hospital', 'Hospital', 'Level 5', 'Ward 1', 'Central Sub-County', '123 Main Street', '+254 700 123 456', '["Emergency Care", "Surgery", "Maternity", "Pediatrics", "ICU"]', 200, 'Active'),
  ('Ward 1 Health Center', 'Health Center', 'Level 3', 'Ward 1', 'Central Sub-County', '456 Health Road', '+254 700 234 567', '["Routine Checkup", "Vaccination", "Maternal Care", "Child Health"]', 50, 'Active'),
  ('Ward 2 Clinic', 'Clinic', 'Level 2', 'Ward 2', 'North Sub-County', '789 Clinic Avenue', '+254 700 345 678', '["General Practice", "Child Health", "Immunization"]', 30, 'Active'),
  ('Specialized Maternity Hospital', 'Hospital', 'Level 4', 'Ward 3', 'South Sub-County', '321 Maternity Lane', '+254 700 456 789', '["Maternal Care", "Emergency Care", "Obstetrics"]', 100, 'Active'),
  ('Kisii Medical Center', 'Hospital', 'Level 4', 'Ward 1', 'Central Sub-County', '567 Hospital Avenue', '+254 700 567 890', '["Emergency Care", "Surgery", "Orthopedics", "Cardiology"]', 150, 'Active'),
  ('St. Luke Eye Hospital', 'Hospital', 'Level 3', 'Ward 2', 'North Sub-County', '890 Vision Road', '+254 700 678 901', '["Eye Care", "Cataract Surgery", "Vision Testing"]', 60, 'Active'),
  ('Trinity Dental Clinic', 'Clinic', 'Level 2', 'Ward 3', 'South Sub-County', '234 Smile Street', '+254 700 789 012', '["Dental Care", "Teeth Cleaning", "Orthodontics"]', 25, 'Active'),
  ('Comprehensive Care Medical Center', 'Hospital', 'Level 4', 'Ward 1', 'Central Sub-County', '345 Care Avenue', '+254 700 890 123', '["Emergency Care", "Surgery", "Pediatrics", "Radiology"]', 180, 'Active'),
  ('Kericho Community Health', 'Health Center', 'Level 3', 'Ward 2', 'North Sub-County', '456 Community Lane', '+254 700 901 234', '["Routine Checkup", "Vaccination", "HIV Testing"]', 45, 'Active'),
  ('Premier Diagnostic Center', 'Clinic', 'Level 2', 'Ward 3', 'South Sub-County', '678 Diagnosis Road', '+254 700 012 345', '["Lab Testing", "Ultrasound", "X-Ray Services"]', 35, 'Active')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample education facilities
INSERT INTO education_facilities (name, type, level, ward, sub_county, address, phone, capacity, current_enrollment, status) VALUES
  ('Ward 1 Primary School', 'Primary School', 'Primary', 'Ward 1', 'Central Sub-County', '111 Education Street', '+254 700 567 890', 500, 450, 'Active'),
  ('Ward 2 Secondary School', 'Secondary School', 'Secondary', 'Ward 2', 'North Sub-County', '222 Learning Road', '+254 700 678 901', 800, 720, 'Active'),
  ('County Vocational Training Center', 'Vocational Training', 'Tertiary', 'Ward 3', 'South Sub-County', '333 Skills Avenue', '+254 700 789 012', 200, 150, 'Active'),
  ('Ward 1 Pre-Primary School', 'Pre-primary', 'Pre-primary', 'Ward 1', 'Central Sub-County', '444 Early Learning Lane', '+254 700 890 123', 100, 85, 'Active')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample social programs
INSERT INTO social_programs (name, type, description, eligibility_criteria, coverage_area, budget_allocated, status) VALUES
  ('Orphans and Vulnerable Children Program', 'Orphan Support', 'Support for orphaned and vulnerable children', 'Children under 18 who have lost one or both parents', 'All Wards', 5000000.00, 'Active'),
  ('Elderly Cash Transfer', 'Elderly Care', 'Monthly cash transfers for elderly citizens', 'Citizens aged 65 and above', 'All Wards', 10000000.00, 'Active'),
  ('Disability Support Program', 'Disability Support', 'Support for citizens with disabilities', 'Registered persons with disabilities', 'All Wards', 3000000.00, 'Active'),
  ('Food Security Program', 'Food Assistance', 'Food assistance for vulnerable households', 'Households below poverty line', 'Ward 1, Ward 2', 2000000.00, 'Active')
ON DUPLICATE KEY UPDATE name = name;
