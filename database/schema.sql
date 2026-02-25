-- Recipe Management System Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS recipe_management;
USE recipe_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table (recipe templates)
CREATE TABLE IF NOT EXISTS recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Recipe elements (fields/columns in a recipe)
CREATE TABLE IF NOT EXISTS recipe_elements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    data_type ENUM('integer', 'float', 'string', 'boolean') DEFAULT 'string',
    unit VARCHAR(20),
    min_value DECIMAL(15,5),
    max_value DECIMAL(15,5),
    default_value VARCHAR(255),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Data records (actual recipe instances)
CREATE TABLE IF NOT EXISTS data_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    record_number INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Data record values
CREATE TABLE IF NOT EXISTS record_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_record_id INT NOT NULL,
    element_id INT NOT NULL,
    value VARCHAR(255),
    FOREIGN KEY (data_record_id) REFERENCES data_records(id) ON DELETE CASCADE,
    FOREIGN KEY (element_id) REFERENCES recipe_elements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_record_element (data_record_id, element_id)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_recipe_elements_recipe ON recipe_elements(recipe_id);
CREATE INDEX idx_data_records_recipe ON data_records(recipe_id);
CREATE INDEX idx_record_values_record ON record_values(data_record_id);
CREATE INDEX idx_record_values_element ON record_values(element_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    company VARCHAR(100),
    location VARCHAR(100),
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    settings JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add workspace_id to users table
ALTER TABLE users ADD COLUMN workspace_id INT AFTER role;
ALTER TABLE users ADD COLUMN biometric_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN biometric_photo TEXT;
ALTER TABLE users ADD COLUMN first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD CONSTRAINT fk_user_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add sub_admin role to users
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'sub_admin', 'operator', 'viewer') DEFAULT 'viewer';

-- Add workspace_id to recipes table  
ALTER TABLE recipes ADD COLUMN workspace_id INT AFTER created_by;
ALTER TABLE recipes ADD CONSTRAINT fk_recipe_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- System updates table (for tracking published updates)
CREATE TABLE IF NOT EXISTS system_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(50) NOT NULL,
    note TEXT,
    target_workspaces TEXT COMMENT 'JSON array of workspace IDs, null means all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- App telemetry table (for WinForms app monitoring)
CREATE TABLE IF NOT EXISTS app_telemetry (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    workspace_id INT,
    username VARCHAR(100),
    app_version VARCHAR(50),
    ram_usage_mb FLOAT,
    cpu_usage_percent FLOAT,
    os_info VARCHAR(200),
    screen_resolution VARCHAR(50),
    status ENUM('online', 'idle', 'offline') DEFAULT 'online',
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

CREATE INDEX idx_system_updates_created ON system_updates(created_at);
CREATE INDEX idx_app_telemetry_last_ping ON app_telemetry(last_ping);
CREATE INDEX idx_app_telemetry_workspace ON app_telemetry(workspace_id);
