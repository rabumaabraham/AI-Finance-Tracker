// Bank Manager - Professional Banking Integration
class BankManager {
    constructor() {
        this.connectedBanks = [];
        this.baseURL = (
            location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1'
        ) ? 'http://localhost:5000/api/bank' : 'https://finance-tracker-tlss.onrender.com/api/bank';
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
            const token = authService.getToken();
            if (!token) {
                console.log('⚠️ No auth token, skipping bank load');
                this.connectedBanks = [];
                this.updateBankList();
                this.updateBankCount();
                return;
            }

            console.log('🏦 Loading connected banks from database...');
            const response = await fetch(`${this.baseURL}/connected-banks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.connectedBanks = await response.json();
                console.log('🏦 Connected banks loaded from database:', this.connectedBanks);
            } else {
                console.error('❌ Error loading banks:', response.status);
                this.connectedBanks = [];
            }
            
            this.updateBankList();
            this.updateBankCount();
        } catch (error) {
            console.error('Error loading banks:', error);
            this.connectedBanks = [];
            this.updateBankList();
            this.updateBankCount();
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
            (window.__notify || showNotification)('Connecting to GoCardless...', 'info');

            // Check subscription limit before initiating connection
            try {
                const subBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                  ? 'http://localhost:5000/api/subscription'
                  : 'https://finance-tracker-tlss.onrender.com/api/subscription';
                const checkRes = await fetch(`${subBase}/can-connect`, {
                    headers: { 'Authorization': `Bearer ${authService.getToken()}` }
                });
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    if (!data.allowed) {
                        const limitText = data.limit === Infinity ? 'unlimited' : data.limit;
                        const message = `You’re on the ${data.plan === 'free' ? 'Free' : data.plan === 'pro_monthly' ? 'Unlimited Monthly' : 'Unlimited Yearly'} plan. It allows ${limitText} bank connection${limitText === 1 ? '' : 's'}. Upgrade to connect more banks.`;
                        (window.__notify || showNotification)(message, 'error');
                        return;
                    }
                }
            } catch (_) { /* ignore check failure */ }
            
            const response = await fetch(`${this.baseURL}/connect-bank`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Try to extract reason
                try {
                    const err = await response.json();
                    if (err && (err.error === 'LIMIT_REACHED' || err.message)) {
                        const limitText = err.limit === Infinity ? 'unlimited' : err.limit;
                        const planName = err.plan === 'free' ? 'Free' : err.plan === 'pro_monthly' ? 'Unlimited Monthly' : 'Unlimited Yearly';
                        const msg = err.error === 'LIMIT_REACHED'
                          ? `You’re on the ${planName} plan. It allows ${limitText} bank connection${limitText === 1 ? '' : 's'}. Upgrade to connect more banks.`
                          : (err.message || 'Failed to connect bank');
                        (window.__notify || showNotification)(msg, 'error');
                        return;
                    }
                } catch (_) {}
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

    async connectRealBank() {
        try {
            (window.__notify || showNotification)('Loading available banks...', 'info');

            // Check subscription limit before initiating connection
            try {
                const subBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                  ? 'http://localhost:5000/api/subscription'
                  : 'https://finance-tracker-tlss.onrender.com/api/subscription';
                const checkRes = await fetch(`${subBase}/can-connect`, {
                    headers: { 'Authorization': `Bearer ${authService.getToken()}` }
                });
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    if (!data.allowed) {
                        const limitText = data.limit === Infinity ? 'unlimited' : data.limit;
                        const message = `You're on the ${data.plan === 'free' ? 'Free' : data.plan === 'pro_monthly' ? 'Unlimited Monthly' : 'Unlimited Yearly'} plan. It allows ${limitText} bank connection${limitText === 1 ? '' : 's'}. Upgrade to connect more banks.`;
                        (window.__notify || showNotification)(message, 'error');
                        return;
                    }
                }
            } catch (_) { /* ignore check failure */ }
            
            const response = await fetch(`${this.baseURL}/connect-real-bank`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Try to extract reason
                try {
                    const err = await response.json();
                    if (err && (err.error === 'LIMIT_REACHED' || err.message)) {
                        const limitText = err.limit === Infinity ? 'unlimited' : err.limit;
                        const planName = err.plan === 'free' ? 'Free' : err.plan === 'pro_monthly' ? 'Unlimited Monthly' : 'Unlimited Yearly';
                        const msg = err.error === 'LIMIT_REACHED'
                          ? `You're on the ${planName} plan. It allows ${limitText} bank connection${limitText === 1 ? '' : 's'}. Upgrade to connect more banks.`
                          : (err.message || 'Failed to load banks');
                        (window.__notify || showNotification)(msg, 'error');
                        return;
                    }
                } catch (_) {}
                throw new Error('Failed to load banks');
            }

            const data = await response.json();
            
            // Show bank selection modal
            this.showBankSelectionModal(data.institutions);
            
        } catch (error) {
            console.error('Error loading banks:', error);
            showNotification('Failed to load banks. Please try again.', 'error');
        }
    }

    showBankSelectionModal(institutions) {
        // Create modal HTML
        const modalHtml = `
            <div id="bankSelectionModal" class="bank-selection-modal">
                <div class="modal-overlay" onclick="this.closest('.bank-selection-modal').remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Select Your Bank</h3>
                        <button class="modal-close" onclick="this.closest('.bank-selection-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="bank-search">
                            <input type="text" id="bankSearch" placeholder="Search for your bank..." class="bank-search-input">
                        </div>
                        <div class="banks-list" id="banksList">
                            ${institutions.map(bank => `
                                <div class="bank-item" data-bank-id="${bank.id}" data-bank-name="${bank.name}">
                                    <div class="bank-logo">
                                        ${bank.logo ? `<img src="${bank.logo}" alt="${bank.name}" onerror="this.style.display='none'">` : ''}
                                    </div>
                                    <div class="bank-info">
                                        <h4>${bank.name}</h4>
                                        ${bank.bic ? `<p class="bank-bic">${bank.bic}</p>` : ''}
                                        ${bank.countries ? `<p class="bank-countries">${bank.countries.join(', ')}</p>` : ''}
                                    </div>
                                    <button class="btn btn-primary btn-select-bank" onclick="window.bankManager.selectBank('${bank.id}', '${bank.name}')">
                                        Select
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add search functionality
        const searchInput = document.getElementById('bankSearch');
        const banksList = document.getElementById('banksList');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const bankItems = banksList.querySelectorAll('.bank-item');
            
            bankItems.forEach(item => {
                const bankName = item.dataset.bankName.toLowerCase();
                if (bankName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    async selectBank(institutionId, institutionName) {
        try {
            (window.__notify || showNotification)(`Connecting to ${institutionName}...`, 'info');

            // Remove modal
            const modal = document.getElementById('bankSelectionModal');
            if (modal) modal.remove();

            const response = await fetch(`${this.baseURL}/connect-selected-bank`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ institutionId })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to connect to selected bank');
            }

            const data = await response.json();
            
            // Store requisition ID for status checking
            localStorage.setItem('currentRequisitionId', data.requisitionId);
            
            // Redirect to GoCardless
            window.location.href = data.link;
            
        } catch (error) {
            console.error('Error connecting to selected bank:', error);
            showNotification('Failed to connect to selected bank. Please try again.', 'error');
        }
    }

    async fetchTransactions(requisitionId) {
        try {
            const token = authService.getToken();
            if (!token) {
                showNotification('Please log in to fetch transactions', 'error');
                return;
            }

            showNotification('Fetching transactions...', 'info');
            
            const response = await fetch(`${this.baseURL}/transactions/${requisitionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Transactions fetched successfully:', result);
                
                showNotification(`Successfully imported ${result.transactionCount || 0} transactions!`, 'success');
                
                // Refresh analytics if available
                if (window.analyticsManager) {
                    await window.analyticsManager.loadConnectedBanks();
                    await window.analyticsManager.loadAnalytics();
                }
                
                // Refresh budgets if available
                if (window.budgetManager) {
                    await window.budgetManager.refreshBudgets();
                }
                
            } else if (response.status === 429) {
                const errorData = await response.json();
                const hours = Math.ceil((errorData.retryAfter || 18293) / 3600);
                console.error('🚫 Rate limit exceeded:', errorData);
                showNotification(`Rate limit exceeded. Try again in ${hours} hours.`, 'error');
            } else {
                console.error('❌ Error fetching transactions:', response.status);
                showNotification('Failed to fetch transactions', 'error');
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
            const token = authService.getToken();
            if (!token) {
                showNotification('Authentication required', 'error');
                return;
            }

            console.log('🗑️ Removing bank account:', bankId);
            const response = await fetch(`${this.baseURL}/remove/${bankId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from local list and reload from database
                await this.loadConnectedBanks();
                
                // Immediately clear analytics display
                if (window.analyticsManager) {
                    window.analyticsManager.analyticsData = null;
                    window.analyticsManager.updateAnalyticsDisplay();
                    await window.analyticsManager.loadConnectedBanks();
                    await window.analyticsManager.loadAnalytics();
                }
                
                showNotification('Bank account removed successfully', 'success');
            } else {
                console.error('❌ Error removing bank:', response.status);
                showNotification('Failed to remove bank account', 'error');
            }
            
        } catch (error) {
            console.error('Error removing bank:', error);
            showNotification('Failed to remove bank account', 'error');
        }
    }

    // Demo bank function removed - real bank connections only



    // Check if user returned from GoCardless authentication
    async checkBankConnectionStatus() {
        const requisitionId = localStorage.getItem('currentRequisitionId');
        
        // Only process if we have a requisition ID AND URL parameters indicating a return from GoCardless
        if (requisitionId) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const status = urlParams.get('status');
                const ref = urlParams.get('ref');
                const code = urlParams.get('code');
                const requisition = urlParams.get('requisition');
                
                console.log('🔍 URL parameters:', { status, ref, code, requisition });
                console.log('🆔 Stored requisitionId:', requisitionId);
                
                // Only process if we have actual GoCardless return parameters
                // This prevents automatic connection on fresh login/signup
                if (!ref && !code && !requisition && status !== 'success' && status !== 'completed' && status !== 'error' && status !== 'failed') {
                    console.log('⚠️ No GoCardless return parameters found, skipping automatic connection');
                    return;
                }
                
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
            
            // Ensure we're on the banks section (should already be there from dashboard manager)
            console.log('🔄 Ensuring banks section is active...');
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
                
                // Reload banks from database instead of using localStorage
                await this.loadConnectedBanks();
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
            
                         // Reload banks from database instead of using localStorage
             await this.loadConnectedBanks();
            
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
            
            // Reload banks from database instead of using localStorage
            await this.loadConnectedBanks();
        }
    }
}

// Global functions for HTML onclick handlers
function connectBank() {
    if (window.bankManager) {
        window.bankManager.connectBank();
    }
}

function connectRealBank() {
    if (window.bankManager) {
        window.bankManager.connectRealBank();
    }
}

// Global function to switch to banks section (can be called from anywhere)
function switchToBanksSection() {
    console.log('🔄 Global function: Switching to Bank Accounts section...');
    
    // Method 1: Try showSection function
    if (typeof showSection === 'function') {
        console.log('✅ Using showSection function');
        showSection('banks');
        return true;
    }
    
    // Method 2: Direct DOM manipulation
    console.log('⚠️ showSection not available, using direct DOM manipulation');
    const banksSection = document.getElementById('banks');
    const overviewSection = document.getElementById('overview');
    
    if (banksSection && overviewSection) {
        // Hide overview
        overviewSection.style.display = 'none';
        overviewSection.classList.remove('active');
        
        // Show banks section
        banksSection.style.display = 'block';
        banksSection.classList.add('active');
        
        // Update menu
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        const banksLink = document.querySelector('[onclick="showSection(\'banks\')"]');
        if (banksLink) {
            banksLink.classList.add('active');
        }
        
        console.log('✅ Successfully switched to Bank Accounts section');
        return true;
    }
    
    console.log('❌ Failed to switch sections - elements not found');
    return false;
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
