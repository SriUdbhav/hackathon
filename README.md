# EduStudent Sight - AI Academic Intelligence & Student Standing Platform

## Project Overview
An intelligent academic intelligence platform designed for institutional governance, faculty mentors, and students to unify student attendance, internal assessments, assignment submission records, and LMS activity into an explainable AI risk standing and autonomous intervention engine.

---

## Tech Stack
- **Frontend**: HTML5, Bootstrap 5, Modular Vanilla JS (`js/pages/`), CSS Tokens & Components (`css/`).
- **Backend**: Python 3, Flask, Flask-CORS (`backend/app.py`).
- **Database**: Local SQLite with connection pooling and schema migrations (`backend/database.db`).

---

## Authentication & Role-Based Access

EduStudent Sight supports direct, role-based credential authentication:

### Demo Accounts
- **Admin**: `admin` / `admin123` (Full System Access, Approval Workflows & System Settings)
- **Faculty**: `FAC001` / `FAC001` (Dr. Ramesh Kumar — Teaching, Assessments & Performance Insights)
- **Mentor**: `MEN001` / `MEN001` (Prof. Sunitha Devi — Mentee Counseling & Interventions)
- **Student**: `25CS001` / `25CS001` (V. Sri Udbhav — Personal 360° Academic Standing)
- **High Risk Student**: `25CS005` / `25CS005` (Arjun Patel — Academic Alert Dashboard)

---

## Quick Start
1. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```
2. **Start Frontend**:
   Serve `front-end/` with any HTTP server (e.g. `npx serve -l 8080 front-end` or open `index.html`).
