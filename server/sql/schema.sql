-- Database schema for ChexPro application

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Sessions table for login sessions
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expires_at (expires_at)
);

-- Persistent tokens table for remember me functionality
CREATE TABLE IF NOT EXISTS persistent_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Email recipients table for dynamic configuration
CREATE TABLE IF NOT EXISTS email_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('contact', 'demo') NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type_active (type, active)
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  company_name VARCHAR(100),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_email (email)
);

-- Demo requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  work_email VARCHAR(255) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  screenings_per_year VARCHAR(50) NOT NULL,
  services_of_interest VARCHAR(500) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_work_email (work_email)
);

-- Clients table (companies that use ChexPro)
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(25),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  address TEXT,
  subscription_tier ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
  api_key VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (company_name),
  INDEX idx_contact_email (contact_email),
  INDEX idx_active (active)
);

-- Candidates table (people being screened)
CREATE TABLE IF NOT EXISTS candidates (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(25),
  date_of_birth DATE,
  ssn_last_four VARCHAR(4),
  address TEXT,
  position_applied VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- Background check orders table
CREATE TABLE IF NOT EXISTS bg_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  candidate_id VARCHAR(36) NOT NULL,
  order_reference VARCHAR(100) UNIQUE NOT NULL,
  order_type ENUM('individual', 'batch') DEFAULT 'individual',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',

  -- Services requested
  criminal_check BOOLEAN DEFAULT FALSE,
  employment_verification BOOLEAN DEFAULT FALSE,
  education_verification BOOLEAN DEFAULT FALSE,
  credit_check BOOLEAN DEFAULT FALSE,
  reference_check BOOLEAN DEFAULT FALSE,
  drug_screening BOOLEAN DEFAULT FALSE,

  -- Order details
  turnaround_time_requested INT DEFAULT 3, -- days
  special_instructions TEXT,
  internal_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  due_date DATE,

  -- Results
  report_url VARCHAR(500),
  overall_result ENUM('clear', 'caution', 'adverse', 'pending') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,

  INDEX idx_client_id (client_id),
  INDEX idx_candidate_id (candidate_id),
  INDEX idx_order_reference (order_reference),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_due_date (due_date)
);

-- Screening reports table (detailed results)
CREATE TABLE IF NOT EXISTS screening_reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  findings TEXT,
  risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
  verified_at TIMESTAMP NULL,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES bg_orders(id) ON DELETE CASCADE,

  INDEX idx_order_id (order_id),
  INDEX idx_report_type (report_type),
  INDEX idx_status (status)
);

-- Batch invites table (for bulk background checks)
CREATE TABLE IF NOT EXISTS batch_invites (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  batch_name VARCHAR(255) NOT NULL,
  batch_description TEXT,
  status ENUM('draft', 'sent', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',

  -- Invite settings
  invite_expiry_days INT DEFAULT 7,
  require_consent BOOLEAN DEFAULT TRUE,
  notify_on_completion BOOLEAN DEFAULT TRUE,

  -- Bulk operations
  total_invites INT DEFAULT 0,
  completed_invites INT DEFAULT 0,
  failed_invites INT DEFAULT 0,

  -- Files and data
  csv_file_path VARCHAR(500),
  processed_data JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,

  INDEX idx_client_id (client_id),
  INDEX idx_batch_name (batch_name),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Support requests table
CREATE TABLE IF NOT EXISTS support_requests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36), -- Optional, may be general inquiry

  request_type ENUM('technical', 'billing', 'report_dispute', 'general', 'urgent') DEFAULT 'general',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  status ENUM('open', 'in_progress', 'waiting_for_info', 'resolved', 'closed') DEFAULT 'open',

  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  urgency_level ENUM('routine', 'important', 'critical') DEFAULT 'routine',

  -- Assignment and tracking
  assigned_to VARCHAR(100),
  internal_notes TEXT,

  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES bg_orders(id) ON DELETE SET NULL,

  INDEX idx_client_id (client_id),
  INDEX idx_order_id (order_id),
  INDEX idx_request_type (request_type),
  INDEX idx_priority (priority),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
