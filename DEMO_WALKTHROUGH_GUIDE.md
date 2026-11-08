# Live Project Demo & Presentation Guide

**Project Title**: SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System  
**Demo Duration**: 5 – 10 Minutes  
**Target Audience**: Project Guide / Academic Evaluation Panel  

---

## 🚀 How to Launch the Demo (One-Click)

1. Open PowerShell terminal as Administrator or standard user.
2. Navigate to your project folder:
   ```powershell
   cd "c:\Users\hp\OneDrive\Desktop\FINAL YEAR PROJECT"
   ```
3. Run the automated launcher script:
   ```powershell
   .\run.ps1
   ```
4. This script automatically opens **3 terminal windows**:
   - **Terminal 1**: Python Flask AI Microservice (`http://localhost:5000`)
   - **Terminal 2**: Java Spring Boot REST Backend (`http://localhost:8080`)
   - **Terminal 3**: React Web Frontend (`http://localhost:3000`)

---

## 🎬 Step-by-Step Live Demo Script (What to Show)

### Step 1: System Overview & Status Check
- Open browser to **`http://localhost:3000`**.
- Show the evaluator the **Header Status Bar** (`Flask AI: 5000`, `Spring Boot: 8080`, `MySQL DB`).
- Explain: *"Respected Sir/Madam, this is our decoupled 3-tier architecture. The React UI communicates with Spring Boot, which invokes our Python Flask AI engine in real time."*

### Step 2: Demonstrate a Normal (Low-Risk) Transaction
1. On the **Transaction Simulator** panel, click the green button:  
   **`🟢 Preset: Normal Grocery ($45)`**
2. Click **`🚀 Submit Transaction & Predict Risk`**.
3. **What Happens Live**:
   - Spring Boot receives the transaction.
   - Spring Boot calls Flask ML microservice (`POST http://localhost:5000/predict`).
   - Flask returns Risk Score **12/100** and Probability **12.0%**.
   - Result Card displays: **`✅ APPROVED`** in green.
   - The transaction appears instantly in the **Transaction Audit Log Table** with a **Green APPROVED badge**.

### Step 3: Demonstrate a Suspicious / High-Risk Fraudulent Transaction
1. On the **Transaction Simulator** panel, click the red button:  
   **`🔴 Preset: Suspicious Crypto ($8,500)`**
2. Click **`🚀 Submit Transaction & Predict Risk`**.
3. **What Happens Live**:
   - AI Engine analyzes the parameters (`Amount: $8,500`, `Category: CRYPTO`, `Location: Offshore`).
   - Flask ML model calculates a critical Risk Score **85/100** and Probability **85.0%**.
   - Result Card displays: **`❌ FLAGGED & BLOCKED`** in bright red.
   - The **Admin Overview Metrics** instantly update: **Flagged Fraudulent count increases to +1**, and **High-Risk Count increases**.
   - A red security alert item pops up in the **`🚨 High-Risk Security Alerts Feed`**.
   - The row in the **Transaction History Table** turns red with a **Red FLAGGED badge**.

### Step 4: Show Database Persistence & REST APIs
- Open a new tab and navigate to:  
  **`http://localhost:8080/api/transactions`**
- Show the JSON payload containing the logged transaction metrics, risk scores, and fraud flags saved in the database.

---

## ❓ Frequently Asked Panel Questions During Demo

- **Q1: Where does the AI model run?**  
  *A: The AI engine runs as a lightweight Flask microservice on port 5000. It performs real-time feature transformation and scoring.*

- **Q2: What threshold determines if a transaction is fraud?**  
  *A: Any transaction receiving an AI risk score greater than or equal to 70 out of 100 is automatically flagged and blocked.*

- **Q3: What database are you using?**  
  *A: We use a 3NF normalized MySQL database schema (`fraud_monitoring`), with automatic H2 fallback for zero-configuration local testing.*
