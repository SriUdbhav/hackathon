/* =====================================================
   CONFIG.JS
   Environment & API Base URL Configuration
   Automatically points to local Flask server during development,
   or production API URL when deployed.
===================================================== */

const CONFIG = {
    // API_BASE_URL: Change this to your deployed Render URL when hosting live!
    // Example: "https://edu-student-sight-api.onrender.com"
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "http://127.0.0.1:5000" // Replace with live Render URL when deployed
};
