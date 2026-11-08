# 8-Credit Capstone Project Phase-1 Progress Report

**Project Title**: SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System  
**Course**: Final Year Capstone Project (8 Credits)  
**Team Members**: 
1. **B. Sai Tejaswi** (Team Lead & AI/ML Engineer)
2. **Sharanya** (Backend & Security Engineer)
3. **Priya** (Frontend UI/UX Engineer)
4. **Harshini** (Database Architect & QA Specialist)
**Document Version**: 1.0 (Phase-1 Submission)  
**Date**: August 2026  

---

## 1. Executive Summary

This formal progress report details the work accomplished during Phase 1 of our 8-credit capstone project, titled **"SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System"**. Our 4-member team — **B. Sai Tejaswi, Sharanya, Priya, and Harshini** — has successfully established the complete system architecture, normalized database schema, Spring Boot REST API layer, Python Flask AI prediction microservice, and React single-page frontend application. 

The primary milestone achieved in Phase 1 is a working end-to-end prototype where financial transactions submitted through a React UI are validated by a Spring Boot service, analyzed by a Python AI microservice to predict fraud probability and calculate a risk score (0–100), and persisted into a normalized MySQL database.

---

## 2. Team Composition & Task Allocation

| S.No | Team Member Name | Academic Role | Assigned Subsystem | Key Technical Deliverables |
|:---|:---|:---|:---|:---|
| 1 | **B. Sai Tejaswi** | **Team Lead & AI/ML Engineer** | AI Microservice (`ai_service/`) | Flask microservice (`app.py`), `/predict` endpoint, feature scaling, risk scoring algorithm (0-100 scale), XGBoost/Random Forest model. |
| 2 | **Sharanya** | **Backend & Security Engineer** | Spring Boot Service (`backend/`) | Maven project architecture (`pom.xml`), JPA domain models (`User`, `Transaction`), REST Controllers, CORS configuration, inter-service API calling. |
| 3 | **Priya** | **Frontend UI/UX Engineer** | React SPA (`frontend/`) | React component architecture (`App.js`), registration/login forms, transaction entry UI, admin overview stat cards, live transaction table, Axios REST integration. |
| 4 | **Harshini** | **Database Architect & QA/Docs** | Database & Documentation (`database/`, `docs/`) | 3NF MySQL schema (`schema.sql`), relational integrity & foreign key constraints, Software Requirements Specification (SRS), API documentation, test matrix. |
