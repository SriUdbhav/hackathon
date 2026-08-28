<div align="center">

```
  ______     _         _____ _             _            _      _____ _       _     _   
 |  ____|   | |       / ____| |           | |          | |    / ____(_)     | |   | |  
 | |__    __| |_   _ | (___ | |_ _   _  __| | ___ _ __ | |_  | (___  _  __ _| |__ | |_ 
 |  __|  / _` | | | | \___ \| __| | | |/ _` |/ _ \ '_ \| __|  \___ \| |/ _` | '_ \| __|
 | |____| (_| | |_| | ____) | |_| |_| | (_| |  __/ | | | |_   ____) | | (_| | | | | |_ 
 |______|\__,_|\__,_||_____/ \__|\__,_|\__,_|\___|_| |_|\__| |_____/|_|\__, |_| |_|\__|
                                                                        __/ |          
                                                                       |___/           
```

### **Autonomous Multi-Signal Academic Early-Warning, Telemetry & Intervention Intelligence Platform**
*Designed for Institutional Governance, Faculty Mentors, and Student Academic Success*

---

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.2-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![SQLite3](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Theme](https://img.shields.io/badge/Theme-Catppuccin%20Mocha-cba6f7?style=for-the-badge)](https://github.com/catppuccin/catppuccin)
[![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

[🌟 Key Innovations](#-key-innovations--capabilities) •
[🏛️ RBAC System](#-4-tier-role-based-access-control-rbac) •
[📐 Mathematical Formulas](#-explainable-ai-mathematical-formulation) •
[🤖 Multi-Model LLM Hub](#-multi-model-llm-engine--resilience-hub) •
[💻 Local Review Guide](#-quick-start--local-judge-review-mode) •
[🚀 Cloud Deployment](#-production-deployment-guide-render--netlify) •
[🔑 Demo Credentials](#-master-credentials--evaluation-matrix) •
[🔌 Complete API Reference](#-complete-rest-api-reference)

---

</div>

## 📖 Executive Summary & Problem Statement

In higher education institutions, academic failure, course dropouts, and student disengagement rarely occur without warning. However, **early warning signals are routinely missed** because:

1. **Information Silos**: Attendance rosters, Continuous Internal Evaluation (CIE) exam marks, online Learning Management System (LMS) digital access logs, and extracurricular records reside in isolated software packages.
2. **Opaque "Black-Box" AI**: Machine learning solutions frequently output arbitrary risk percentages without actionable explanations or mathematical justification, leading to faculty distrust.
3. **Broken Intervention Loops**: Even when at-risk students are identified, institutions lack structured follow-up mechanisms. Mentoring sessions are scheduled informally, notes are lost, and completion sign-offs lack supervisory oversight.

**EduStudent Sight** transforms passive telemetry data into an **active, explainable, and autonomous early-intervention ecosystem**. It unifies multi-signal academic indicators, computes explainable risk indices, orchestrates closed-loop 1-on-1 counseling interventions with a two-party review queue, and provides an Autonomous AI Agent studio powered by leading open and proprietary LLMs.

---

## 🌟 Key Innovations & Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EDUSTUDENT SIGHT PLATFORM CAPABILITIES                        │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│ 📊 Multi-Signal Telemetry     │ 📐 Explainable Math Engine    │ 🤝 Closed-Loop Interventions     │
│ • Real-time Attendance %      │ • Deterministic Engagement Eq │ • 1-on-1 Session Scheduling      │
│ • Internal Exam Scores (/30)  │ • Configurable Risk Cutoffs   │ • Two-Party Review Queue         │
│ • External Semester Marks     │ • Dynamic Anomaly Triggers    │ • Rejection Feedback Loops       │
│ • LMS Daily Footprint & Idle  │ • Sub-Subject Drop Analysis   │ • Progress Commitment Audits     │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ 🤖 Multi-Model AI Studio      │ 🛡️ Institutional Governance   │ 🎨 Catppuccin Glassmorphism      │
│ • Google Gemini 3.5 & Gemma 4 │ • 4-Tier Strict RBAC Matrix   │ • Dark/Light Dual Mode Tokens    │
│ • Groq Cloud (Compound & Llama│ • Faculty Signup Approvals    │ • Responsive Micro-Animations    │
│ • OpenRouter Smart Auto-Free  │ • Email Notification Logging  │ • Zero-Dependency Pure CSS       │
│ • Local Ollama Tunnel Support │ • Multi-Sheet Excel Exports   │ • High-Contrast WCAG Compliant   │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────────────┘
```

---

## 🏛️ 4-Tier Role-Based Access Control (RBAC)

EduStudent Sight enforces strict persona-based boundaries with tailored UI views, dedicated permission scopes, and granular data filtering:

```
                                  ┌───────────────────────────────┐
                                  │       1. ADMINISTRATOR        │
                                  │ (System Admin, Deans, HODs)   │
                                  └───────────────┬───────────────┘
                                                  │
                  ┌───────────────────────────────┼───────────────────────────────┐
                  │                               │                               │
  ┌───────────────▼───────────────┐               │               ┌───────────────▼───────────────┐
  │          2. FACULTY           │               │               │           3. MENTOR           │
  │ (Course Instructors, HODs)    │               │               │ (Assigned Student Counselors) │
  └───────────────┬───────────────┘               │               └───────────────┬───────────────┘
                  │                               │                               │
                  └───────────────────────────────┼───────────────────────────────┘
                                                  │
                                  ┌───────────────▼───────────────┐
                                  │          4. STUDENT           │
                                  │  (Personal Academic Telemetry)│
                                  └───────────────────────────────┘
```

### 1. 🛡️ Administrator Persona (`role: "admin"`)
* **System-Wide Governance**: Full oversight of all 100+ cohort profiles across all branches and academic years.
* **Faculty & Mentor Lifecycle**: Review applicant signup requests, approve credentials, or decline applications with recorded audit reasons.
* **Dynamic System Configuration**: Adjust global risk formulas, attendance cutoffs, CGPA benchmarks, and dual-sync AI provider API keys.
* **Bulk Data Operations**: Import and export students, faculty, and marks in CSV and formatted multi-sheet Excel workbooks.
* **Email & Security Audit Trail**: Complete log of all credentials and notification emails dispatched by the platform.

### 2. 🎓 Faculty Persona (`role: "faculty"`)
* **Course Roster Management**: Direct insight into students enrolled in assigned subjects (`CS201`, `CS202`, `MA201`, etc.).
* **Subject Performance Tracking**: Continuous Internal Evaluation (CIE) grading, attendance recording, and assignment submission monitoring.
* **Intervention Inception & Sign-Off**: Initiate counseling requests for students failing mid-terms, and review/approve completion requests submitted by mentors.

### 3. 🧭 Mentor Persona (`role: "mentor"`)
* **Mentee Risk Radar**: Filter assigned cohort by risk levels (Critical, Moderate Warning, Nominal) and spot early attendance drops.
* **1-on-1 Counseling Scheduling**: Schedule physical (e.g. *Cabin 204, CSE Block*) or virtual (*Google Meet*) intervention sessions.
* **Two-Party Completion Workflow**: Submit session completion summaries with student commitments, which route to the initiating faculty or admin for review.
* **Revision Handling**: Receive structured feedback if an intervention is rejected and resubmit with verified remedial proof.

### 4. 👤 Student Persona (`role: "student"`)
* **Personal 360° Academic Radar**: Private view of personal attendance %, CGPA trajectory, LMS platform score, and risk status.
* **Per-Subject Diagnostic View**: Detailed internal exam marks, assignment scores, and attendance breakdowns per enrolled subject.
* **Intervention History & Commitments**: View past mentoring meetings, feedback notes from faculty, and action plans.
* **24/7 AI Academic Assistant**: Personalized AI tutor for study planning, exam preparation, and conceptual clarification.

---

## 📐 Explainable AI: Mathematical Formulation

Unlike opaque neural networks, EduStudent Sight utilizes a deterministic, mathematically auditable scoring engine designed in accordance with educational measurement standards:

### 1. The Multi-Signal Engagement Index

$$\mathbf{E} = \left( \mathbf{A} \times w_a \right) + \left( \mathbf{C}_{\text{scaled}} \times w_c \right) + \left( \mathbf{L} \times w_l \right)$$

Where:
* $\mathbf{A}$ = Overall Student Attendance Percentage $[0, 100]$
* $\mathbf{C}_{\text{scaled}} = \mathbf{CGPA} \times 10.0$ — Scaled CGPA score $[0, 100]$
* $\mathbf{L}$ = Online LMS Platform Activity Index $[0, 100]$
* $w_a = 0.40$ (Attendance Weight — 40%)
* $w_c = 0.35$ (Academic CGPA Weight — 35%)
* $w_l = 0.25$ (Digital Engagement Weight — 25%)

$$\sum w = 0.40 + 0.35 + 0.25 = 1.00$$

---

### 2. The Comprehensive Risk Score

$$\mathbf{R} = \max\left(0, \, \min\left(100, \, 100.0 - \mathbf{E}\right)\right)$$

---

### 3. Dynamic Threshold Classification

$$\text{Risk Standing}(\mathbf{R}) = \begin{cases} 
\text{Critical Risk} & \text{if } \mathbf{R} \ge \theta_{\text{critical}} \quad (\text{Default: } \ge 65\%) \\
\text{High Risk} & \text{if } \theta_{\text{high}} \le \mathbf{R} < \theta_{\text{critical}} \quad (\text{Default: } 40\% - 64\%) \\
\text{Moderate Warning} & \text{if } \theta_{\text{safe}} < \mathbf{R} < \theta_{\text{high}} \quad (\text{Default: } 30\% - 39\%) \\
\text{Low Risk (Safe)} & \text{if } \mathbf{R} \le \theta_{\text{safe}} \quad (\text{Default: } \le 30\%)
\end{cases}$$

---

### 4. Step-by-Step Worked Example

#### Case 1: High-Performing Student (`25CS001` — V. Sri Udbhav)
* Attendance $\mathbf{A} = 84\%$
* $\text{CGPA} = 8.40 \implies \mathbf{C}_{\text{scaled}} = 84.0$
* LMS Score $\mathbf{L} = 88\%$

$$\mathbf{E} = (84 \times 0.40) + (84.0 \times 0.35) + (88 \times 0.25) = 33.6 + 29.4 + 22.0 = 85.0\%$$
$$\mathbf{R} = 100.0 - 85.0 = \mathbf{15.0\%} \implies \mathbf{\text{Low Risk (Safe)}}$$

#### Case 2: At-Risk Student (`25CS005` — Arjun Patel)
* Attendance $\mathbf{A} = 61\%$ *(Below 75% cutoff)*
* $\text{CGPA} = 6.80 \implies \mathbf{C}_{\text{scaled}} = 68.0$ *(Below 7.5 benchmark)*
* LMS Score $\mathbf{L} = 50\%$ *(Below 60% threshold)*

$$\mathbf{E} = (61 \times 0.40) + (68.0 \times 0.35) + (50 \times 0.25) = 24.4 + 23.8 + 12.5 = 60.7\%$$
$$\mathbf{R} = 100.0 - 60.7 = \mathbf{39.3\%} \implies \mathbf{\text{Moderate-to-High Warning}}$$

---

## 🤖 Multi-Model LLM Engine & Resilience Hub

EduStudent Sight features a resilient AI Provider router with multi-candidate failover, automatic Cloudflare bypass headers, and dynamic system prompt context injection:

```
                                 ┌───────────────────────────────┐
                                 │   User Query + Cohort Context  │
                                 └───────────────┬───────────────┘
                                                 │
                                 ┌───────────────▼───────────────┐
                                 │    Active Provider Router     │
                                 └───────┬───────┬───────┬───────┘
                                         │       │       │
                ┌────────────────────────┘       │       └────────────────────────┐
                │                                │                                │
    ┌───────────▼───────────┐        ┌───────────▼───────────┐        ┌───────────▼───────────┐
    │     Google Gemini     │        │      Groq Cloud       │        │      OpenRouter       │
    │  (gemini-3.5-flash)   │        │    (groq/compound)    │        │   (openrouter/free)   │
    └───────────┬───────────┘        └───────────┬───────────┘        └───────────┬───────────┘
                │ [Failover]                     │ [Failover]                     │ [Failover]
    ┌───────────▼───────────┐        ┌───────────▼───────────┐        ┌───────────▼───────────┐
    │  gemini-3.5-flash-lite│        │   openai/gpt-oss-120b │        │  liquid/lfm-2.5-2.6b  │
    └───────────┬───────────┘        └───────────┬───────────┘        └───────────┬───────────┘
                │                                │                                │
                └────────────────────────┬───────┴────────────────────────────────┘
                                         │ [All Remote APIs Down]
                                 ┌───────▼───────┐
                                 │ Local Heustic │
                                 │ Fallback Engine│
                                 └───────────────┘
```

### Supported Providers & Models

| Provider | Configured Model | Failover Candidates | Description |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `gemini-3.5-flash` *(Recommended)* | `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash` | Blazing fast reasoning with native live cohort telemetry injection. |
| **Google Gemma 4** | `gemma-4-31b-it` | `gemma-4-26b-a4b-it` | Google's state-of-the-art open weights instruction model accessed via Gemini API key. |
| **Groq Cloud** | `groq/compound` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`, `groq/compound-mini` | LPUs delivering 500+ tokens/sec inference speed with automatic Cloudflare headers. |
| **OpenRouter** | `openrouter/free` *(Auto-Free)* | `liquid/lfm-2.5-2.6b:free`, `google/gemma-4-31b-it:free`, `z-ai/glm-5.2:free` | Intelligent multi-model router that dynamically selects the healthiest active free tier model. |
| **DeepSeek API** | `deepseek-chat` | `deepseek-reasoner` (R1) | Official DeepSeek API for deep logic and mathematical diagnostic queries. |
| **Local Ollama** | `qwen2.5:7b` / `llama3.2` | Multi-port resolver (`:11434`, `:11435`, `:8080`) | 100% offline private local inference on GPU or tunneled via ngrok/Cloudflare. |
| **Local Heuristic**| Rule-Based Engine | Deterministic Offline | Built-in offline fallback engine active when no external API key is provided. |

---

## 💻 Quick Start — Local Judge Review Mode

Evaluators and hackathon judges can launch both backend and frontend locally in less than 60 seconds with zero cloud setup required:

### Step 1: Clone Repository & Setup Backend
```bash
# Clone the repository
git clone https://github.com/SriUdbhav/EduStudentSight.git
cd EduStudentSight/backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Linux/macOS
# On Windows: venv\Scripts\activate

# Install dependencies (Flask, Gunicorn, OpenPyXL, Flask-CORS)
pip install -r requirements.txt

# Start the Flask API Server (runs on port 5000 with auto-seeding)
python3 app.py
```
*The database (`backend/database.db`) will automatically initialize and seed 100 students, 50 faculty/mentors, 10 admins, and 500 subject marks.*

### Step 2: Launch Frontend Server
```bash
# Open a second terminal and navigate to the frontend directory
cd EduStudentSight/front-end

# Start local HTTP web server
python3 -m http.server 8080
```

### Step 3: Open in Browser
Visit **`http://127.0.0.1:8080`** in your browser.

> [!NOTE]
> [`front-end/js/config.js`](front-end/js/config.js) automatically detects `localhost` / `127.0.0.1` and routes all API calls directly to `http://127.0.0.1:5000` with zero configuration!

---

## 🔑 Master Credentials & Evaluation Matrix

Use any of these pre-seeded accounts to evaluate different permission tiers and workflows:

| Role | User ID | Password | Display Name | Assigned Scope & Key Actions to Test |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Chief Administrator** | `admin` | `admin123` | System Administrator | Full governance, AI settings sync, approve/decline faculty applicants, CSV/Excel import. |
| 🛡️ **Dean Academic Affairs** | `ADM001` | `ADM001` | Dr. P. Venkateswarlu | Executive cohort metrics, institutional early-warning analytics, PDF audit reports. |
| 🛡️ **HOD (CSE)** | `ADM002` | `ADM002` | Dr. K. Radhika | Departmental teaching allocation, review faculty workload and pass rates. |
| 🎓 **Faculty Member** | `FAC001` | `FAC001` | Dr. Ramesh Kumar | Teaches DBMS (`CS201`) & OS (`CS202`), grading, view student CIE marks, review mentor sign-offs. |
| 🎓 **Faculty Member** | `FAC002` | `FAC002` | Dr. Priya Sharma | Teaches CN (`CS203`) & SE (`CS204`), exam cell coordination, view subject anomalies. |
| 🧭 **Senior Mentor** | `MEN001` | `MEN001` | Prof. Sunitha Devi | Mentee risk radar, schedule 1-on-1 counseling, submit session completion requests. |
| 🧭 **Student Mentor** | `MEN002` | `MEN002` | Dr. Anil Kumar | Foundation year mentee tracking, attendance habit intervention scheduling. |
| 👤 **Student (Nominal)** | `25CS001` | `25CS001` | V. Sri Udbhav | Top performer (CGPA 8.4, Risk 15%), 360° telemetry, subject marks, AI study assistant. |
| ⚠️ **Student (Critical Risk)**| `25CS005` | `25CS005` | Arjun Patel | High risk (CGPA 6.8, Attd 61%, Risk 72%), academic warning alerts, remedial history. |

*(Note: All 100 students can log in using their Student ID as password, e.g. `25CS001` / `25CS001` through `25CS100` / `25CS100`).*

---

## 🚀 Production Deployment Guide (Render + Netlify)

EduStudent Sight is architected for dual-cloud production hosting:

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Netlify CDN Edge)                 │
│   • Static HTML5 / Modular ES6 JavaScript                   │
│   • Catppuccin Mocha / Latte CSS Design Tokens              │
│   • _redirects Proxy: /api/* ──> Render Backend (No CORS)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  BACKEND (Render Web Service)                │
│   • Python 3.11 + Gunicorn WSGI Server                      │
│   • SQLite Database (Auto-provisions schema on boot)        │
│   • Multi-Model LLM Hub (Gemini, Groq, OpenRouter)          │
│   • Dual-Sync API Key & Risk Threshold Storage              │
└─────────────────────────────────────────────────────────────┘
```

### 1. Deploy Backend to Render.com
1. Fork or push this repository to your **GitHub** account.
2. Log in to **[dashboard.render.com](https://dashboard.render.com)**.
3. Click **New +** $\rightarrow$ **Blueprint** (or **Web Service**).
4. Select your repository. Render will automatically detect [`render.yaml`](render.yaml):
   * **Name**: `edustudent-sight-api`
   * **Root Directory**: `backend`
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn app:app --workers 2 --bind 0.0.0.0:$PORT --timeout 120`
5. *(Optional)* Under **Environment Variables**, add any API keys you wish to pre-provision:
   * `GEMINI_API_KEY`: `your_key_here`
   * `GROQ_API_KEY`: `your_key_here`
   * `OPENROUTER_API_KEY`: `your_key_here`
6. Click **Apply / Create Web Service**. Once live, copy your assigned Render URL (e.g. `https://edustudent-sight-api.onrender.com`).

### 2. Deploy Frontend to Netlify
1. Log in to **[app.netlify.com](https://app.netlify.com)** $\rightarrow$ **Add new site** $\rightarrow$ **Import an existing project**.
2. Connect your GitHub repository.
3. Set **Publish directory**: `front-end` (Leave build command empty).
4. Update `RENDER_BACKEND_URL` in [`front-end/js/config.js`](front-end/js/config.js) to your live Render backend URL:
   ```javascript
   const RENDER_BACKEND_URL = "https://edustudent-sight-api.onrender.com";
   ```
5. Netlify will use [`front-end/_redirects`](front-end/_redirects) to proxy all `/api/*` traffic seamlessly to Render without CORS friction.
6. Click **Deploy Site** — your platform is live with automatic global SSL!

---

## 🎨 Catppuccin Glassmorphic UI Design System

EduStudent Sight features a custom UI design system built on **Catppuccin Mocha** (Dark) and **Catppuccin Latte** (Light) palettes:

```css
:root {
    /* Catppuccin Mocha Glassmorphic Color Tokens */
    --bg-base: #1e1e2e;          /* Core application canvas */
    --bg-surface: #252538;       /* Card containers & panels */
    --bg-elevated: #313244;      /* Interactive dropdowns & modals */
    --bg-sunken: #181825;        /* Code blocks & input fields */
    
    --text: #cdd6f4;             /* Primary high-contrast typography */
    --text-soft: #a6adc8;        /* Secondary supporting copy */
    --text-muted: #6c7086;       /* Micro metadata & timestamps */
    
    --accent: #b4befe;           /* Lavender primary highlights */
    --primary: #89b4fa;          /* Blue action items & brand accent */
    --success: #a6e3a1;          /* Green nominal standing & approved */
    --warning: #f9e2af;          /* Yellow moderate warning indicators */
    --danger: #f38ba8;           /* Red critical risk & alert tags */
    
    --border: rgba(255, 255, 255, 0.08);
    --border-soft: rgba(255, 255, 255, 0.04);
    --glass-blur: blur(12px);
}
```

### Design Principles
* **Zero Glare & High Contrast**: Custom theme-aware `.alert` glass components eliminate abrasive Bootstrap yellow/beige boxes in dark mode.
* **Responsive Layouts**: Fully adaptive across 4K displays, laptops, tablets, and mobile smartphones.
* **Micro-Animations**: Smooth cubic-bezier transitions for card hover states, table pagination, and AI streaming indicators.

---

## 📊 Database Schema & Data Models

The SQLite database (`backend/database.db`) uses a 12-table relational model with automatic column migrations:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    students     │1     *│  subject_marks  │*     1│    subjects     │
├─────────────────┼───────┼─────────────────┼───────┼─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ code (PK)       │
│ name            │       │ student_id (FK) │       │ name            │
│ gender, course  │       │ subject_code(FK)│       │ short_name      │
│ year, cgpa      │       │ attendance      │       │ credits, year   │
│ attendance      │       │ internal_marks  │       │ semester        │
│ lms_score, risk │       │ external_marks  │       └─────────────────┘
│ email, phone    │       │ assignment_score│
└────────┬────────┘       │ grade           │
         │                └─────────────────┘
         │1
         │                ┌─────────────────┐       ┌─────────────────┐
         │*               │student_activitie│*     1│ extracurriculars│
         ├────────────────┼─────────────────┼───────┼─────────────────┤
         │                │ id (PK)         │       │ id (PK)         │
         │                │ student_id (FK) │       │ name            │
         │                │ activity_id (FK)│       │ category        │
         │                │ role, date      │       │ description     │
         │                └─────────────────┘       └─────────────────┘
         │
         │1
         │*
┌────────┴────────┐       ┌─────────────────┐       ┌─────────────────┐
│  interventions  │*     1│      users      │1     *│ signup_requests │
├─────────────────┼───────┼─────────────────┼───────┼─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ student_id (FK) │       │ password, role  │       │ user_id, role   │
│ date, action    │       │ display_name    │       │ display_name    │
│ status, urgency │       │ subjects        │       │ email, phone    │
│ subject_code    │       │ extra_roles     │       │ subjects        │
│ mentor_id (FK)  │       │ email, phone    │       │ status (Pending)│
│ completion_notes│       │ department      │       │ rejection_reason│
│ reviewed_by (FK)│       │ specialization  │       │ created_at      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 🔌 Complete REST API Reference

All endpoints return standard JSON envelopes with appropriate HTTP status codes:

### 1. Authentication & Session
* `POST /api/login` — Authenticate credentials.
  * **Payload**: `{"id": "admin", "password": "admin123"}`
  * **Response**: `{"success": true, "id": "admin", "role": "admin", "display_name": "System Administrator"}`

### 2. Students & Academic Telemetry
* `GET /api/students` — Retrieve all 100 student records with computed risk indices and metrics.
* `GET /api/students/<id>` — Retrieve deep 360° profile including enrolled subjects, CIE marks, and extracurricular activities.
* `POST /api/students` — Manually add a single student record.
* `PUT /api/students/<id>` — Update student profile, attendance %, or demographics.
* `DELETE /api/students/<id>` — Delete a student record.
* `POST /api/students/import` — Bulk import students via multipart CSV or Excel (`.xlsx`) upload.

### 3. Faculty & Mentor Workload Management
* `GET /api/faculty` — List all active faculty and mentors with student allocation counts.
* `GET /api/faculty/<id>` — Retrieve single faculty detail with assigned teaching subjects.
* `POST /api/faculty` — Create a new faculty member account.
* `PUT /api/faculty/<id>` — Update faculty profile, specialization, or subjects.
* `DELETE /api/faculty/<id>` — Remove faculty member account.
* `POST /api/users/import` — Bulk import faculty/mentors from CSV or Excel (`.xlsx`).

### 4. Interventions & Closed-Loop Review Queue
* `GET /api/interventions` — List all active and completed interventions.
* `POST /api/interventions` — Schedule a new 1-on-1 intervention session.
* `GET /api/interventions/enquiries` — Review queue for Pending, Completed, or Revision Needed sessions.
* `POST /api/interventions/<id>/request-completion` — Mentor requests sign-off with session commitments.
* `POST /api/interventions/<id>/approve-completion` — Reviewer approves and finalizes intervention completion.
* `POST /api/interventions/<id>/reject-completion` — Reviewer returns intervention with feedback description.
* `POST /api/interventions/<id>/resubmit-completion` — Mentor resubmits revised evidence.

### 5. Autonomous AI Agent & Chat
* `POST /api/agent/chat` — Send query to Multi-LLM engine with automatic cohort context injection.
  * **Payload**: `{"query": "Which students are at highest risk?", "provider": "gemini"}`
  * **Response**: `{"response": "Markdown formatted cohort telemetry analysis..."}`
* `POST /api/agent/run-autonomous-loop` — Trigger autonomous telemetry scan and log anomaly triggers.

### 6. System Settings & Thresholds
* `GET /api/settings` — Fetch system risk weights, attendance cutoffs, and masked API keys (`••••••••niVQ`).
* `POST /api/settings` — Update risk cutoffs and dual-sync API keys to SQLite and `.env`.

### 7. Signup Requests & Audit Trail
* `GET /api/signup-requests` — List pending faculty/mentor registration applications.
* `POST /api/signup-requests` — Submit a new registration request.
* `POST /api/signup-requests/<id>/approve` — Approve request and provision faculty login credentials.
* `POST /api/signup-requests/<id>/decline` — Decline request with recorded reason.
* `GET /api/email-logs` — Audit log of all credentials and notification emails dispatched.

---

## 🛠️ Comprehensive Directory Structure

```
EduStudentSight/
├── backend/
│   ├── app.py                      # Flask REST API Controller, CORS, Endpoints
│   ├── db.py                       # SQLite Database Driver, Schema, Migrations
│   ├── ai_engine.py                # Mathematical Risk Engine & Anomaly Detectors
│   ├── agent.py                    # Autonomous Agent Cycle & Telemetry Compiler
│   ├── llm_provider.py             # Multi-Model LLM Hub (Gemini, Gemma, Groq, OpenRouter, Ollama)
│   ├── generate_complete_data.py   # Master Dataset Generator (100 stu, 50 fac, 10 adm, 500 mrk)
│   ├── requirements.txt            # Python Dependencies (Flask, Gunicorn, OpenPyXL)
│   ├── Procfile                    # Render WSGI Startup Command
│   ├── database.db                 # Seeded SQLite Database (Auto-regenerates if deleted)
│   └── .env.example                # Environment Variables Template
├── front-end/
│   ├── index.html                  # Single-Page Application Shell & Modal Viewports
│   ├── _redirects                  # Netlify Reverse Proxy Configuration
│   ├── css/
│   │   ├── tokens.css              # Catppuccin Mocha Glassmorphic Color Tokens
│   │   ├── base.css                # Global Typography & Responsive Viewport Rules
│   │   ├── components.css          # Theme-Aware Alerts, Badges, Modals, Tables
│   │   └── pages.css               # View-Specific Layout Architecture
│   └── js/
│       ├── config.js               # Dual-Mode (Local / Production) Base URL Switcher
│       ├── api.js                  # Centralized REST Client with Offline Heuristic Fallback
│       ├── auth.js                 # RBAC Session Manager & 1-Click Demo Login Handlers
│       ├── main.js                 # Single-Page Router & Navigation State Controller
│       ├── theme.js                # Catppuccin Mocha / Latte Theme Switcher
│       ├── toast.js                # Floating Notification Toast Notification Engine
│       ├── chart-theme.js          # Dynamic Chart.js Glassmorphic Theme Adaptors
│       └── pages/
│           ├── dashboard.js        # Executive Cohort Telemetry & Distribution Dashboard
│           ├── students.js         # Searchable Cohort Directory with Filter Controls
│           ├── student360.js       # Individual 360° Academic Radar & Timeline View
│           ├── analytics.js        # Multi-Variable Correlation & Scatter Analytics Studio
│           ├── engagement.js       # LMS Digital Footprint & Inactivity Streak Detector
│           ├── mentor.js           # Mentorship Radar, 1-on-1 Scheduler & Mentee Cards
│           ├── enquiries.js        # Pending Enquiries Review Queue & Revision Workflow
│           ├── anomalies.js        # Live Telemetry Anomaly Stream & Risk Flags
│           ├── faculty.js          # Faculty Management & Applicant Approval Queue
│           ├── aiagent.js          # Autonomous AI Agent Studio with Model Switcher
│           ├── notifications.js    # Notification Center & Alert Feed
│           ├── reports.js          # Institutional Audit Report Generator & PDF Exporter
│           ├── settings.js         # Dynamic Risk Thresholds & AI Dual-Sync Hub
│           └── profile.js          # User Persona Profile & Preferences
├── data/                           # Exported Datasets & Master Excel Workbook
│   ├── EduStudent_Sight_Master_Database.xlsx  # Multi-Sheet Master Workbook (6 Sheets)
│   ├── students_100.csv                       # Complete Student Roster (100 Records)
│   ├── faculty_and_mentors_50.csv             # Faculty & Mentors Directory (50 Records)
│   ├── admins_10.csv                          # Administrator Directory (10 Records)
│   ├── master_credentials.csv                 # Master Credentials Access Directory (160 Accounts)
│   ├── subject_marks_500.csv                  # Granular Subject Marks Records (500 Rows)
│   └── interventions.csv                      # Interventions & Audit History (35 Records)
├── netlify.toml                    # Netlify Build & Security Headers Configuration
├── render.yaml                     # Render Blueprint Service Definition
├── .gitignore                      # Git Ignore Configuration
└── README.md                       # Comprehensive Platform Documentation
```

---

## ❓ Frequently Asked Questions & Troubleshooting

<details>
<summary><strong>Q1: Why is my Render backend slow on the very first request?</strong></summary>
<br/>
Render's free tier spins down web services after 15 minutes of inactivity. The initial request triggers a "cold start" taking ~30-45 seconds. Subsequent requests respond in sub-100ms.
</details>

<details>
<summary><strong>Q2: How do I run Ollama on my laptop while accessing a deployed Netlify site?</strong></summary>
<br/>
1. Run Ollama locally: <code>ollama run qwen2.5:7b</code><br/>
2. Expose the port via tunnel: <code>ngrok http 11434</code> or <code>cloudflared tunnel --url http://localhost:11434</code><br/>
3. Copy the HTTPS URL into <strong>Settings &rarr; AI Configuration &rarr; Custom API Base URL</strong>.
</details>

<details>
<summary><strong>Q3: How do I reset or re-seed the entire database from scratch?</strong></summary>
<br/>
Simply run the master data generator script:
<pre><code>python backend/generate_complete_data.py</code></pre>
It will instantly re-seed all 100 students, 50 faculty/mentors, 10 admins, and recreate all CSV and Excel files in <code>data/</code>.
</details>

---

## 📜 License & Institutional Context

Developed for the **Vignan University Department of Computer Science & Engineering** Hackathon.  
© 2026 EduStudent Sight Team. All Rights Reserved. Released under the MIT License.
