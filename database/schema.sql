-- eLoan Management System - MySQL Schema
-- Run this in MySQL CLI: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS eloan_db;
USE eloan_db;

-- Users table (customers + admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan types
CREATE TABLE IF NOT EXISTS loan_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    max_amount DECIMAL(15,2) NOT NULL,
    max_tenure_months INT NOT NULL,
    description TEXT
);

-- Loan applications
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    loan_type_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tenure_months INT NOT NULL,
    purpose TEXT,
    monthly_emi DECIMAL(15,2),
    status ENUM('pending', 'approved', 'rejected', 'disbursed', 'closed') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (loan_type_id) REFERENCES loan_types(id)
);

-- EMI payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Seed data
INSERT INTO users (full_name, email, phone, address, password_hash, role) VALUES
('Admin User', 'admin@eloan.com', '0000000000', 'Bank HQ', '$2b$10$YourHashHere', 'admin');

INSERT INTO loan_types (name, interest_rate, max_amount, max_tenure_months, description) VALUES
('Personal Loan', 12.50, 500000.00, 60, 'Unsecured personal loan for any purpose'),
('Home Loan', 8.75, 5000000.00, 360, 'Loan for purchasing or constructing a home'),
('Car Loan', 9.50, 1000000.00, 84, 'Loan to purchase a new or used vehicle'),
('Education Loan', 7.00, 2000000.00, 120, 'Loan to fund higher education'),
('Business Loan', 14.00, 10000000.00, 60, 'Loan to start or expand a business');
