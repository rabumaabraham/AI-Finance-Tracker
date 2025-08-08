// Analytics Manager
class AnalyticsManager {
    constructor() {
        console.log('🔧 Creating AnalyticsManager instance...');
        //
        // this.baseURL = 'http://localhost:5000/api/analytics';

        this.baseURL = 'https://https://finance-tracker-tlss.onrender.com/api/analytics';
        this.currentBankFilter = 'all';
        this.currentPeriod = 'month';
        this.connectedBanks = [];
        this.analyticsData = null;
        
        // Clear any cached analytics data
        localStorage.removeItem('analyticsData');
        sessionStorage.removeItem('analyticsData');
        
        console.log('✅ AnalyticsManager instance created');
    }

    async init() {
        console.log('📊 Initializing Analytics Manager...');
        await this.loadConnectedBanks();
        await this.loadAnalytics();
        this.bindEvents();
    }

    async loadConnectedBanks() {
        try {
            const token = authService.getToken();
            if (!token) {
                console.log('📊 No auth token, clearing banks');
                this.connectedBanks = [];
                this.updateBankFilter();
                return;
            }

            console.log('📊 Loading connected banks for analytics...');
            const response = await fetch(`${this.baseURL}/banks`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.connectedBanks = await response.json();
                console.log('📊 Connected banks loaded:', this.connectedBanks);
            } else {
                console.log('📊 Failed to load banks, clearing list');
                this.connectedBanks = [];
            }
            
            this.updateBankFilter();
        } catch (error) {
            console.error('Error loading banks:', error);
            this.connectedBanks = [];
            this.updateBankFilter();
        }
    }

    updateBankFilter() {
        const bankFilter = document.getElementById('bankFilter');
        if (!bankFilter) return;

        bankFilter.innerHTML = '<option value="all">All Connected Banks</option>';

        this.connectedBanks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.id;
            option.textContent = `${bank.name} (${bank.type})`;
            bankFilter.appendChild(option);
        });

        if (this.connectedBanks.length === 0) {
            bankFilter.innerHTML = '<option value="all">No banks connected</option>';
            // Force clear analytics when no banks are connected
            console.log('📊 No banks connected, forcing analytics clear');
            this.analyticsData = null;
            this.updateAnalyticsDisplay();
            
            // Also clear any cached data in localStorage
            localStorage.removeItem('analyticsData');
        }
    }

    async loadAnalytics() {
        try {
            const token = authService.getToken();
            if (!token) {
                this.analyticsData = null;
                this.updateAnalyticsDisplay();
                return;
            }

            // If no banks connected, clear analytics immediately
            if (this.connectedBanks.length === 0) {
                console.log('📊 No banks connected, clearing analytics');
                this.analyticsData = null;
                this.updateAnalyticsDisplay();
                return;
            }

            let url;
            if (this.currentBankFilter === 'all') {
                url = `${this.baseURL}/combined?period=${this.currentPeriod}`;
            } else {
                url = `${this.baseURL}/bank/${this.currentBankFilter}?period=${this.currentPeriod}`;
            }

            console.log('📊 Loading analytics from:', url);
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Analytics data received:', data);
                
                // Check if we actually have data
                if (data.transactionCount === 0 && data.totalIncome === 0 && data.totalExpenses === 0) {
                    console.log('📊 No transaction data found, clearing analytics');
                    this.analyticsData = null;
                } else {
                    this.analyticsData = data;
                }
            } else {
                console.log('📊 Analytics request failed, clearing data');
                this.analyticsData = null;
            }
            
            this.updateAnalyticsDisplay();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.analyticsData = null;
            this.updateAnalyticsDisplay();
        }
    }

    updateAnalyticsDisplay() {
        // Always update display, even when analyticsData is null
        this.updateSummaryCards();
        this.updateTopCategories();
        this.updateRecentTransactions();
    }

    updateSummaryCards() {
        if (!this.analyticsData) {
            // Show empty state
            const elements = ['totalIncome', 'totalExpenses', 'netAmount', 'transactionCount'];
            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (id === 'transactionCount') {
                        element.textContent = '0';
                    } else {
                        element.textContent = '€0.00';
                    }
                }
            });
            return;
        }

        const { totalIncome = 0, totalExpenses = 0, netAmount = 0, transactionCount = 0 } = this.analyticsData;

        // Update income
        const incomeElement = document.getElementById('totalIncome');
        if (incomeElement) {
            incomeElement.textContent = `€${totalIncome.toFixed(2)}`;
        }

        // Update expenses
        const expensesElement = document.getElementById('totalExpenses');
        if (expensesElement) {
            expensesElement.textContent = `€${totalExpenses.toFixed(2)}`;
        }

        // Update net amount
        const netElement = document.getElementById('netAmount');
        if (netElement) {
            netElement.textContent = `€${netAmount.toFixed(2)}`;
            netElement.className = `balance-amount h2 ${netAmount >= 0 ? 'text-success' : 'text-danger'}`;
        }

        // Update transaction count
        const countElement = document.getElementById('transactionCount');
        if (countElement) {
            countElement.textContent = transactionCount;
        }
    }

    updateTopCategories() {
        const container = document.getElementById('topCategories');
        if (!container) return;

        if (!this.analyticsData || !this.analyticsData.topCategories || this.analyticsData.topCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="lni lni-pie-chart"></i>
                    <h4>No categories found</h4>
                    <p>No spending data available for the selected period</p>
                </div>
            `;
            return;
        }

        const { topCategories } = this.analyticsData;

        // Sort categories by amount (highest to lowest) to ensure proper ranking
        const sortedCategories = [...topCategories].sort((a, b) => b.amount - a.amount);

        const categoriesHTML = sortedCategories.map((category, index) => `
            <div class="category-item">
                <div class="category-rank">${index + 1}</div>
                <div class="category-info">
                    <h4>${category.category}</h4>
                    <p>€${category.amount.toFixed(2)}</p>
                </div>
                <div class="category-icon">
                    <i class="${this.getCategoryIcon(category.category)}"></i>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHTML;
    }

    /**
     * Get category-specific icon
     * @param {string} category - The category name
     * @returns {string} - The icon class name
     */
    getCategoryIcon(category) {
        const categoryLower = category.toLowerCase();
        
        const iconMap = {
            'food': 'lni lni-dinner',
            'transport': 'lni lni-car',
            'transportation': 'lni lni-car',
            'entertainment': 'lni lni-game',
            'bills': 'lni lni-files',
            'salary': 'lni lni-wallet',
            'income': 'lni lni-wallet',
            'health': 'lni lni-heart',
            'healthcare': 'lni lni-heart',
            'medical': 'lni lni-heart',
            'shopping': 'lni lni-shopping-basket',
            'retail': 'lni lni-shopping-basket',
            'groceries': 'lni lni-dinner',
            'dining': 'lni lni-dinner',
            'restaurant': 'lni lni-dinner',
            'travel': 'lni lni-car',
            'utilities': 'lni lni-files',
            'electricity': 'lni lni-bolt',
            'water': 'lni lni-drop',
            'gas': 'lni lni-bolt',
            'internet': 'lni lni-network',
            'phone': 'lni lni-phone',
            'rent': 'lni lni-home',
            'mortgage': 'lni lni-home',
            'insurance': 'lni lni-shield',
            'wages': 'lni lni-wallet',
            'other': 'lni lni-credit-cards',
            'uncategorized': 'lni lni-credit-cards'
        };
        
        // Try exact match first
        if (iconMap[categoryLower]) {
            return iconMap[categoryLower];
        }
        
        // Try partial match
        for (const [key, icon] of Object.entries(iconMap)) {
            if (categoryLower.includes(key) || key.includes(categoryLower)) {
                return icon;
            }
        }
        
        // Default icon
        return 'lni lni-credit-cards';
    }

    updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        if (!this.analyticsData || !this.analyticsData.recentTransactions || this.analyticsData.recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="lni lni-list"></i>
                    <h4>No transactions found</h4>
                    <p>No recent transactions available for the selected period</p>
                </div>
            `;
            return;
        }

        const { recentTransactions } = this.analyticsData;

        const transactionsHTML = recentTransactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${tx.name}</h4>
                    <p class="transaction-meta">
                        ${tx.category} • ${new Date(tx.date).toLocaleDateString()}
                        ${tx.bankName ? ` • ${tx.bankName}` : ''}
                    </p>
                </div>
                <div class="transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
                    ${tx.amount >= 0 ? '+' : ''}€${tx.amount.toFixed(2)}
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    bindEvents() {
        // Add any additional event listeners here
    }
}

// Global functions for HTML onclick handlers
function changeBankFilter() {
    const bankFilter = document.getElementById('bankFilter');
    if (bankFilter && window.analyticsManager) {
        const selectedBank = bankFilter.value;
        window.analyticsManager.currentBankFilter = selectedBank;
        
        if (selectedBank === 'all') {
            showNotification('Loading analytics for all connected banks...', 'info');
        } else {
            const selectedOption = bankFilter.options[bankFilter.selectedIndex];
            showNotification(`Loading analytics for ${selectedOption.text}...`, 'info');
        }
        
        window.analyticsManager.loadAnalytics();
    }
}

function changePeriodFilter() {
    const periodFilter = document.getElementById('periodFilter');
    if (periodFilter && window.analyticsManager) {
        window.analyticsManager.currentPeriod = periodFilter.value;
        window.analyticsManager.loadAnalytics();
    }
}

function refreshAnalytics() {
    if (window.analyticsManager) {
        window.analyticsManager.loadAnalytics();
        showNotification('Analytics refreshed!', 'success');
    }
}

// Initialize Analytics Manager when analytics section is shown
function initializeAnalytics() {
    console.log('🚀 initializeAnalytics called');
    console.log('🔍 AnalyticsManager class available:', typeof AnalyticsManager);
    console.log('🔍 window.analyticsManager exists:', !!window.analyticsManager);
    
    if (!window.analyticsManager) {
        console.log('📊 Initializing Analytics Manager...');
        try {
            window.analyticsManager = new AnalyticsManager();
            console.log('🔍 analyticsManager instance created:', window.analyticsManager);
            console.log('🔍 init method available:', typeof window.analyticsManager.init);
            window.analyticsManager.init();
        } catch (error) {
            console.error('❌ Error creating AnalyticsManager:', error);
        }
    } else {
        console.log('📊 Refreshing Analytics Manager...');
        // Force clear any cached data
        window.analyticsManager.analyticsData = null;
        window.analyticsManager.updateAnalyticsDisplay();
        window.analyticsManager.loadConnectedBanks();
        window.analyticsManager.loadAnalytics();
    }
}

// Initialize when DOM is loaded (fallback)
document.addEventListener('DOMContentLoaded', function() {
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection) {
        console.log('📊 Analytics section found, ready to initialize...');
    }
});
