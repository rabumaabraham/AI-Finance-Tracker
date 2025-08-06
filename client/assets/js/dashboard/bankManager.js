// Bank Manager - Professional Banking Integration
class BankManager {
    constructor() {
        this.connectedBanks = [];
        this.baseURL = 'http://localhost:5000/api/bank';
        this.init();
    }

    init() {
        this.loadConnectedBanks();
        this.bindEvents();
    }

    // Static method for initialization (called by dashboard manager)
    static init() {
        if (!window.bankManager) {
            window.bankManager = new BankManager();
        }
        window.bankManager.loadConnectedBanks();
    }

    bindEvents() {
        // Auto-refresh bank list every 30 seconds
        setInterval(() => {
            this.loadConnectedBanks();
        }, 30000);
    }

    async loadConnectedBanks() {
        try {
            // In a real app, you'd fetch from your backend
            // For now, we'll use localStorage to simulate
            const savedBanks = localStorage.getItem('connectedBanks');
            this.connectedBanks = savedBanks ? JSON.parse(savedBanks) : [];
            this.updateBankList();
            this.updateBankCount();
        } catch (error) {
            console.error('Error loading banks:', error);
            showNotification('Failed to load bank accounts', 'error');
        }
    }

    updateBankList() {
        const banksList = document.getElementById('connected-banks-list');
        if (!banksList) return;

        if (this.connectedBanks.length === 0) {
            banksList.innerHTML = `
                <div class="empty-state">
                    <i class="lni lni-credit-cards"></i>
                    <h4>No banks connected</h4>
                    <p>Connect your first bank account to get started</p>
                </div>
            `;
        } else {
            banksList.innerHTML = this.connectedBanks.map(bank => `
                <div class="bank-item" data-bank-id="${bank.id}">
                    <div class="bank-icon">
                        <i class="lni lni-credit-cards"></i>
                    </div>
                    <div class="bank-info">
                        <h4 class="bank-name">${bank.name}</h4>
                        <div class="bank-status">
                            <i class="lni lni-checkmark-circle"></i>
                            Connected • Last sync: ${bank.lastSync}
                        </div>
                    </div>
                    <div class="bank-actions">
                        <button class="btn-remove-bank" onclick="bankManager.removeBank('${bank.id}')">
                            <i class="lni lni-trash-can"></i>
                            Remove
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    updateBankCount() {
        const bankCount = document.querySelector('.bank-count');
        if (bankCount) {
            bankCount.textContent = `${this.connectedBanks.length} account${this.connectedBanks.length !== 1 ? 's' : ''}`;
        }
    }

    async connectBank() {
        try {
            showNotification('Connecting to bank...', 'info');
            
            // Call Nordigen API to get connection link
            const response = await fetch(`${this.baseURL}/connect-bank`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to connect bank');
            }

            const data = await response.json();
            
            // Store requisition ID for later use
            localStorage.setItem('currentRequisitionId', data.requisitionId);
            
            // Redirect to Nordigen for bank authentication
            window.open(data.link, '_blank');
            
            showNotification('Bank connection initiated. Please complete authentication in the new window.', 'success');
            
        } catch (error) {
            console.error('Error connecting bank:', error);
            showNotification('Failed to connect bank. Please try again.', 'error');
        }
    }

    async fetchTransactions(requisitionId) {
        try {
            const response = await fetch(`${this.baseURL}/transactions/${requisitionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const transactions = await response.json();
            showNotification(`Successfully fetched ${transactions.length} transactions`, 'success');
            
            // Update overview with new data
            if (window.dashboardManager) {
                window.dashboardManager.updateOverviewData();
            }
            
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showNotification('Failed to fetch transactions', 'error');
        }
    }

    async removeBank(bankId) {
        if (!confirm('Are you sure you want to remove this bank account? This will stop syncing transactions.')) {
            return;
        }

        try {
            // Remove from local storage (in real app, call backend API)
            this.connectedBanks = this.connectedBanks.filter(bank => bank.id !== bankId);
            localStorage.setItem('connectedBanks', JSON.stringify(this.connectedBanks));
            
            this.updateBankList();
            this.updateBankCount();
            
            showNotification('Bank account removed successfully', 'success');
            
        } catch (error) {
            console.error('Error removing bank:', error);
            showNotification('Failed to remove bank account', 'error');
        }
    }

    // Simulate adding a bank (for demo purposes)
    addDemoBank() {
        const demoBank = {
            id: Date.now().toString(),
            name: 'Demo Bank',
            lastSync: new Date().toLocaleDateString(),
            status: 'connected'
        };
        
        this.connectedBanks.push(demoBank);
        localStorage.setItem('connectedBanks', JSON.stringify(this.connectedBanks));
        
        this.updateBankList();
        this.updateBankCount();
        
        showNotification('Demo bank added successfully', 'success');
    }

    // Check if user returned from Nordigen authentication
    checkBankConnectionStatus() {
        const requisitionId = localStorage.getItem('currentRequisitionId');
        if (requisitionId) {
            // In a real app, you'd check the requisition status with Nordigen
            // For demo purposes, we'll simulate a successful connection
            setTimeout(() => {
                this.addDemoBank();
                localStorage.removeItem('currentRequisitionId');
            }, 2000);
        }
    }
}

// Global functions for HTML onclick handlers
function connectBank() {
    if (window.bankManager) {
        window.bankManager.connectBank();
    }
}

// Initialize Bank Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('banks')) {
        // Only create instance if it doesn't exist
        if (!window.bankManager) {
            window.bankManager = new BankManager();
        }
        // Check for pending bank connections
        window.bankManager.checkBankConnectionStatus();
    }
});
