/**
 * EduStudent Sight — Theme-Aware Notification Toasts & Modal Prompts
 * Replaces native browser alert() and confirm() with sleek, responsive, theme-adaptive components.
 */

// Initialize Toast Container
function _ensureToastContainer() {
    let container = document.getElementById('globalToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'globalToastContainer';
        container.className = 'global-toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show a theme-aware bottom notification toast.
 * @param {string} message - Message text or HTML
 * @param {'info'|'success'|'danger'|'error'|'warning'} type - Semantic notification type
 * @param {number} duration - Display duration in ms (default 3800ms)
 */
function showToast(message, type = 'info', duration = 4000) {
    if (!message) return;
    const container = _ensureToastContainer();

    // Normalize type
    if (type === 'error') type = 'danger';
    if (!['info', 'success', 'danger', 'warning'].includes(type)) {
        // Auto-detect type from message content if not explicitly specified
        const lower = String(message).toLowerCase();
        if (lower.includes('success') || lower.includes('approved') || lower.includes('added') || lower.includes('🎉')) type = 'success';
        else if (lower.includes('failed') || lower.includes('error') || lower.includes('deleted') || lower.includes('declined')) type = 'danger';
        else if (lower.includes('warning') || lower.includes('caution') || lower.includes('attention')) type = 'warning';
        else type = 'info';
    }

    const icons = {
        success: 'bi-check-circle-fill text-success',
        danger: 'bi-exclamation-octagon-fill text-danger',
        warning: 'bi-exclamation-triangle-fill text-warning',
        info: 'bi-info-circle-fill text-primary'
    };

    const borders = {
        success: 'var(--success, #10b981)',
        danger: 'var(--danger, #ef4444)',
        warning: 'var(--warning, #f59e0b)',
        info: 'var(--accent, #3b82f6)'
    };

    const toast = document.createElement('div');
    toast.className = `custom-toast-item toast-${type}`;
    toast.style.borderLeftColor = borders[type];

    // Escape and format message (convert newlines to line breaks)
    const formattedMsg = String(message).replace(/\n/g, '<br>');

    toast.innerHTML = `
        <div class="toast-icon-wrap">
            <i class="bi ${icons[type]} fs-5"></i>
        </div>
        <div class="toast-content-wrap">
            <div class="toast-msg">${formattedMsg}</div>
        </div>
        <button class="toast-close-btn" aria-label="Close notification">&times;</button>
    `;

    // Dismiss action
    const dismiss = () => {
        if (toast.classList.contains('dismissing')) return;
        toast.classList.add('dismissing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 320);
    };

    toast.querySelector('.toast-close-btn').onclick = (e) => {
        e.stopPropagation();
        dismiss();
    };

    // Auto-dismiss timer
    if (duration > 0) {
        setTimeout(dismiss, duration);
    }

    container.appendChild(toast);
}

// Convenience Aliases
function showSuccessToast(msg, dur) { showToast(msg, 'success', dur); }
function showErrorToast(msg, dur) { showToast(msg, 'danger', dur); }
function showWarningToast(msg, dur) { showToast(msg, 'warning', dur); }
function showInfoToast(msg, dur) { showToast(msg, 'info', dur); }

/**
 * Theme-Aware Confirmation Modal
 * Replaces native confirm() with a modern, promise-based modal dialog.
 * @param {Object} options - { title, message, confirmText, cancelText, confirmBtnClass }
 * @returns {Promise<boolean>}
 */
function showConfirmModal({
    title = "Confirmation Required",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmBtnClass = "btn btn-danger",
    icon = "bi-exclamation-circle-fill text-warning"
} = {}) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('globalConfirmModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalConfirmModal';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        const formattedMsg = String(message).replace(/\n/g, '<br>');

        overlay.innerHTML = `
            <div class="student-modal" style="max-width: 480px; animation: modalSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
                <div class="modal-head">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi ${icon} fs-4"></i>
                        <h4 class="mb-0 fw-bold" style="color: var(--text);">${title}</h4>
                    </div>
                    <button class="modal-close" id="confirmModalCloseBtn"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <div class="mb-4" style="color: var(--text-soft); font-size: 14px; line-height: 1.6;">
                        ${formattedMsg}
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" id="confirmModalCancelBtn">${cancelText}</button>
                        <button type="button" class="${confirmBtnClass}" id="confirmModalSubmitBtn">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        overlay.classList.add('active');

        const cleanup = (result) => {
            overlay.classList.remove('active');
            document.removeEventListener('keydown', keyHandler);
            resolve(result);
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') cleanup(false);
            if (e.key === 'Enter') cleanup(true);
        };

        document.addEventListener('keydown', keyHandler);

        document.getElementById('confirmModalCloseBtn').onclick = () => cleanup(false);
        document.getElementById('confirmModalCancelBtn').onclick = () => cleanup(false);
        document.getElementById('confirmModalSubmitBtn').onclick = () => cleanup(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup(false);
        };
    });
}

// Global Interceptor: Safely override window.alert to route directly into theme-aware bottom toasts
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
window.showConfirmModal = showConfirmModal;

// Override browser alert
window.alert = function(msg) {
    showToast(msg);
};
