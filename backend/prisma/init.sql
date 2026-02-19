-- ChexPro Portal - MySQL Initialization Script
-- Runs once when Docker MySQL container first starts

CREATE DATABASE IF NOT EXISTS chexpro_portal_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- The portal_user is already created by Docker environment variables
-- Grant explicit privileges
GRANT ALL PRIVILEGES ON chexpro_portal_db.* TO 'portal_user'@'%';
FLUSH PRIVILEGES;
