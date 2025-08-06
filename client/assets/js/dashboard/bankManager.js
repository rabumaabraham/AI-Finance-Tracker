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
    static async init() {
        if (!window.bankManager) {
            window.bankManager = new BankManager();
        }
        await window.bankManager.loadConnectedBanks();
        await window.bankManager.checkBankConnectionStatus();
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
            showNotification('Connecting to GoCardless...', 'info');
            
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
            
            // Store requisition ID for status checking
            localStorage.setItem('currentRequisitionId', data.requisitionId);
            
            // Redirect to GoCardless sandbox
            window.location.href = data.link;
            
        } catch (error) {
            console.error('Error connecting bank:', error);
            showNotification('Failed to connect bank. Please try again.', 'error');
        }
    }

    async fetchTransactions(requisitionId) {
        try {
            const token = authService.getToken();
            console.log('🔑 Fetching transactions with token:', token ? 'Present' : 'Missing');
            
            if (!token) {
                console.log('⚠️ No auth token, skipping transaction fetch');
                return;
            }

            const response = await fetch(`${this.baseURL}/transactions/${requisitionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('💳 Transaction fetch response status:', response.status);

            if (!response.ok) {
                console.log('⚠️ Transaction fetch failed, but continuing...');
                return;
            }

            const transactions = await response.json();
            console.log('💳 Successfully fetched transactions:', transactions.length);
            showNotification(`Successfully fetched ${transactions.length} transactions`, 'success');
            
            if (window.dashboardManager && window.dashboardManager.updateOverviewData) {
                window.dashboardManager.updateOverviewData();
            }
            
        } catch (error) {
            console.error('❌ Error fetching transactions:', error);
            console.log('⚠️ Transaction fetch failed, but continuing...');
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



    // Check if user returned from GoCardless authentication
    async checkBankConnectionStatus() {
        const requisitionId = localStorage.getItem('currentRequisitionId');
        
        if (requisitionId) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const status = urlParams.get('status');
                const ref = urlParams.get('ref');
                const code = urlParams.get('code');
                const requisition = urlParams.get('requisition');
                
                console.log('🔍 URL parameters:', { status, ref, code, requisition });
                console.log('🆔 Stored requisitionId:', requisitionId);
                
                // Check if we've already processed this connection
                const processedKey = `processed_${requisitionId}`;
                if (sessionStorage.getItem(processedKey)) {
                    console.log('⚠️ Connection already processed, skipping:', requisitionId);
                    return;
                }
                
                // Handle GoCardless redirect parameters
                if (ref || code || requisition || status === 'success' || status === 'completed') {
                    // Mark as processed to prevent duplicates
                    sessionStorage.setItem(processedKey, 'true');
                    // Use the stored requisitionId, not the URL parameters
                    await this.handleSuccessfulConnection(requisitionId);
                    return;
                } else if (status === 'error' || status === 'failed') {
                    this.handleFailedConnection();
                } else {
                    await this.checkRequisitionStatus(requisitionId);
                }
                
            } catch (error) {
                console.error('Error checking connection status:', error);
                showNotification('Error checking connection status', 'error');
            }
        }
    }

    async handleSuccessfulConnection(requisitionId) {
        console.log('🎉 Processing successful bank connection:', requisitionId);
        showNotification('Bank connection successful!', 'success');
        
        try {
            console.log('📝 Adding bank to connected list...');
            await this.addConnectedBank(requisitionId);
            
            console.log('💳 Fetching transactions...');
            await this.fetchTransactions(requisitionId);
            
            localStorage.removeItem('currentRequisitionId');
            
            // Clean URL
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Switch to Bank Accounts section
            if (typeof showSection === 'function') {
                showSection('banks');
            }
            
            console.log('✅ Bank connection process completed');
            showNotification('Bank account connected successfully!', 'success');
        } catch (error) {
            console.error('❌ Error in handleSuccessfulConnection:', error);
            showNotification('Error processing bank connection', 'error');
        }
    }

    handleFailedConnection() {
        showNotification('Bank connection failed. Please try again.', 'error');
        localStorage.removeItem('currentRequisitionId');
    }

    // Check requisition status with backend
    async checkRequisitionStatus(requisitionId) {
        try {
            const token = authService.getToken();
            if (!token) {
                console.log('No auth token, skipping status check');
                return;
            }

            const response = await fetch(`${this.baseURL}/status/${requisitionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Status check response:', data);
                
                if (data.status === 'SUCCEEDED') {
                    await this.handleSuccessfulConnection(requisitionId);
                } else if (data.status === 'FAILED') {
                    this.handleFailedConnection();
                } else {
                    console.log('Status still pending, checking again in 2 seconds...');
                    setTimeout(() => this.checkRequisitionStatus(requisitionId), 2000);
                }
            } else {
                console.log('Status check failed:', response.status);
            }
        } catch (error) {
            console.error('Error checking requisition status:', error);
        }
    }

    // Add connected bank to the list
    async addConnectedBank(requisitionId) {
        try {
            // Check if bank already exists to prevent duplicates
            const existingBank = this.connectedBanks.find(bank => bank.id === requisitionId);
            if (existingBank) {
                console.log('⚠️ Bank already exists, skipping duplicate:', requisitionId);
                return;
            }

            const token = authService.getToken();
            console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
            
            if (!token) {
                console.log('⚠️ No auth token, using fallback bank data');
                const bank = {
                    id: requisitionId,
                    name: 'Connected Bank',
                    lastSync: new Date().toLocaleDateString(),
                    status: 'connected',
                    requisitionId: requisitionId
                };
                
                this.connectedBanks.push(bank);
                localStorage.setItem('connectedBanks', JSON.stringify(this.connectedBanks));
                this.updateBankList();
                this.updateBankCount();
                return;
            }

            const response = await fetch(`${this.baseURL}/details/${requisitionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Bank details response status:', response.status);

            let bankData;
            if (response.ok) {
                bankData = await response.json();
                console.log('📊 Bank details received:', bankData);
            } else {
                console.log('⚠️ Bank details failed, using fallback');
                bankData = {
                    name: 'Connected Bank',
                    lastSync: new Date().toLocaleDateString()
                };
            }

            const bank = {
                id: requisitionId,
                name: bankData.name || 'Connected Bank',
                lastSync: bankData.lastSync || new Date().toLocaleDateString(),
                status: 'connected',
                requisitionId: requisitionId
            };
            
            this.connectedBanks.push(bank);
            localStorage.setItem('connectedBanks', JSON.stringify(this.connectedBanks));
            
            this.updateBankList();
            this.updateBankCount();
            
        } catch (error) {
            console.error('❌ Error adding connected bank:', error);
            // Use fallback even if there's an error
            const bank = {
                id: requisitionId,
                name: 'Connected Bank',
                lastSync: new Date().toLocaleDateString(),
                status: 'connected',
                requisitionId: requisitionId
            };
            
            this.connectedBanks.push(bank);
            localStorage.setItem('connectedBanks', JSON.stringify(this.connectedBanks));
            this.updateBankList();
            this.updateBankCount();
        }
    }
}

// Global functions for HTML onclick handlers
function connectBank() {
    if (window.bankManager) {
        window.bankManager.connectBank();
    }
}

function checkConnectionStatus() {
    if (window.bankManager) {
        const requisitionId = localStorage.getItem('currentRequisitionId');
        if (requisitionId) {
            window.bankManager.checkRequisitionStatus(requisitionId);
        } else {
            showNotification('No pending bank connection found', 'info');
        }
    }
}

// Initialize Bank Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('banks')) {
        if (!window.bankManager) {
            window.bankManager = new BankManager();
        }
        
        await window.bankManager.checkBankConnectionStatus();
    }
});
