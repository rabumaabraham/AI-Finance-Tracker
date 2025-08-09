class SubscriptionManagerClass {
  constructor() {
    this.baseURL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api/subscription'
      : 'https://finance-tracker-tlss.onrender.com/api/subscription';
    this.sub = null;
  }

  static init() {
    if (!window.__subscriptionManagerInstance) {
      window.__subscriptionManagerInstance = new SubscriptionManagerClass();
    }
    window.__subscriptionManagerInstance.render();
  }

  async fetchSub() {
    const token = authService.getToken();
    if (!token) return null;
    const res = await fetch(`${this.baseURL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      this.sub = await res.json();
    }
    return this.sub;
  }

  getCardsHtml() {
    const plan = this.sub?.plan || 'free';
    const isFree = plan === 'free';
    return `
      <div class="pricing-grid">
        <div class="ud-single-pricing first-item">
          <div class="ud-pricing-header">
            <h3>Free</h3>
            <div class="price-display"><span class="amount">€0</span><span class="period">/month</span></div>
          </div>
          <div class="ud-pricing-body">
            <ul>
              <li><i class="lni lni-checkmark-circle"></i> Connect 1 bank account</li>
              <li><i class="lni lni-checkmark-circle"></i> Set budget limits with email alerts</li>
              <li><i class="lni lni-checkmark-circle"></i> Smart analytics dashboard</li>
              <li><i class="lni lni-checkmark-circle"></i> Chat with AI assistant</li>
              <li><i class="lni lni-checkmark-circle"></i> Secure, encrypted sync</li>
            </ul>
          </div>
          <div class="ud-pricing-footer">
            ${isFree ? '<button class="ud-main-btn" disabled>Current Plan</button>' : '<button class="ud-main-btn ud-border-btn" data-plan="free">Switch to Free</button>'}
          </div>
        </div>

        <div class="ud-single-pricing active">
          <span class="ud-popular-tag">Most Popular</span>
          <div class="ud-pricing-header">
            <h3>Unlimited Monthly</h3>
            <div class="price-display"><span class="amount">€19</span><span class="period">/month</span></div>
          </div>
          <div class="ud-pricing-body">
            <ul>
              <li><i class="lni lni-checkmark-circle"></i> Unlimited bank connections</li>
              <li><i class="lni lni-checkmark-circle"></i> Set budget limits with email alerts</li>
              <li><i class="lni lni-checkmark-circle"></i> Smart analytics dashboard</li>
              <li><i class="lni lni-checkmark-circle"></i> Chat with AI assistant</li>
              <li><i class="lni lni-checkmark-circle"></i> Secure, encrypted sync</li>
            </ul>
          </div>
          <div class="ud-pricing-footer">
            ${plan === 'pro_monthly' ? '<button class="ud-main-btn ud-white-btn" disabled>Current Plan</button>' : '<button class="ud-main-btn ud-white-btn" data-plan="pro_monthly">Choose Monthly</button>'}
          </div>
        </div>

        <div class="ud-single-pricing last-item">
          <div class="ud-pricing-header">
            <h3>Unlimited Yearly</h3>
            <div class="price-display"><span class="amount">€190</span><span class="period">/year</span></div>
          </div>
          <div class="ud-pricing-body">
            <ul>
              <li><i class="lni lni-checkmark-circle"></i> Unlimited bank connections</li>
              <li><i class="lni lni-checkmark-circle"></i> Set budget limits with email alerts</li>
              <li><i class="lni lni-checkmark-circle"></i> Smart analytics dashboard</li>
              <li><i class="lni lni-checkmark-circle"></i> Chat with AI assistant</li>
              <li><i class="lni lni-checkmark-circle"></i> Secure, encrypted sync</li>
            </ul>
          </div>
          <div class="ud-pricing-footer">
            ${plan === 'pro_yearly' ? '<button class="ud-main-btn" disabled>Current Plan</button>' : '<button class="ud-main-btn ud-border-btn" data-plan="pro_yearly">Choose Yearly</button>'}
          </div>
        </div>
      </div>
      <div class="text-end mt-3">
        ${!isFree ? '<button class="btn btn-outline-danger" id="btn-cancel-sub">Unsubscribe (Switch to Free)</button>' : ''}
      </div>
    `;
  }

  attachHandlers(container) {
    container.querySelectorAll('button[data-plan]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const plan = btn.getAttribute('data-plan');
        await this.updatePlan(plan, btn);
      });
    });
    const cancelBtn = container.querySelector('#btn-cancel-sub');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        await this.cancel(cancelBtn);
      });
    }
  }

  async updatePlan(plan, btn) {
    const token = authService.getToken();
    if (!token) return;
    const original = authService.showLoading ? authService.showLoading(btn) : null;
    const res = await fetch(`${this.baseURL}/update`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    if (authService.hideLoading && original) authService.hideLoading(btn, original);
    if (res.ok) {
      this.sub = await res.json();
      await this.render();
    }
  }

  async cancel(btn) {
    const token = authService.getToken();
    if (!token) return;
    const original = authService.showLoading ? authService.showLoading(btn) : null;
    const res = await fetch(`${this.baseURL}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (authService.hideLoading && original) authService.hideLoading(btn, original);
    if (res.ok) {
      this.sub = await res.json();
      await this.render();
      // After downgrade, suggest removing extra banks if any
      if (window.bankManager) await window.bankManager.loadConnectedBanks();
    }
  }

  async render() {
    await this.fetchSub();
    const section = document.querySelector('#subscription .dashboard-card');
    if (!section) return;
    const body = document.createElement('div');
    body.innerHTML = this.getCardsHtml();
    // Keep header; replace content under header
    section.querySelectorAll(':scope > *:not(.card-header)').forEach(el => el.remove());
    section.appendChild(body);
    this.attachHandlers(section);
  }
}

// expose class for dashboard.js (calls SubscriptionManager.init())
window.SubscriptionManager = SubscriptionManagerClass;


