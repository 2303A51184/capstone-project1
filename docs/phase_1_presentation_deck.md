# Phase-1 Capstone Project Presentation Deck

**Project Title**: SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System  
**Course / Credit**: 8-Credit Final Year Capstone Project  
**Team Size**: 4 Members  
**Presentation Type**: Phase-1 Progress Review & System Architecture Defense  

---

## 📌 Slide 1: Title & Team Overview

```
+-----------------------------------------------------------------------------------+
|  SENTINEL-AI: AI-POWERED WEBSITE TRUST & FRAUD DETECTION SYSTEM  |
|                     8-Credit Final Year Capstone Project Review                    |
+-----------------------------------------------------------------------------------+
```

### 👥 Presenters & Team Roles
- **Member 1 (Team Lead & AI/ML Engineer)**: Machine Learning Pipeline & Flask Microservice
- **Member 2 (Backend & Security Engineer)**: Spring Boot 3 REST API & Security Architecture
- **Member 3 (Frontend UI/UX Engineer)**: React SPA Frontend & User/Admin Dashboards
- **Member 4 (Database Architect & QA)**: MySQL 3NF Database & Technical Documentation

---

## 📌 Slide 2: Problem Statement & Motivation

### 🚨 The Problem
- **Escalating Financial Scams**: Cyber fraud and unauthorized online transactions are growing exponentially across digital banking.
- **Rule-Based System Limitations**: Traditional static fraud rules fail to detect complex, multi-variable fraudulent behavior patterns.
- **High Latency**: Delayed fraud detection leads to financial loss before transactions can be blocked.

### 💡 Our Solution
- An **AI-Driven Microservice Ecosystem** that dynamically evaluates fraud probability and assigns a **Risk Score (0–100)** in real time.
- Integrated **Real-Time Security Alerting** and **Admin Monitoring Dashboard** to flag suspicious activities instantly.

---

## 📌 Slide 3: System Architecture & Data Flow

### 🏗️ 3-Tier Enterprise Architecture

```
[ React.js Frontend ]  <--->  [ Spring Boot Backend ]  <--->  [ Python Flask AI Service ]
     (Port 3000)                   (Port 8080)                   (Port 5000)
         ^                             |                             |
         |                             v                             |
         +------------------- [ MySQL Database ] <-------------------+
                               (fraud_monitoring)
```

### 🔄 End-to-End Execution Flow
1. **User Request**: User initiates transaction via React SPA.
2. **Backend Authentication**: Spring Boot validates request payload and user identity.
3. **AI Inference**: Spring Boot calls Flask ML service (`POST /predict`).
4. **Risk Evaluation**: AI returns `fraud_probability` & `risk_score` (0–100).
5. **Persistence & Alerting**: Spring Boot flags high-risk transactions (`risk_score > 70`), logs alerts, and stores records in MySQL.
6. **Real-time Feedback**: React UI displays instant transaction status & alert banners.

---

## 📌 Slide 4: Team Work Distribution (4 Members)

| Member | Module Focus | Technology Stack | Phase-1 Completed Deliverables |
|:---|:---|:---|:---|
| **Member 1** | AI / ML Microservice | Python, Flask, Pandas, NumPy, Scikit-Learn | Flask REST API (`app.py`), `/predict` endpoint, Risk scoring mapping (0-100). |
| **Member 2** | Spring Boot Backend | Java 17/26, Spring Boot 3, Spring JPA | REST Controllers (`Auth`, `Transaction`, `Admin`), Security Config foundation. |
| **Member 3** | React UI Application | React.js, HTML5, CSS3, Axios | Registration UI, Transaction Submission Form, Admin Stat Cards, Live Tables. |
| **Member 4** | Database & QA Docs | MySQL 8.0, SQL, Markdown | 3NF Schema (`schema.sql`), Foreign Keys, SRS IEEE 830, API Specifications. |

---

## 📌 Slide 5: AI / ML Module Architecture (Member 1)

### 🤖 Machine Learning Pipeline
- **Dataset Generation**: Synthetic & benchmark fraud dataset (10,000+ samples) with feature metrics (`amount`, `distance_from_home`, `ratio_to_median`, `used_chip`, `online_order`).
- **Class Imbalance Strategy**: Applying **SMOTE** (Synthetic Minority Over-sampling Technique) to address fraud data imbalance.
- **Model Benchmark Strategy**: Comparing **Logistic Regression**, **Random Forest**, and **XGBoost Classifier**.

### 🔌 Flask Microservice (`ai_service/app.py`)
- **Endpoint**: `POST /predict`
- **Output Schema**:
  ```json
  {
    "fraud_probability": 0.8750,
    "risk_score": 88,
    "is_fraud": true
  }
  ```

---

## 📌 Slide 6: Backend REST API & Security (Member 2)

### ⚙️ Spring Boot Core Components
- **Maven Architecture**: Configured Spring Boot 3 with JPA, Web, Validation, and Security dependencies.
- **JPA Entities**:
  - `User.java`: User identity, hashed credentials, role management (`ROLE_USER`, `ROLE_ADMIN`).
  - `Transaction.java`: Transaction log, merchant, location, risk metrics (`riskScore`, `fraudProbability`, `isFraud`).
- **REST Services**:
  - `/api/auth/register` & `/api/auth/login`
  - `/api/transactions` (Create & Retrieve Transactions)
  - `/api/admin/overview` (System Statistics)

---

## 📌 Slide 7: Database Schema Design (Member 4)

### 🗄️ Relational 3NF Database (`database/schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS fraud_monitoring;
USE fraud_monitoring;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'USER'
);

CREATE TABLE transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  transaction_id VARCHAR(50) UNIQUE,
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  merchant VARCHAR(100),
  location VARCHAR(100),
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING',
  fraud_probability DOUBLE,
  risk_score INT,
  is_fraud BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📌 Slide 8: Frontend UI & User Experience (Member 3)

### 💻 React Single-Page Application (`frontend/src/App.js`)
- **User Dashboard**: Form interface for simulating live transactions and receiving instant risk feedback.
- **Admin Dashboard**: System-level metrics showing Total Registered Users, Total Transactions, Fraudulent Transactions, and High-Risk Transactions.
- **Real-Time Monitoring Table**: Dynamic transaction feed displaying risk scores, merchant details, and visual fraud badges (`Yes`/`No`).
- **Integration**: Async API calls via **Axios** connecting React components to Spring Boot endpoints.

---

## 📌 Slide 9: Phase-1 Working Prototype Verification

### 🧪 Verification Steps Completed
1. **Automation Script**: Developed PowerShell script (`run.ps1`) to launch all 3 services concurrently.
2. **AI Health Check**: Verified Flask `/health` returning `{ "status": "ok" }`.
3. **Backend API Validation**: Verified `/api/auth/register` and `/api/transactions` creating entries in database.
4. **End-to-End Transaction Test**: Submitted $1,000 transaction -> AI Service evaluated risk -> Spring Boot stored result -> React UI displayed update.

---

## 📌 Slide 10: Phase-2 Implementation Roadmap

```
+------------------------------------------------------------------------------------+
|  PHASE 2 ROADMAP (Next Steps for Final Submission)                                 |
+------------------------------------------------------------------------------------+
| 1. Train & Export XGBoost Model (.pkl) with SMOTE on 10,000+ instances            |
| 2. Implement Spring Security JWT Auth Filter & BCrypt Password Encryption          |
| 3. Upgrade React UI to Dark-Mode Glassmorphism Dashboard with Recharts Visuals     |
| 4. Complete Academic Suite: SRS, Final Report, IEEE Paper & Viva Q&A Guide         |
+------------------------------------------------------------------------------------+
```

---

## 📌 Slide 11: Presenter Speaking Script (For Viva Review)

- **Member 1 (AI Lead)**: *"Respected guides, I handled the AI Microservice. We chose Flask for lightweight inference and designed a continuous risk scoring function that converts fraud probability into an intuitive 0-100 risk score."*
- **Member 2 (Backend Lead)**: *"I engineered the Spring Boot REST API layer. Spring Boot serves as the central orchestrator, managing data persistence, security, and seamless communications with the Flask AI engine."*
- **Member 3 (Frontend Lead)**: *"I created the React SPA frontend. The interface provides real-time feedback for users during transaction entry and gives admins a live monitoring overview."*
- **Member 4 (Database & Docs Lead)**: *"I modeled the normalized 3NF MySQL schema, enforcing relational integrity between users and transactions, while drafting the SRS and API documentation suite."*

---

## 📌 Slide 12: Q&A / Thank You

### ❓ Anticipated Panel Questions & Prepared Answers
- **Q1: Why separate Spring Boot and Flask?**  
  *A: Spring Boot provides enterprise-grade backend security, transaction management, and database persistence, while Python Flask provides native support for ML libraries (Scikit-Learn, XGBoost).*
- **Q2: How do you handle class imbalance in fraud datasets?**  
  *A: We use SMOTE (Synthetic Minority Over-sampling Technique) during training to prevent the model from biasing toward non-fraudulent transactions.*
- **Q3: What constitutes a high-risk transaction?**  
  *A: Any transaction receiving an AI risk score greater than 70/100 triggers automated flagging and generates an alert.*

---
*End of Phase-1 Presentation Deck*
