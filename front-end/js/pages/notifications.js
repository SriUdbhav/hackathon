/* =====================================================
   NOTIFICATIONS.JS
   Renders live notifications and autonomous agent action alerts
===================================================== */

async function renderNotifications() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">Intervention Alerts & Notifications</h1>
                <p class="text-muted small mb-0">System alerts and autonomous AI agent dispatches</p>
            </div>
            <button class="btn btn-outline-secondary btn-sm" onclick="renderNotifications()">
                <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
        </div>

        <div class="card-box p-4" id="notificationsListContainer">
            <div class="text-center py-4 text-muted">
                <span class="spinner-border spinner-border-sm me-2"></span> Loading latest alerts...
            </div>
        </div>
    `;

    const container = document.getElementById("notificationsListContainer");
    const notifications = await API.getNotifications();

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-bell-slash fs-1 d-block mb-2 text-secondary"></i>
                <p class="mb-0">No active alerts. All student indicators are normal.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <ul class="list-group list-group-flush">
            ${notifications.map(n => {
                const icon = n.type === "danger" ? "🚨" : (n.type === "warning" ? "⚠️" : "ℹ️");
                const badgeColor = n.type === "danger" ? "bg-danger" : (n.type === "warning" ? "bg-warning text-dark" : "bg-primary");
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-start py-3">
                        <div class="me-auto">
                            <div class="fw-bold">${icon} ${n.title}</div>
                            <span class="text-secondary small">${n.message}</span>
                        </div>
                        <span class="badge ${badgeColor} rounded-pill">${n.date}</span>
                    </li>
                `;
            }).join("")}
        </ul>
    `;
}
