/* =====================================================
   NOTIFICATIONS.JS
   Real-Time Academic Alerts & Mentoring Notifications
   Features: Mark Read, Dismiss, Clear All, Search, Filters
   Modern, Clean, High-Readability UI
===================================================== */

async function renderNotifications() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const studentId = role === 'student' ? (user.linked_student_id || user.id) : null;

    const notifs = await API.getNotifications(studentId) || [];
    window._currentNotifs = notifs;

    // Count unread for badges
    const unreadCount = notifs.filter(n => !n.read).length;
    const sideBadge = document.getElementById("sidebarNotifBadge");
    const topDot = document.getElementById("topNotifDot");
    if (sideBadge) {
        if (unreadCount > 0) {
            sideBadge.classList.remove("d-none");
            sideBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            sideBadge.classList.add("d-none");
        }
    }
    if (topDot) {
        if (unreadCount > 0) {
            topDot.classList.remove("d-none");
            topDot.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            topDot.classList.add("d-none");
        }
    }

    // Get unique notification types for filter tabs
    const types = [...new Set(notifs.map(n => n.type || 'info'))];

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">Academic Alerts & Notifications</h1>
                <p class="small mb-0" style="color: var(--text-soft);">Real-time alerts, intervention reminders, and automated health dispatches</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <span class="badge ${unreadCount > 0 ? 'bg-primary text-white' : 'bg-secondary'} fs-6 d-flex align-items-center gap-1">
                    <i class="bi bi-bell-fill"></i> ${unreadCount} Unread
                </span>
                <span class="badge fs-6 d-flex align-items-center gap-1" style="background: var(--bg-sunken); color: var(--text); border: 1px solid var(--border-soft);">
                    <i class="bi bi-inbox-fill"></i> ${notifs.length} Total
                </span>
            </div>
        </div>

        <!-- ACTION BAR: Search + Filters + Bulk Actions -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2 align-items-center">
                <div class="col-md-4">
                    <div class="input-group">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search" style="color: var(--accent);"></i></span>
                        <input type="text" id="notifSearchInput" class="form-control" placeholder="Search alerts by title or student ID..." oninput="applyNotifFilters()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                    </div>
                </div>
                <div class="col-md-3">
                    <select id="notifTypeFilter" class="form-select" onchange="applyNotifFilters()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL">All Categories (${notifs.length})</option>
                        ${types.map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-2">
                    <select id="notifStatusFilter" class="form-select" onchange="applyNotifFilters()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL">All Status</option>
                        <option value="UNREAD" ${unreadCount > 0 ? 'selected' : ''}>Unread Only (${unreadCount})</option>
                        <option value="READ">Read Only</option>
                    </select>
                </div>
                <div class="col-md-3 text-md-end d-flex gap-2 justify-content-md-end">
                    <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onclick="handleMarkAllRead()" title="Mark all displayed as read">
                        <i class="bi bi-check2-all"></i> Mark All Read
                    </button>
                    <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onclick="handleDeleteAllNotifs()" title="Clear and delete all notifications">
                        <i class="bi bi-trash3"></i> Delete All
                    </button>
                </div>
            </div>
        </div>

        <!-- NOTIFICATIONS LIST -->
        <div id="notifsContainer" class="d-flex flex-column gap-3">
            ${renderNotifCards(notifs)}
        </div>
    `;
}

function renderNotifCards(list) {
    if (!list || list.length === 0) {
        return `
            <div class="card-box p-5 text-center text-muted">
                <i class="bi bi-bell-slash fs-1 d-block mb-3 text-secondary"></i>
                <h5 class="fw-semibold">No Notifications Found</h5>
                <p class="small text-muted mb-0">You're all caught up! No academic alerts found matching your criteria.</p>
            </div>
        `;
    }

    return list.map(n => {
        const isUnread = !n.read;
        let typeBadgeClass = 'bg-info text-dark';
        let typeIcon = 'bi-info-circle-fill';
        let borderLeftColor = 'var(--info)';

        const typeNorm = (n.type || 'info').toLowerCase();
        if (typeNorm === 'critical' || typeNorm === 'danger' || typeNorm === 'alert') {
            typeBadgeClass = 'bg-danger text-white';
            typeIcon = 'bi-exclamation-octagon-fill';
            borderLeftColor = 'var(--risk-high)';
        } else if (typeNorm === 'warning') {
            typeBadgeClass = 'bg-warning text-dark';
            typeIcon = 'bi-exclamation-triangle-fill';
            borderLeftColor = 'var(--warning)';
        } else if (typeNorm === 'success') {
            typeBadgeClass = 'bg-success text-white';
            typeIcon = 'bi-check-circle-fill';
            borderLeftColor = 'var(--success)';
        }

        const dateStr = formatNotifDate(n.date);
        const isEnquiryNotif = (n.title && (n.title.includes("Completion Review") || n.title.includes("Revision") || n.title.includes("Completion Approved") || n.title.includes("New Session")));
        const isPendingReviewNotif = (n.title && n.title.includes("Completion Review Requested"));

        return `
            <div class="notif-card p-3 rounded-3 shadow-sm position-relative ${isUnread ? 'notif-unread' : 'notif-read'}" 
                 id="notif-${n.id}" 
                 style="border-left: 4px solid ${borderLeftColor};">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div class="d-flex align-items-start gap-3 flex-grow-1">
                        <div class="p-2 rounded-circle fs-5 d-flex align-items-center justify-content-center" style="background: var(--bg-sunken); width: 40px; height: 40px; flex-shrink: 0;">
                            <i class="bi ${typeIcon}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h6 class="fw-bold mb-0 ${isUnread ? 'text-dark' : 'text-secondary'}">${n.title}</h6>
                                <span class="badge ${typeBadgeClass} small px-2 py-0" style="font-size: 10px;">${typeNorm.toUpperCase()}</span>
                                ${isUnread ? '<span class="badge bg-primary text-white" style="font-size: 9px;"><i class="bi bi-circle-fill" style="font-size: 6px;"></i> NEW</span>' : ''}
                            </div>
                            <p class="mb-2 text-dark small" style="line-height: 1.5;">${n.message}</p>
                            <div class="d-flex align-items-center gap-3 text-muted flex-wrap" style="font-size: 11px;">
                                <span><i class="bi bi-clock me-1"></i>${dateStr}</span>
                                ${n.student_id ? `<span><i class="bi bi-person me-1"></i>Student: <strong>${n.student_id}</strong></span>` : ''}
                            </div>

                            ${isEnquiryNotif ? `
                                <div class="mt-2 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2" style="border-color: var(--border-soft) !important;">
                                    <div class="d-flex gap-2 align-items-center">
                                        <button class="primary-btn btn-sm py-1 px-2" style="font-size: 11px;" onclick="navigateTo('enquiries')">
                                            <i class="bi bi-patch-check me-1"></i> Open Enquiries & Reviews
                                        </button>
                                        <button class="secondary-btn btn-sm py-1 px-2" style="font-size: 11px;" onclick="navigateTo('mentor')">
                                            <i class="bi bi-compass me-1"></i> Mentorship Pipeline
                                        </button>
                                    </div>
                                    <span class="small text-muted" style="font-size: 11px;">
                                        <i class="bi bi-shield-check text-success me-1"></i> Tracked in persistent Enquiries Center
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Individual Actions -->
                    <div class="d-flex gap-1 flex-shrink-0 align-self-start">
                        ${isUnread ? `
                            <button class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="handleMarkSingleRead(${n.id})" title="Mark as read">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="handleDeleteSingleNotif(${n.id})" title="Dismiss alert (Enquiry remains preserved in Enquiries Center)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function formatNotifDate(dateStr) {
    if (!dateStr) return "Just now";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateStr;
    }
}

function applyNotifFilters() {
    const rawSearch = (document.getElementById("notifSearchInput")?.value || "").toLowerCase();
    const typeFilter = document.getElementById("notifTypeFilter")?.value || "ALL";
    const statusFilter = document.getElementById("notifStatusFilter")?.value || "ALL";

    let list = window._currentNotifs || [];

    if (rawSearch) {
        list = list.filter(n =>
            (n.title && n.title.toLowerCase().includes(rawSearch)) ||
            (n.message && n.message.toLowerCase().includes(rawSearch)) ||
            (n.student_id && n.student_id.toLowerCase().includes(rawSearch))
        );
    }

    if (typeFilter !== "ALL") {
        list = list.filter(n => (n.type || 'info').toLowerCase() === typeFilter.toLowerCase());
    }

    if (statusFilter === "UNREAD") {
        list = list.filter(n => !n.read);
    } else if (statusFilter === "READ") {
        list = list.filter(n => n.read);
    }

    const container = document.getElementById("notifsContainer");
    if (container) {
        container.innerHTML = renderNotifCards(list);
    }
}

async function handleMarkSingleRead(notifId) {
    const res = await API.markNotificationRead(notifId);
    if (res && res.success) {
        const item = (window._currentNotifs || []).find(n => n.id === notifId);
        if (item) item.read = 1;
        updateNotifBadges();
        applyNotifFilters();
    }
}

async function handleMarkAllRead() {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const studentId = role === 'student' ? (user.linked_student_id || user.id) : null;

    const res = await API.markAllNotificationsRead(studentId);
    if (res && res.success) {
        (window._currentNotifs || []).forEach(n => n.read = 1);
        updateNotifBadges();
        applyNotifFilters();
    }
}

async function handleDeleteSingleNotif(notifId) {
    const res = await API.deleteNotification(notifId);
    if (res && res.success) {
        window._currentNotifs = (window._currentNotifs || []).filter(n => n.id !== notifId);
        updateNotifBadges();
        applyNotifFilters();
    }
}

async function handleDeleteAllNotifs() {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const studentId = role === 'student' ? (user.linked_student_id || user.id) : null;

    const ok = await showConfirmModal({
        title: "Delete All Notifications",
        message: "Are you sure you want to permanently clear all notifications from your inbox?",
        confirmText: "Clear All Notifications",
        confirmBtnClass: "btn btn-danger",
        icon: "bi-trash3-fill text-danger"
    });
    if (!ok) return;

    const res = await API.deleteAllNotifications(studentId);
    if (res && res.success) {
        showSuccessToast("All notifications deleted.");
        renderNotifications();
    }
}

function updateNotifBadges() {
    const notifs = window._currentNotifs || [];
    const unreadCount = notifs.filter(n => !n.read).length;
    const sideBadge = document.getElementById("sidebarNotifBadge");
    const topDot = document.getElementById("topNotifDot");
    if (sideBadge) {
        if (unreadCount > 0) {
            sideBadge.classList.remove("d-none");
            sideBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            sideBadge.classList.add("d-none");
        }
    }
    if (topDot) {
        if (unreadCount > 0) {
            topDot.classList.remove("d-none");
            topDot.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            topDot.classList.add("d-none");
        }
    }
}

// Window Exports for Notifications Page
window.renderNotifications = renderNotifications;
window.applyNotifFilters = applyNotifFilters;
window.handleMarkSingleRead = handleMarkSingleRead;
window.handleMarkAllRead = handleMarkAllRead;
window.handleDeleteSingleNotif = handleDeleteSingleNotif;
window.handleDeleteAllNotifs = handleDeleteAllNotifs;
window.updateNotifBadges = updateNotifBadges;
