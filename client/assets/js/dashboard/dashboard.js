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
            if (window.innerWidth > 768) {
                this.closeSidebar();
            }
        });
        
        // Close sidebar when clicking on a menu item on mobile
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Prevent default to avoid any conflicts
                e.preventDefault();
                
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
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
    
    // Find and activate the correct menu item
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Initialize section-specific functionality
    initializeSection(sectionName);

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
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
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when sidebar is open on mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('active');
    hamburger.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
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
