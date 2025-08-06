// Dashboard Main Coordinator
class DashboardManager {
    constructor() {
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.loadOverviewData();
    }

    bindEvents() {
        // Handle window resize for mobile sidebar
        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) {
                this.closeSidebar();
            }
        });
    }

    checkAuthentication() {
        if (!authService.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }

    loadOverviewData() {
        // Load initial dashboard data
        this.updateOverviewCards();
    }

    updateOverviewCards() {
        // Update overview cards with real data
        // This will be populated with API calls later
        console.log('Loading overview data...');
    }
}

// Section Management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        selectedSection.classList.add('active');
    }

    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Initialize section-specific functionality
    initializeSection(sectionName);

    // Close sidebar on mobile
    if (window.innerWidth <= 991) {
        closeSidebar();
    }
}

function initializeSection(sectionName) {
    switch(sectionName) {
        case 'overview':
            if (typeof OverviewManager !== 'undefined') {
                OverviewManager.init();
            }
            break;
        case 'subscription':
            if (typeof SubscriptionManager !== 'undefined') {
                SubscriptionManager.init();
            }
            break;
        case 'banks':
            if (typeof BankManager !== 'undefined') {
                BankManager.init();
            }
            break;
        case 'analytics':
            if (typeof AnalyticsManager !== 'undefined') {
                AnalyticsManager.init();
            }
            break;
        case 'budget':
            if (typeof BudgetManager !== 'undefined') {
                BudgetManager.init();
            }
            break;
        case 'ai-chat':
            if (typeof AIChatManager !== 'undefined') {
                AIChatManager.init();
            }
            break;
        case 'settings':
            if (typeof SettingsManager !== 'undefined') {
                SettingsManager.init();
            }
            break;
    }
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    
    sidebar.classList.toggle('show');
    toggle.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    
    sidebar.classList.remove('show');
    toggle.classList.remove('active');
}

// Logout Function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        authService.logout();
    }
}

// Utility Functions
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});
