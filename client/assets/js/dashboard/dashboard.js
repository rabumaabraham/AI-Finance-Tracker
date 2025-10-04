// Dashboard Manager
class DashboardManager {
    constructor() {
        this.currentSection = 'overview';
        this.init();
        
        // Check for Stripe returns when page loads
        this.checkForStripeReturn();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.loadUserProfile();
        this.handleInitialSection();
        this.loadOverviewData();
        
        // Additional check for Stripe returns after a short delay
        setTimeout(() => {
            if (window.checkForStripeReturn) {
                console.log('⏰ Delayed Stripe return check...');
                window.checkForStripeReturn();
            }
        }, 1000);
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
        // Check if we're returning from Stripe checkout
        let hashParams = new URLSearchParams();
        if (window.location.hash && window.location.hash.includes('?')) {
            const hashPart = window.location.hash.split('?')[1];
            hashParams = new URLSearchParams(hashPart);
        }
        const checkout = hashParams.get('checkout');
        
        console.log('🔍 Dashboard checking initial section:', {
            hash: window.location.hash,
            hashPart: window.location.hash.split('?')[1] || 'none',
            checkout: checkout
        });
        
        if (checkout === 'success') {
            console.log('🎯 Stripe checkout success detected, showing subscription section...');
            showSection('subscription');
            return;
        } else if (checkout === 'cancel') {
            console.log('❌ Stripe checkout cancel detected, showing subscription section...');
            showSection('subscription');
            return;
        }
        
        // Check if we're returning from bank connection
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const ref = urlParams.get('ref');
        const code = urlParams.get('code');
        const requisition = urlParams.get('requisition');
        
        // Only show banks section if we have actual GoCardless return parameters
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
    
    checkForStripeReturn() {
        // Check if we're returning from Stripe checkout
        let hashParams = new URLSearchParams();
        if (window.location.hash && window.location.hash.includes('?')) {
            const hashPart = window.location.hash.split('?')[1];
            hashParams = new URLSearchParams(hashPart);
        }
        const checkout = hashParams.get('checkout');
        
        console.log('🔍 Dashboard checking for Stripe return:', {
            hash: window.location.hash,
            hashPart: window.location.hash.split('?')[1] || 'none',
            checkout: checkout
        });
        
        if (checkout === 'success' || checkout === 'cancel') {
            console.log('🎯 Stripe return detected in dashboard, will handle in section initialization');
            // The section initialization will handle the actual processing
        }
    }
}

// Show dashboard section
async function showSection(sectionName) {
    // Hide all sections first
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Store the last section in session storage
        sessionStorage.setItem('lastDashboardSection', sectionName);
        
        // Initialize the section if it hasn't been initialized yet
        await initializeSection(sectionName);
        
        // Special handling for subscription section to ensure content is loaded
        if (sectionName === 'subscription' && typeof SubscriptionManager !== 'undefined') {
            console.log('🎯 Ensuring subscription content is loaded...');
            // Force a re-render of the subscription section
            if (window.__subscriptionManagerInstance) {
                // Ensure the section is visible before rendering
                const subscriptionSection = document.getElementById('subscription');
                if (subscriptionSection) {
                    subscriptionSection.style.display = 'block';
                    console.log('📱 Subscription section made visible');
                }
                
                // Small delay to ensure DOM is ready
                setTimeout(async () => {
                    console.log('⏰ Rendering subscription content after delay...');
                    await window.__subscriptionManagerInstance.render();
                }, 100);
            }
        }
    }

    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

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
                // Check if we're returning from Stripe checkout
                let hashParams = new URLSearchParams();
                if (window.location.hash && window.location.hash.includes('?')) {
                    const hashPart = window.location.hash.split('?')[1];
                    hashParams = new URLSearchParams(hashPart);
                }
                const checkout = hashParams.get('checkout');
                
                if (checkout === 'success' || checkout === 'cancel') {
                    console.log('🎯 Initializing subscription section with Stripe return:', checkout);
                }
                
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
