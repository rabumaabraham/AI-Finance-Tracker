/**
 * Overview Manager - Handles the visual step-by-step onboarding overview
 */
class OverviewManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.stepStatuses = {
            1: 'completed', // Choose Plan - always available
            2: 'available', // Connect Bank - available for free accounts
            3: 'available', // Analytics - available for free accounts
            4: 'available', // Budget - available for free accounts
            5: 'available'  // AI Chat - available for free accounts
        };
        
        this.init();
    }

    init() {
        this.updateProgress();
        this.checkStepStatuses();
        this.bindEvents();
    }

    /**
     * Check and update step statuses based on user progress
     */
    checkStepStatuses() {
        // Check if user has connected banks
        const connectedBanks = this.getConnectedBanks();
        if (connectedBanks.length > 0) {
            this.updateStepStatus(2, 'completed');
        }

        // Check if user has set budget limits
        const budgetLimits = this.getBudgetLimits();
        if (budgetLimits.length > 0) {
            this.updateStepStatus(4, 'completed');
        }

        // Check if user has used AI chat
        const chatHistory = this.getChatHistory();
        if (chatHistory.length > 0) {
            this.updateStepStatus(5, 'completed');
        }
    }

    /**
     * Update the status of a specific step
     */
    updateStepStatus(stepNumber, status) {
        this.stepStatuses[stepNumber] = status;
        this.updateStepUI(stepNumber, status);
        this.updateProgress();
    }

    /**
     * Update the UI for a specific step
     */
    updateStepUI(stepNumber, status) {
        const stepCard = document.querySelector(`[data-step="${stepNumber}"]`);
        if (!stepCard) return;

        const statusIcon = stepCard.querySelector('.status-icon');
        const statusText = stepCard.querySelector('.status-text');

        if (!statusIcon || !statusText) return;

        // Remove existing status classes
        statusIcon.classList.remove('pending', 'locked');
        statusText.classList.remove('pending', 'locked');

        // Update icon and text based on status
        switch (status) {
            case 'completed':
                statusIcon.className = 'lni lni-checkmark-circle status-icon';
                statusText.textContent = 'Completed';
                statusText.style.color = '';
                break;
            case 'available':
                statusIcon.className = 'lni lni-arrow-right-circle status-icon';
                statusText.textContent = 'Available';
                statusText.style.color = '';
                break;
            case 'pending':
                statusIcon.className = 'lni lni-plus-circle status-icon pending';
                statusText.textContent = 'Pending';
                statusText.classList.add('pending');
                break;
            case 'locked':
                statusIcon.className = 'lni lni-lock status-icon locked';
                statusText.textContent = 'Locked';
                statusText.classList.add('locked');
                break;
        }
    }

    /**
     * Update the overall progress
     */
    updateProgress() {
        const completedSteps = Object.values(this.stepStatuses).filter(status => status === 'completed').length;
        const progressPercentage = Math.round((completedSteps / this.totalSteps) * 100);
        
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentageEl = document.querySelector('.progress-percentage');
        const progressText = document.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        if (progressPercentageEl) {
            progressPercentageEl.textContent = `${progressPercentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${completedSteps} of ${this.totalSteps} steps completed`;
        }
    }

    /**
     * Get connected banks from localStorage
     */
    getConnectedBanks() {
        try {
            const banks = localStorage.getItem('connectedBanks');
            return banks ? JSON.parse(banks) : [];
        } catch (error) {
            console.error('Error reading connected banks:', error);
            return [];
        }
    }

    /**
     * Get budget limits from localStorage
     */
    getBudgetLimits() {
        try {
            const limits = localStorage.getItem('budgetLimits');
            return limits ? JSON.parse(limits) : [];
        } catch (error) {
            console.error('Error reading budget limits:', error);
            return [];
        }
    }

    /**
     * Get chat history from localStorage
     */
    getChatHistory() {
        try {
            const history = localStorage.getItem('chatHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error reading chat history:', error);
            return [];
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for changes in connected banks
        window.addEventListener('storage', (e) => {
            if (e.key === 'connectedBanks') {
                this.checkStepStatuses();
            }
        });

        // Listen for changes in budget limits
        window.addEventListener('storage', (e) => {
            if (e.key === 'budgetLimits') {
                this.checkStepStatuses();
            }
        });

        // Listen for changes in chat history
        window.addEventListener('storage', (e) => {
            if (e.key === 'chatHistory') {
                this.checkStepStatuses();
            }
        });
    }

    /**
     * Refresh the overview data
     */
    refreshData() {
        this.checkStepStatuses();
    }

    /**
     * Update the overview display
     */
    updateOverview() {
        this.checkStepStatuses();
    }

    /**
     * Mark a step as completed
     */
    markStepCompleted(stepNumber) {
        this.updateStepStatus(stepNumber, 'completed');
    }

    /**
     * Mark a step as available
     */
    markStepAvailable(stepNumber) {
        this.updateStepStatus(stepNumber, 'available');
    }

    /**
     * Mark a step as pending
     */
    markStepPending(stepNumber) {
        this.updateStepStatus(stepNumber, 'pending');
    }

    /**
     * Mark a step as locked
     */
    markStepLocked(stepNumber) {
        this.updateStepStatus(stepNumber, 'locked');
    }
}

// Initialize OverviewManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.overviewManager = new OverviewManager();
});


