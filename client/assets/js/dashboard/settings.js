// Settings Manager
class SettingsManager {
  static async init() {
    this.cacheElements();
    await this.loadProfile();
    this.bindEvents();
  }

  static cacheElements() {
    this.nameInput = document.getElementById('settingsName');
    this.emailInput = document.getElementById('settingsEmail');
    this.saveBtn = document.getElementById('btnSaveProfile');
    this.requestResetBtn = document.getElementById('btnRequestReset');
    this.requestDeleteBtn = document.getElementById('btnRequestDelete');
    // Dynamic code inputs
    this.resetCodeInput = document.getElementById('settingsResetCode');
    this.newPasswordInput = document.getElementById('settingsNewPassword');
    this.confirmPasswordInput = document.getElementById('settingsConfirmPassword');
    this.btnConfirmReset = document.getElementById('btnConfirmReset');
    this.deleteCodeInput = document.getElementById('settingsDeleteCode');
    this.btnConfirmDelete = document.getElementById('btnConfirmDelete');
    // Inline status + error elements
    this.resetStatusEl = document.getElementById('resetStatus');
    this.deleteStatusEl = document.getElementById('deleteStatus');
    this.resetCodeError = document.getElementById('resetCodeError');
    this.newPasswordError = document.getElementById('newPasswordError');
    this.confirmPasswordError = document.getElementById('confirmPasswordError');
    this.deleteCodeError = document.getElementById('deleteCodeError');
  }

  static bindEvents() {
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveProfile());
    }
    if (this.requestResetBtn) {
      this.requestResetBtn.addEventListener('click', () => this.requestPasswordReset());
    }
    if (this.btnConfirmReset) {
      this.btnConfirmReset.addEventListener('click', () => this.confirmPasswordReset());
    }
    if (this.requestDeleteBtn) {
      this.requestDeleteBtn.addEventListener('click', () => this.requestAccountDeletion());
    }
    if (this.btnConfirmDelete) {
      this.btnConfirmDelete.addEventListener('click', () => this.confirmAccountDeletion());
    }
  }

  static async loadProfile() {
    try {
      const token = authService.getToken();
      if (!token) return;
      const response = await fetch(`${authService.baseURL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const user = await response.json();
      if (this.nameInput) this.nameInput.value = user.name || '';
      if (this.emailInput) this.emailInput.value = user.email || '';
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  }

  static async saveProfile() {
    try {
      const name = (this.nameInput?.value || '').trim();
      if (name.length < 2) return showNotification('Name must be at least 2 characters', 'error');
      const token = authService.getToken();
      const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://finance-tracker-tlss.onrender.com';
      const res = await fetch(`${base}/api/user/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        showNotification('Profile updated', 'success');
        await this.loadProfile();
      } else {
        showNotification('Failed to update profile', 'error');
      }
    } catch (e) {
      showNotification('Failed to update profile', 'error');
    }
  }

  static async requestPasswordReset() {
    try {
      const email = (this.emailInput?.value || '').trim();
      if (!email) { if (this.resetStatusEl) this.resetStatusEl.textContent = 'Email not available'; return; }
      const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://finance-tracker-tlss.onrender.com';
      const res = await fetch(`${base}/api/user/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        if (this.resetStatusEl) {
          this.resetStatusEl.textContent = data.message;
          this.resetStatusEl.style.color = '#166534'; // Always green
        }
      } else {
        const data = await res.json();
        if (this.resetStatusEl) {
          this.resetStatusEl.textContent = data.message || 'Failed to send reset code.';
          this.resetStatusEl.style.color = '#dc3545';
        }
      }
    } catch (e) {
      if (this.resetStatusEl) this.resetStatusEl.textContent = 'Failed to send reset code.';
    }
  }

  static async confirmPasswordReset() {
    try {
      const code = (this.resetCodeInput?.value || '').trim();
      const newPassword = (this.newPasswordInput?.value || '').trim();
      const confirm = (this.confirmPasswordInput?.value || '').trim();
      this.clearFieldErrors();
      let hasError = false;
      if (!code) { this.showFieldError(this.resetCodeInput, this.resetCodeError, 'Enter the 6-digit code.'); hasError = true; }
      if (newPassword.length < 6) { this.showFieldError(this.newPasswordInput, this.newPasswordError, 'Password must be at least 6 characters.'); hasError = true; }
      if (newPassword !== confirm) { this.showFieldError(this.confirmPasswordInput, this.confirmPasswordError, 'Passwords do not match.'); hasError = true; }
      if (hasError) return;
      const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://finance-tracker-tlss.onrender.com';
      const res = await fetch(`${base}/api/user/password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password: newPassword })
      });
      if (!res.ok) { this.showFieldError(this.resetCodeInput, this.resetCodeError, 'Code is incorrect or expired.'); return; }
      if (res.ok) authService.logout();
    } catch (e) {
      this.showFieldError(this.resetCodeInput, this.resetCodeError, 'Failed to reset password.');
    }
  }

  static async requestAccountDeletion() {
    try {
      if (!confirm('Send deletion code to your email?')) return;
      const token = authService.getToken();
      const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://finance-tracker-tlss.onrender.com';
      const res = await fetch(`${base}/api/user/account/delete/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (this.deleteStatusEl) this.deleteStatusEl.textContent = res.ok ? 'Deletion code sent to your email.' : 'Failed to send deletion code.';
    } catch (e) {
      if (this.deleteStatusEl) this.deleteStatusEl.textContent = 'Failed to send deletion code.';
    }
  }

  static async confirmAccountDeletion() {
    try {
      const code = (this.deleteCodeInput?.value || '').trim();
      this.clearFieldErrors();
      if (!code) { this.showFieldError(this.deleteCodeInput, this.deleteCodeError, 'Enter deletion code.'); return; }
      const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://finance-tracker-tlss.onrender.com';
      const res = await fetch(`${base}/api/user/account/delete/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!res.ok) { this.showFieldError(this.deleteCodeInput, this.deleteCodeError, 'Code is incorrect or expired.'); return; }
      if (res.ok) authService.logout();
    } catch (e) {
      this.showFieldError(this.deleteCodeInput, this.deleteCodeError, 'Failed to delete account.');
    }
  }

  static showFieldError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('input-error');
    if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
  }

  static clearFieldErrors() {
    [this.resetCodeInput, this.newPasswordInput, this.confirmPasswordInput, this.deleteCodeInput].forEach(el => {
      if (el) el.classList.remove('input-error');
    });
    [this.resetCodeError, this.newPasswordError, this.confirmPasswordError, this.deleteCodeError].forEach(el => {
      if (el) { el.textContent = ''; el.style.display = 'none'; }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}

