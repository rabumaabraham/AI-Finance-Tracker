// Authentication service for connecting frontend to backend
class AuthService {
    constructor() {
        this.baseURL = (
            location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1'
        ) ? 'http://localhost:5000/api/auth' : 'https://finance-tracker-tlss.onrender.com/api/auth';
        this.token = localStorage.getItem('token');
    }

    // Set token in localStorage and update instance
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Remove token from localStorage
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Clear stale bank connection data
    clearStaleBankData() {
        // Clear any pending bank connection requisition IDs
        localStorage.removeItem('currentRequisitionId');
        
        // Clear any processed connection flags
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('processed_')) {
                sessionStorage.removeItem(key);
            }
        });
        
        console.log('🧹 Cleared stale bank connection data');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Signup user
    async signup(userData) {
        try {
            const response = await fetch(`${this.baseURL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.errors?.[0]?.msg || 'Signup failed');
            }

            // Don't store token after signup - user must login manually
            // this.setToken(data.token); // Removed this line
            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check if the backend is running.');
            }
            throw error;
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.errors?.[0]?.msg || 'Login failed');
            }

            // Store token
            this.setToken(data.token);
            
            // Clear any stale bank connection data on fresh login
            this.clearStaleBankData();
            
            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check if the backend is running.');
            }
            throw error;
        }
    }

    // Logout user
    logout() {
        this.removeToken();
        this.clearStaleBankData();
        window.location.href = 'login.html';
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `bank-notification bank-notification-${type === 'error' ? 'error' : 'success'}`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 350px; padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); transform: translateX(100%); transition: all 0.3s ease; font-family: "Inter", sans-serif;';
        
        // Set background and text colors based on type
        if (type === 'error') {
            notification.style.background = '#ffffff';
            notification.style.border = '1px solid #ef4444';
            notification.style.color = '#374151';
        } else {
            notification.style.background = '#ffffff';
            notification.style.border = '1px solid #10b981';
            notification.style.color = '#374151';
        }
        
        // Simple message without icons or titles
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 14px; font-weight: 500; color: #374151;">${message}</div>
                <button type="button" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af; padding: 0; margin-left: 12px;">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    // Show loading state
    showLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>Processing...</div>';
        button.disabled = true;
        button.style.opacity = '0.8';
        
        // Add CSS animation if not already present
        if (!document.getElementById('loading-animation')) {
            const style = document.createElement('style');
            style.id = 'loading-animation';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        return originalText;
    }

    // Hide loading state
    hideLoading(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// Create global instance
window.authService = new AuthService(); 