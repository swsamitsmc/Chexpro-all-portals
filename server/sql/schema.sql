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