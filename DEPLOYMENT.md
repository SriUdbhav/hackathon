# 🚀 Deployment Guide — EduStudent Sight

This guide covers 1-click and standard deployment options for both the **Frontend** and **Backend** across popular hosting platforms.

---

## 🎯 Architecture Overview

- **Frontend**: Pure HTML5 / CSS3 / Vanilla JS SPA (No build step required).
  - Can be hosted on **Netlify**, **Vercel**, **Render Static Site**, or **GitHub Pages**.
- **Backend**: Python 3.11+ Flask REST API + SQLite + Autonomous Intervention Engine.
  - Can be hosted on **Render (Web Service)**, **Railway**, **Fly.io**, or any **Docker container**.

---

## Option 1: 🌟 Render 1-Click Blueprint (Recommended - Fullstack)

Both backend and frontend can be deployed together via Render Blueprint (`render.yaml`):

1. Push your repository to **GitHub**.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **"New +"** $\rightarrow$ **"Blueprint"**.
4. Select your repository. Render will automatically detect `render.yaml` and configure:
   - **`edustudent-sight-api`**: Python Web Service running Gunicorn.
   - **`edustudent-sight`**: Static Site serving `front-end/`.
5. Add your optional AI API keys (e.g. `GEMINI_API_KEY`, `GROQ_API_KEY`) in the environment settings if desired.
6. Click **"Apply"**.

---

## Option 2: Split Deployment (Render Backend + Netlify Frontend)

### Step 1: Deploy Backend to Render
1. Create a **New Web Service** on Render connected to your repository.
2. Set configuration:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 2 --bind 0.0.0.0:$PORT --timeout 120`
3. In **Environment Variables**, optionally set:
   - `GEMINI_API_KEY` (from Google AI Studio)
   - `GROQ_API_KEY` (from Groq Cloud)
4. Copy your deployed Render backend URL (e.g. `https://edustudent-sight-api.onrender.com`).

### Step 2: Deploy Frontend to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** $\rightarrow$ **"Import an existing project"** $\rightarrow$ select your GitHub repo.
3. Configuration:
   - **Publish directory**: `front-end`
   - **Build command**: *(Leave blank)*
4. If your Render backend URL is different from `https://edustudent-sight-api.onrender.com`:
   - Update `RENDER_BACKEND_URL` in [front-end/js/config.js](file:///c:/Users/Sidhartha/OneDrive/Desktop/hackathon/front-end/js/config.js), OR
   - Set environment variable `RENDER_BACKEND_URL` in Netlify dashboard.
5. Deploy Site.

---

## Option 3: Deploy Frontend to Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com/).
2. Vercel will automatically read [vercel.json](file:///c:/Users/Sidhartha/OneDrive/Desktop/hackathon/vercel.json) at the root.
3. Deploy!

---

## Option 4: Docker / Container Deployment (Railway, Fly.io, Cloud Run)

The repository includes a ready-to-deploy [Dockerfile](file:///c:/Users/Sidhartha/OneDrive/Desktop/hackathon/Dockerfile):

```bash
# Build Docker image
docker build -t edustudent-sight .

# Run Docker container locally
docker run -p 5000:5000 -e GEMINI_API_KEY="your-key" edustudent-sight
```

---

## 🔑 Demo Login Accounts

| Role | User ID / Login | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | System Administrator |
| **Dean / Admin** | `ADM001` | `ADM001` | Dr. P. Venkateswarlu (Dean of Academics) |
| **Faculty** | `FAC001` | `FAC001` | Dr. Ramesh Kumar (CSE) |
| **Faculty / Mentor** | `FAC002` | `FAC002` | Dr. Priya Sharma |
| **Student** | `221FA04001` | `221FA04001` | Sri Udbhav Vangapandu |
