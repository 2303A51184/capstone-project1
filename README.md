# AI Financial Fraud Detection System (SENTINEL-AI)

### 🌐 Active Website Access Links

| Environment | Direct URL | Description |
|---|---|---|
| **Live GitHub Pages Deployment** | **[https://2303a51184.github.io/capstone-project/](https://2303a51184.github.io/capstone-project/)** | Official live production web deployment |
| **Universal Public Tunnel** | **[https://beige-actors-travel.loca.lt](https://beige-actors-travel.loca.lt)** | Remote internet access (*Password: `103.57.133.147`*) |
| **Local Machine** | **[http://localhost:3000](http://localhost:3000)** | Primary local development host |

---

### 📂 Quick Launch Files in This Folder

- **`OPEN_WEBSITE.url`**: Windows internet shortcut. Double-click to instantly launch the website in your default browser.
- **`OPEN_WEBSITE.html`**: Browser launcher card with 1-click redirect.
- **`WEBSITE_LINKS.txt`**: Plain text reference of all local and remote URLs.
- **`run.ps1`**: PowerShell script to launch all 3 backend/frontend/AI services in parallel.

---

### ⚙️ Microservices & Architecture

1. **Frontend**: React Single-Page Application with Chart.js animated analytics running on port `3000`.
2. **Backend**: Spring Boot 3.5 with in-memory H2 Database and REST APIs running on port `8080`.
3. **AI Service**: Python Flask microservice loaded with trained `RandomForestClassifier` (`fraud_model.joblib`) running on port `5000`.

---

### 🚀 Key Features

- **Real-Time Transaction Simulator**: 1-click presets for normal grocery (`₹450`) and suspicious crypto (`₹3,50,000`).
- **Live AI Risk Scoring**: Computes fraud probability percentage, risk score (0–100), and automated approval/block decision.
- **📈 Animated Interactive Graphs**: Real-time Risk Severity Stratification Bar Chart and Decision Clearance Ratio Doughnut Chart.
- **User Management**: Instant client registration and active user listing.
- **🚨 Real-Time Threat Alerts**: Live feed of flagged suspicious transactions.
- **📊 Transaction Audit Ledger**: Real-time tabular history with status and risk pills.
