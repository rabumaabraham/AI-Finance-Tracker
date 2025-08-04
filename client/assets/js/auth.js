// Authentication service for connecting frontend to backend
class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/auth';
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.errors?.[0]?.msg || 'Login failed');
            }

            // Store token
            this.setToken(data.token);
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
        window.location.href = 'login.html';
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Show loading state
    showLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        button.disabled = true;
        return originalText;
    }

    // Hide loading state
    hideLoading(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Create global instance
window.authService = new AuthService(); 