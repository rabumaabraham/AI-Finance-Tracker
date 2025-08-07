// Notification System
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${getNotificationIcon(type)}"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="lni lni-close"></i>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'lni lni-checkmark-circle';
        case 'error':
            return 'lni lni-close-circle';
        case 'warning':
            return 'lni lni-warning';
        case 'info':
            return 'lni lni-information';
        default:
            return 'lni lni-information';
    }
}

// Budget alert system
function checkBudgetAlerts() {
    if (window.budgetManager) {
        budgetManager.loadAlerts();
    }
}

// Check for budget alerts every 30 seconds
setInterval(checkBudgetAlerts, 30000);

// Export for use in other files
window.showNotification = showNotification;
