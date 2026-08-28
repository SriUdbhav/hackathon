/* =====================================================
   CONFIG.JS
   Environment & API Base URL Configuration
   
   Supports THREE deployment modes:
   1. LOCAL DEV:     http://127.0.0.1:5000 (Flask dev server)
   2. LOCAL REVIEW:  http://127.0.0.1:5000 (for judges reviewing locally)
   3. PRODUCTION:    Auto-detects Render backend URL from environment
   
   To set your production Render URL, either:
   a) Set window.RENDER_BACKEND_URL before this script loads, OR
   b) Replace the RENDER_BACKEND_URL constant below with your deployed URL
===================================================== */

// ── Production Backend URL ──────────────────────────
// Replace this with your actual Render/Railway backend URL after deploying.
// Example: "https://edustudent-sight-api.onrender.com"
const RENDER_BACKEND_URL = "https://edustudent-sight-api.onrender.com";

const CONFIG = (() => {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";

    // 1. Check if an override is stored in localStorage (useful for judge testing/live switching)
    const customOverride = localStorage.getItem("API_BASE_URL");
    if (customOverride && customOverride.trim()) {
        return { API_BASE_URL: customOverride.trim().replace(/\/+$/, ""), MODE: "custom-override" };
    }

    // 2. Local development / local judge review → Flask dev server on port 5000
    if (isLocal) {
        return { API_BASE_URL: "http://127.0.0.1:5000", MODE: "local" };
    }

    // 3. Production (Netlify / Vercel / Render / Railway)
    // Priority: window.BACKEND_API_URL > window.RENDER_BACKEND_URL > hardcoded constant
    const backendUrl = window.BACKEND_API_URL || window.RENDER_BACKEND_URL || RENDER_BACKEND_URL;
    return { API_BASE_URL: backendUrl.replace(/\/+$/, ""), MODE: "production" };
})();

console.log(`[EduStudent Sight] Mode: ${CONFIG.MODE} | API: ${CONFIG.API_BASE_URL}`);

