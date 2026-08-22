/* =====================================================
   NOTIFICATIONS.JS
   Real-Time Academic Alerts & Mentoring Notifications
===================================================== */

async function renderNotifications() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const studentId = role === 'student' ? (user.linked_student_id || user.id) : null;

    const notifs = await API.getNotifications(studentId) || [];

    // Update badges
    const sideBadge = document.getElementById("sidebarNotifBadge");
    const topDot = document.getElementById("topNotifDot");
    if (sideBadge) sideBadge.textContent = notifs.length;
    if (topDot) topDot.textContent = notifs.length;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">🔔 Academic Alerts & Intervention Notifications</h1>
                <p class="text-muted small mb-0">System events, threshold alerts & autonomous action dispatches</p>
            </div>
            <span class="badge bg-primary fs-6">${notifs.length} Unread</span>
        </div>

        <div class="card-box p-4">
            ${notifs.length === 0 ? `
                <div class="text-center py-5">
                    <i class="bi bi-bell-slash text-muted fs-1 d-block mb-3"></i>
                    <h5 class="text-dark">No Notifications</h5>
                    <p class="text-muted small">You are all caught up! No urgent alerts at this moment.</p>
                </div>
            ` : `
                <div class="list-group list-group-flush">
                    ${notifs.map(n => {
                        let icon = "bi-info-circle-fill text-primary";
                        let borderClass = "border-primary";
                        if (n.type === "warning") {
                            icon = "bi-exclamation-triangle-fill text-warning";
                            borderClass = "border-warning";
                        } else if (n.type === "danger" || n.type === "critical" || n.type === "alert") {
                            icon = "bi-exclamation-octagon-fill text-danger";
                            borderClass = "border-danger";
                        } else if (n.type === "success") {
                            icon = "bi-check-circle-fill text-success";
                            borderClass = "border-success";
                        }

                        return `
                            <div class="list-group-item p-3 border-start border-4 ${borderClass} mb-2 bg-light rounded">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi ${icon} fs-5"></i>
                                        <strong class="text-dark">${n.title}</strong>
                                    </div>
                                    <small class="text-muted"><i class="bi bi-clock me-1"></i> ${n.date}</small>
                                </div>
                                <p class="text-muted small mb-0 ms-4">${n.message}</p>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        </div>
    `;
}
