-- ============================================================================
-- PROJECT TITLE: AI-Powered Financial Fraud Detection System
-- MODULE: Phase 2 - Database Initial Seed Data Script
-- FILE LOCATION: database/seed_data.sql
-- ============================================================================

USE fraud_monitoring;

-- 1. Insert Initial System Roles
INSERT INTO roles (id, name) VALUES 
(1, 'ROLE_USER'),
(2, 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Default Demo User and Admin
-- Note: Passwords are BCrypt encrypted for 'password123'
INSERT INTO users (id, username, password, email, full_name, role_id, role) VALUES 
(1, 'demo_user', '$2a$10$eD2.Yc0pQ5gQyH8bFm7A3uG9H4/Hw.Q0mS4W3K2Y1Z0X9V8W7U6T5', 'demo@fraudmonitoring.com', 'Rajesh Sharma', 1, 'ROLE_USER'),
(2, 'admin', '$2a$10$eD2.Yc0pQ5gQyH8bFm7A3uG9H4/Hw.Q0mS4W3K2Y1Z0X9V8W7U6T5', 'admin@fraudmonitoring.com', 'System Administrator', 2, 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- 3. Insert Initial Account Records
INSERT INTO accounts (id, user_id, account_number, balance, currency, status) VALUES 
(1, 1, 'IND-ACC-984721019', 150000.00, 'INR', 'ACTIVE'),
(2, 2, 'IND-ACC-100000001', 5000000.00, 'INR', 'ACTIVE')
ON DUPLICATE KEY UPDATE account_number=VALUES(account_number);

-- 4. Insert Initial Sample Transactions
INSERT INTO transactions (id, transaction_id, user_id, account_id, amount, currency, merchant, location, category, status, fraud_probability, risk_score, is_fraud) VALUES 
(1, 'UPI-100001', 1, 1, 450.00, 'INR', 'Reliance Smart Supermarket', 'Mumbai, India', 'GROCERY', 'APPROVED', 0.0500, 12, FALSE),
(2, 'UPI-100002', 1, 1, 350000.00, 'INR', 'Offshore Crypto Exchange', 'High Risk Offshore Zone', 'CRYPTO', 'BLOCKED', 0.8500, 85, TRUE)
ON DUPLICATE KEY UPDATE transaction_id=VALUES(transaction_id);

-- 5. Insert Corresponding Fraud Predictions
INSERT INTO fraud_predictions (id, transaction_id, fraud_probability, risk_score, risk_level, risk_factors, model_version) VALUES 
(1, 'UPI-100001', 0.0500, 12, 'LOW', '["Normal Spending Pattern"]', 'XGBoost-v1.0-INR'),
(2, 'UPI-100002', 0.8500, 85, 'CRITICAL', '["High Transaction Amount (> ₹2,50,000)", "High-Risk Category (CRYPTO)", "Suspicious Location"]', 'XGBoost-v1.0-INR')
ON DUPLICATE KEY UPDATE transaction_id=VALUES(transaction_id);

-- 6. Insert Initial Security Threat Alert
INSERT INTO alerts (id, transaction_id, user_id, alert_level, message, is_resolved) VALUES 
(1, 'UPI-100002', 1, 'HIGH', 'High-risk transaction detected (Score 85/100). Transaction blocked pending administrative verification.', FALSE)
ON DUPLICATE KEY UPDATE transaction_id=VALUES(transaction_id);

-- 7. Insert Audit Log Entry
INSERT INTO audit_logs (actor_username, action, details) VALUES 
('SYSTEM', 'DATABASE_INIT', 'Database schema and seed data initialized successfully.');
