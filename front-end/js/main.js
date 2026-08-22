/* =====================================================
   MAIN.JS
   Application Router, Navigation & Global Event Handlers
===================================================== */

function renderPage(page) {
    switch (page) {
        case "dashboard":
            renderDashboard();
            break;
        case "students":
            renderStudents();
            break;
        case "analytics":
            renderAnalytics();
            break;
        case "engagement":
            renderEngagement();
            break;
        case "mentor":
            renderMentor();
            break;
        case "anomalies":
            renderAnomalies();
            break;
        case "student360":
            renderStudent360();
            break;
        case "aiagent":
            renderAIAgent();
            break;
        case "notifications":
            renderNotifications();
            break;
        case "reports":
            renderReports();
            break;
        case "settings":
            renderSettings();
            break;
        default:
            renderDashboard();
    }
}

function navigateTo(page) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.page === page) {
            item.classList.add("active");
        }
    });
    renderPage(page);
}

document.addEventListener("DOMContentLoaded", function() {
    // Initialize Auth Session & Event Listeners
    initAuth();

    // Initialize Add Student Modal submit & close buttons
    initStudentModalEvents();

    // Sidebar navigation click handler
    document.querySelectorAll(".nav-item").forEach(button => {
        button.addEventListener("click", function() {
            const page = this.dataset.page;
            navigateTo(page);
            if (window.innerWidth <= 750) {
                document.getElementById("sidebar")?.classList.remove("mobile-open");
            }
        });
    });

    // Sidebar collapse toggle button
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function() {
            const sidebar = document.getElementById("sidebar");
            if (window.innerWidth <= 750) {
                sidebar.classList.toggle("mobile-open");
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });
    }

    // Topbar Notifications button click
    const notificationBtn = document.getElementById("notificationButton");
    if (notificationBtn) {
        notificationBtn.addEventListener("click", function() {
            navigateTo("notifications");
        });
    }

    // Keyboard shortcut (Ctrl + K or Cmd + K) for quick search focus
    document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            document.getElementById("globalSearch")?.focus();
        }
    });
});
