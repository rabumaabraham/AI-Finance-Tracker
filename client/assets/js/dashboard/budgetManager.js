class BudgetManager {
    constructor() {
        // this.baseURL = 'http://localhost:5000/api/budget';

        this.baseURL = 'https://https://finance-tracker-tlss.onrender.com/api/budget';
        this.budgets = [];
        this.isInitialized = false;
        console.log('BudgetManager constructor called');
    }

    async init() {
        console.log('BudgetManager init called');
        if (this.isInitialized) {
            console.log('BudgetManager already initialized');
            return;
        }
        
        try {
            await this.loadBudgets();
            this.bindEvents();
            this.isInitialized = true;
            console.log('BudgetManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BudgetManager:', error);
        }
    }

    bindEvents() {
        console.log('Binding budget events');
        const form = document.getElementById('addBudgetForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBudget();
            });
            console.log('Budget form event bound');
        } else {
            console.error('Budget form not found');
        }
    }

    async loadBudgets() {
        try {
            const token = authService.getToken();
            if (!token) {
                console.log('No auth token found');
                return;
            }

            console.log('Loading budgets...');
            const response = await fetch(`${this.baseURL}?period=month`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Budget response status:', response.status);
            console.log('Budget response ok:', response.ok);

            if (response.ok) {
                this.budgets = await response.json();
                console.log('Budgets loaded:', this.budgets);
                console.log('Number of budgets:', this.budgets.length);
                
                this.renderBudgets();
                this.updateSummary();
                this.loadAlerts();
            } else {
                const errorText = await response.text();
                console.error('Failed to load budgets:', response.status, response.statusText, errorText);
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
        }
    }

    updateSummary() {
        const totalBudget = this.budgets.reduce((sum, budget) => sum + budget.limit, 0);
        const totalSpent = this.budgets.reduce((sum, budget) => sum + budget.spent, 0);
        const totalRemaining = totalBudget - totalSpent;

        const totalBudgetEl = document.getElementById('totalBudget');
        const totalSpentEl = document.getElementById('totalSpent');
        const totalRemainingEl = document.getElementById('totalRemaining');

        if (totalBudgetEl) totalBudgetEl.textContent = `€${totalBudget.toFixed(2)}`;
        if (totalSpentEl) totalSpentEl.textContent = `€${totalSpent.toFixed(2)}`;
        if (totalRemainingEl) totalRemainingEl.textContent = `€${totalRemaining.toFixed(2)}`;
        
        // Update budget count
        const budgetCount = document.querySelector('.budget-count');
        if (budgetCount) {
            budgetCount.textContent = `${this.budgets.length} limit${this.budgets.length !== 1 ? 's' : ''} set`;
        }
        
        console.log('Summary updated:', { totalBudget, totalSpent, totalRemaining });
    }

    renderBudgets() {
        console.log('renderBudgets called');
        const container = document.getElementById('budgetGrid');
        console.log('Budget grid container:', container);
        
        if (!container) {
            console.error('Budget grid container not found');
            return;
        }

        console.log('Rendering budgets:', this.budgets.length);

        // Update budget count
        const budgetCount = document.querySelector('.budget-count');
        if (budgetCount) {
            budgetCount.textContent = `${this.budgets.length} limit${this.budgets.length !== 1 ? 's' : ''} set`;
        }

        if (this.budgets.length === 0) {
            console.log('No budgets to render, showing empty state');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="lni lni-wallet"></i>
                    <h4>No spending limits set</h4>
                    <p>Set your first spending limit to start tracking</p>
                </div>
            `;
            console.log('Empty state rendered');
            return;
        }

        console.log('Creating budget cards for:', this.budgets);
        const budgetsHTML = this.budgets.map(budget => this.createBudgetCard(budget)).join('');
        console.log('Generated HTML:', budgetsHTML);
        container.innerHTML = budgetsHTML;
        console.log('Budget cards rendered successfully');
    }

    createBudgetCard(budget) {
        const percentage = Math.min(budget.percentage, 100);
        const isOverBudget = budget.percentage > 100;
        const isWarning = budget.percentage > 80;
        
        const statusClass = isOverBudget ? 'over-limit' : isWarning ? 'warning' : 'normal';

        return `
            <div class="limit-card ${statusClass}">
                <div class="limit-header">
                    <div class="limit-icon">
                        <i class="${this.getCategoryIcon(budget.category)}"></i>
                    </div>
                    <div class="limit-info">
                        <h4>${budget.category}</h4>
                        <p>€${budget.spent.toFixed(2)} of €${budget.limit.toFixed(2)}</p>
                    </div>
                    <button class="btn-remove" onclick="window.budgetManager.deleteBudget('${budget.id}')">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
                
                <div class="limit-progress">
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${budget.percentage.toFixed(0)}%</span>
                </div>
                
                <div class="limit-status">
                    <span class="status-text">
                        ${isOverBudget ? 'Over limit' : budget.remaining > 0 ? `€${budget.remaining.toFixed(2)} left` : 'At limit'}
                    </span>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const iconMap = {
            'Food': 'lni lni-dinner',
            'Transport': 'lni lni-car',
            'Entertainment': 'lni lni-game',
            'Bills': 'lni lni-files',
            'Shopping': 'lni lni-shopping-basket',
            'Health': 'lni lni-heart',
            'Other': 'lni lni-credit-cards',
            'Transportation': 'lni lni-car',
            'Dining': 'lni lni-dinner',
            'Utilities': 'lni lni-files',
            'Medical': 'lni lni-heart',
            'Groceries': 'lni lni-dinner',
            'Restaurant': 'lni lni-dinner',
            'Travel': 'lni lni-car',
            'Insurance': 'lni lni-shield',
            'Education': 'lni lni-graduation',
            'Housing': 'lni lni-home',
            'Personal Care': 'lni lni-heart',
            'Gifts': 'lni lni-gift',
            'Investments': 'lni lni-stats-up',
            'Salary': 'lni lni-wallet',
            'Income': 'lni lni-wallet'
        };
        return iconMap[category] || 'lni lni-credit-cards';
    }

    async loadAlerts() {
        try {
            const token = authService.getToken();
            if (!token) return;

            const response = await fetch(`${this.baseURL}/alerts?period=month`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const { alerts } = await response.json();
                this.renderAlerts(alerts);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    renderAlerts(alerts) {
        const container = document.getElementById('budgetAlerts');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = '';
            return;
        }

        const alertsHTML = alerts.map(alert => `
            <div class="limit-alert ${alert.percentage >= 100 ? 'critical' : 'warning'}">
                <i class="lni lni-warning"></i>
                <span>${alert.budget.category} limit reached (${alert.percentage.toFixed(0)}%)</span>
            </div>
        `).join('');

        container.innerHTML = alertsHTML;

        // Show notifications for critical alerts (over 100%)
        alerts.forEach(alert => {
            if (alert.percentage >= 100) {
                showNotification(
                    `${alert.budget.category} spending limit exceeded! You've spent ${alert.percentage.toFixed(0)}% of your limit.`,
                    'error'
                );
            } else if (alert.percentage >= 90) {
                showNotification(
                    `${alert.budget.category} spending limit warning! You've used ${alert.percentage.toFixed(0)}% of your limit.`,
                    'warning'
                );
            }
        });
    }

    showAddModal() {
        console.log('Showing add modal');
        const modal = document.getElementById('addBudgetModal');
        console.log('Modal element:', modal);
        if (modal) {
            modal.style.display = 'block';
            console.log('Modal displayed with style:', modal.style.display);
            // Also add a class to ensure visibility
            modal.classList.add('show');
        } else {
            console.error('Add budget modal not found');
            showNotification('Modal not found. Please refresh the page.', 'error');
        }
    }

    closeModal() {
        console.log('Closing modal');
        const modal = document.getElementById('addBudgetModal');
        const form = document.getElementById('addBudgetForm');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        if (form) {
            form.reset();
        }
        console.log('Modal closed');
    }

    async addBudget() {
        const category = document.getElementById('budgetCategory').value;
        const limit = parseFloat(document.getElementById('budgetLimit').value);

        console.log('Adding budget with:', { category, limit });

        if (!category || !limit) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const token = authService.getToken();
            if (!token) {
                showNotification('Please log in to set limits', 'error');
                return;
            }

            console.log('Adding budget:', { category, limit });
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category, limit, period: 'month' })
            });

            console.log('Add budget response status:', response.status);
            console.log('Add budget response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('Budget added successfully:', result);
                
                this.closeModal();
                console.log('Modal closed, reloading budgets...');
                await this.loadBudgets(); // Reload budgets to show the new one
                showNotification('Spending limit set successfully!', 'success');
            } else {
                const error = await response.json();
                console.error('Failed to add budget:', error);
                showNotification(error.error || 'Failed to set limit', 'error');
            }
        } catch (error) {
            console.error('Error adding budget:', error);
            showNotification('Failed to set limit', 'error');
        }
    }

    async deleteBudget(id) {
        if (!confirm('Remove this spending limit?')) return;

        try {
            const token = authService.getToken();
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await this.loadBudgets(); // Reload budgets after deletion
                showNotification('Limit removed successfully!', 'success');
            } else {
                showNotification('Failed to remove limit', 'error');
            }
        } catch (error) {
            console.error('Error deleting budget:', error);
            showNotification('Failed to remove limit', 'error');
        }
    }

    // Method to refresh budgets (can be called from other parts of the app)
    async refreshBudgets() {
        console.log('Refreshing budgets...');
        await this.loadBudgets();
    }
}

// Initialize budget manager
let budgetManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating BudgetManager');
    budgetManager = new BudgetManager();
    window.budgetManager = budgetManager; // Make it globally accessible
    console.log('BudgetManager created and assigned to window:', budgetManager);
    
    // Auto-initialize if we're on the budget section
    if (window.location.hash === '#budget' || document.getElementById('budget').classList.contains('active')) {
        console.log('Budget section is active, initializing...');
        setTimeout(() => budgetManager.init(), 100);
    }
});

// Also initialize when the budget section is shown
window.initializeBudgetManager = () => {
    console.log('initializeBudgetManager called');
    if (window.budgetManager && !window.budgetManager.isInitialized) {
        console.log('Initializing budget manager from global function');
        window.budgetManager.init();
    } else if (window.budgetManager && window.budgetManager.isInitialized) {
        console.log('Budget manager already initialized, skipping...');
    } else {
        console.log('Budget manager not available yet');
    }
};

// Global function to show add modal with safety check
window.showBudgetModal = () => {
    console.log('showBudgetModal called');
    if (window.budgetManager) {
        console.log('Budget manager available, showing modal');
        window.budgetManager.showAddModal();
    } else {
        console.error('Budget manager not available');
        showNotification('Budget system not ready. Please refresh the page.', 'error');
    }
};
