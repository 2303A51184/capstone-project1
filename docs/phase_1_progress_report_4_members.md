# Capstone Project Phase-1 Progress Report (4-Member Team)

**Project Title**: SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System  
**Course Code / Credit**: 8-Credit Capstone Project  
**Domain**: Artificial Intelligence / Machine Learning, Cybersecurity & Full-Stack Web Development  

---

## 1. Executive Summary

This report documents the Phase-1 progress achieved by our 4-member capstone project team for the **SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System**. In Phase 1, our team successfully established the end-to-end system architecture, repository structure, database relational schema, Spring Boot backend REST APIs, Flask AI prediction service foundation, React frontend user interface, and core project documentation.

---

## 2. Team Composition & Task Allocation (4 Members)

| Roll / ID | Team Member Name | Designated Project Role | Key Responsibilities & Deliverables |
|-----------|------------------|-------------------------|--------------------------------------|
| **Member 1** | *[Student Name 1]* | **Team Lead & AI/ML Engineer** | Machine Learning model architecture, dataset preprocessing strategy, feature engineering, Flask microservice (`ai_service/app.py`), risk scoring algorithms (0-100 scale), and model evaluation metrics. |
| **Member 2** | *[Student Name 2]* | **Backend & Security Engineer** | Spring Boot architecture (`backend/`), Spring Security JWT authentication setup, REST controllers, DTO design, transaction processing logic, and inter-service communication with Flask AI engine. |
| **Member 3** | *[Student Name 3]* | **Frontend UI/UX Engineer** | React SPA development (`frontend/`), UI component design, responsive styling, state management, form validations, data visualization charts, and REST API integration with Axios. |
| **Member 4** | *[Student Name 4]* | **Database Architect & QA/Docs Specialist** | Database ER modeling, 3NF normalization, MySQL schema scripts (`database/schema.sql`), seed data, Software Requirements Specification (SRS), API documentation, and test case design. |

---

## 3. Up-to-Date Achievements (Folder Analysis)

Based on the project workspace contents, the following milestones have been successfully completed:

```
FINAL YEAR PROJECT/
├── backend/               [COMPLETED: Spring Boot REST API, JPA Entities, Security Config]
├── frontend/              [COMPLETED: React UI Forms, Admin Dashboard Cards, API Integration]
├── ai_service/            [COMPLETED: Flask Microservice, /predict Endpoint, Risk Logic]
├── database/              [COMPLETED: 3NF Relational MySQL Schema, FK Constraints]
└── docs/                  [COMPLETED: SRS Document, Project Plan, API Specs, Test Matrix]
```

### 3.1 Repository & Architectural Setup
- Established a clean multi-tiered monorepo architecture cleanly separating Frontend, Backend, AI Engine, Database, and Documentation.
- Configured automated environment launch script (`run.ps1`) to launch Spring Boot, Flask, and React concurrently.

### 3.2 Database Engineering (`database/schema.sql`)
- Designed normalized 3NF database schema for MySQL (`fraud_monitoring`).
- Created relational tables:
  - `users`: User identity, credentials, email, and role (`ROLE_USER`, `ROLE_ADMIN`).
  - `transactions`: Logged transactions, transaction attributes, merchant, location, currency, fraud probability score, risk score (0-100), and fraud flags (`is_fraud`).
- Configured foreign key relationships and index constraints.

### 3.3 Backend Engineering (`backend/`)
- Built Spring Boot REST framework using Maven (`pom.xml`) with dependencies for Web, JPA, Security, JJWT, and Validation.
- Developed Java JPA Entities: `User.java` and `Transaction.java`.
- Implemented REST Controllers:
  - `AuthController`: User registration & login handling.
  - `TransactionController`: Create transaction, fetch history, risk details.
  - `AdminController`: System overview, user list, total transactions, high-risk counts.
  - `HealthController`: Backend health status.
- Configured Spring Security baseline (`SecurityConfig.java`).

### 3.4 AI Microservice Engineering (`ai_service/`)
- Built lightweight Python Flask microservice (`app.py`).
- Implemented endpoint `/predict` to ingest transaction parameters (`amount`, `merchant`, `location`, `category`).
- Developed preliminary probability estimation and normalized risk score mapping algorithm (0 to 100).

### 3.5 Frontend UI Development (`frontend/`)
- Created single-page React interface (`App.js`).
- Implemented features:
  - User registration form.
  - Transaction entry form with real-time submission.
  - Admin Overview stat cards (Total Users, Total Transactions, Fraudulent Transactions, High Risk Transactions).
  - Registered User list & Real-Time Transaction list with risk badges.
- Connected frontend to Spring Boot backend via Axios REST calls.

### 3.6 Documentation Suite (`docs/`)
- Drafted Software Requirements Specification (`srs.md`).
- Drafted API Documentation (`api-documentation.md`).
- Created Phase 1-4 Project Plan (`project_plan.md`).
- Drafted Test Cases Specification (`test-cases.md`).

---

## 4. Summary Matrix of Completed Deliverables

| Module / Deliverable | Status | Responsible Member | Verification Method |
|----------------------|--------|--------------------+---------------------|
| Monorepo & Folder Setup | **100% Complete** | Member 1 | Folder layout verified |
| Database Schema (3NF) | **100% Complete** | Member 4 | `database/schema.sql` compiled |
| Backend REST API Baseline | **100% Complete** | Member 2 | Spring Boot builds with Maven |
| AI Service `/predict` Endpoint | **100% Complete** | Member 1 | Flask `/health` & `/predict` response |
| React UI Baseline Pages | **100% Complete** | Member 3 | React SPA runs on Port 3000 |
| SRS & API Specs Draft | **100% Complete** | Member 4 | `docs/` Markdown files verified |

---

## 5. Next Steps for Phase 2

1. **AI/ML Model Training**: Train XGBoost, Random Forest, and Logistic Regression on 10,000+ transaction dataset with SMOTE, compare metrics, and export `.pkl` weights.
2. **Spring Security JWT Integration**: Implement JWT token provider, filter, and BCrypt password encryption.
3. **Frontend UI Upgrade**: Transform React UI into a modern dashboard with dark mode glassmorphism theme, real-time alert feed, and charts.
4. **Academic Documentation**: Complete the full Capstone Project Report, IEEE Research Paper, Viva Preparation Guide, and Presentation Deck.
