-- ============================================================================
-- PROJECT TITLE: AI-Powered Financial Fraud Detection and Real-Time Transaction Monitoring System
-- CAPSTONE CREDIT: 8-Credit Final Year B.Tech CSE Project
-- MODULE: Phase 2 - Production MySQL Relational Database Schema (3NF)
-- FILE LOCATION: database/schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fraud_monitoring;
USE fraud_monitoring;

-- Disable Foreign Key Checks during Schema Creation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop Existing Tables if Re-initializing
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS fraud_predictions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- TABLE 1: roles
-- Defines system roles for Role-Based Access Control (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 2: users
-- Stores registered user identities, BCrypt hashed passwords, and credentials
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role_id BIGINT NOT NULL DEFAULT 1,
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 3: accounts
-- Stores user financial accounts and balances
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    account_number VARCHAR(34) NOT NULL UNIQUE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 4: transactions
-- Stores core financial transactions and decision status
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    account_id BIGINT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    merchant VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- APPROVED, HELD_FOR_VERIFICATION, BLOCKED
    fraud_probability DOUBLE PRECISION DEFAULT 0.0,
    risk_score INT DEFAULT 0,
    is_fraud BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 5: fraud_predictions
-- Stores detailed AI/ML model inference metrics and factor breakdowns
-- ----------------------------------------------------------------------------
CREATE TABLE fraud_predictions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(64) NOT NULL,
    fraud_probability DOUBLE PRECISION NOT NULL,
    risk_score INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    risk_factors TEXT,              -- JSON encoded risk explanation keywords
    model_version VARCHAR(50) DEFAULT 'XGBoost-v1.0-INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 6: alerts
-- Stores automated security threat alerts generated for high-risk transactions
-- ----------------------------------------------------------------------------
CREATE TABLE alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    alert_level VARCHAR(20) NOT NULL DEFAULT 'HIGH', -- MEDIUM, HIGH, CRITICAL
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 7: audit_logs
-- Stores system-wide security, admin, and authentication audit logs
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- Optimizes high-frequency query lookups and admin dashboard analytics
-- ----------------------------------------------------------------------------
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_risk ON transactions(risk_score);
CREATE INDEX idx_predictions_tx ON fraud_predictions(transaction_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
