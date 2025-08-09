// Dashboard Manager
class DashboardManager {
    constructor() {
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.loadUserProfile();
        this.handleInitialSection();
        this.loadOverviewData();
    }

    bindEvents() {
        // Handle window resize for mobile sidebar
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
        
        // Close sidebar when clicking on a menu item on mobile
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
    }

    checkAuthentication() {
        if (!authService.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }

    handleInitialSection() {
        // Check if we're returning from bank connection
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const ref = urlParams.get('ref');
        const code = urlParams.get('code');
        const requisition = urlParams.get('requisition');
        
        if (status === 'success' || ref || code || requisition) {
            // Show banks section immediately for bank connection
            console.log('🔄 Bank connection detected, showing banks section...');
            showSection('banks');
            return;
        }
        
        // Check if we have a stored section preference
        const lastSection = sessionStorage.getItem('lastDashboardSection');
        if (lastSection && lastSection !== 'overview') {
            console.log('🔄 Restoring last section:', lastSection);
            showSection(lastSection);
        } else {
            // Default to overview only on fresh login
            console.log('🔄 Showing default overview section');
            showSection('overview');
        }
    }

    loadOverviewData() {
        this.updateOverviewCards();
    }

    updateOverviewCards() {
        // Update overview cards with real data
        console.log('Loading overview data...');
    }

    async loadUserProfile() {
        try {
            const token = authService.getToken();
            if (!token) return;

            const response = await fetch(`${authService.baseURL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return;
            const user = await response.json();

            const nameTarget = document.querySelector('.sidebar-header .user-details h5');
            if (nameTarget && user?.name) {
                nameTarget.textContent = `Welcome, ${user.name}`;
            }
        } catch (err) {
            console.log('Failed to load user profile');
        }
    }
}

// Show dashboard section
async function showSection(sectionName) {
    // Store the section preference
    sessionStorage.setItem('lastDashboardSection', sectionName);
    
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
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Initialize section-specific functionality
    await initializeSection(sectionName);

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// Initialize section-specific functionality
async function initializeSection(sectionName) {
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
                await BankManager.init();
            }
            break;
        case 'analytics':
            if (typeof initializeAnalytics === 'function') {
                initializeAnalytics();
            }
            break;
        case 'budget':
            if (window.budgetManager) {
                window.budgetManager.init();
            } else if (window.initializeBudgetManager) {
                window.initializeBudgetManager();
            }
            break;
        case 'ai-chat':
            if (window.aiChatManager) {
                // AI Chat Manager is already initialized when the page loads
                // No need to call init() again as it's called in the constructor
                console.log('AI Chat section initialized');
            }
            break;
        case 'settings':
            if (typeof SettingsManager !== 'undefined') {
                SettingsManager.init();
            }
            break;
    }
}

// Sidebar management
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
    
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

// Logout handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        authService.logout();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Use global notifications utility
    if (typeof window.__notify === 'function') {
        window.__notify(message, type);
        return;
    }
    // Fallback: silently ignore
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});
