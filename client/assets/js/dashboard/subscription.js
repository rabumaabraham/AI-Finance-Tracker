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
    
    // Check if we're returning from Stripe checkout immediately
    const instance = window.__subscriptionManagerInstance;
    instance.checkForStripeReturn();
    instance.render();
    
    // Also check when the page becomes visible (in case user navigates back)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, checking for Stripe return...');
        instance.checkForStripeReturn();
      }
    });
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

  checkForStripeReturn() {
    // Check if we're returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    
    // Parse hash parameters more robustly
    let hashParams = new URLSearchParams();
    if (window.location.hash && window.location.hash.includes('?')) {
      const hashPart = window.location.hash.split('?')[1];
      hashParams = new URLSearchParams(hashPart);
    }
    
    const checkout = urlParams.get('checkout') || hashParams.get('checkout');
    
    console.log('🔍 checkForStripeReturn - URL params:', {
      search: window.location.search,
      hash: window.location.hash,
      hashPart: window.location.hash.split('?')[1] || 'none',
      searchCheckout: urlParams.get('checkout'),
      hashCheckout: hashParams.get('checkout'),
      checkout: checkout,
      fullUrl: window.location.href
    });
    
    // Additional debugging for hash parsing
    if (window.location.hash) {
      console.log('🔍 Hash analysis:');
      console.log('  Raw hash:', window.location.hash);
      console.log('  Contains ?:', window.location.hash.includes('?'));
      if (window.location.hash.includes('?')) {
        const parts = window.location.hash.split('?');
        console.log('  Parts after split:', parts);
        console.log('  Query part:', parts[1]);
      }
    }
    
    if (checkout === 'success') {
      console.log('🎯 Stripe return detected on init, will handle in render');
      // Store a flag to handle this in render
      this.pendingStripeReturn = true;
    } else if (checkout === 'cancel') {
      console.log('❌ Stripe return cancel detected on init, will handle this in render');
      // Store a flag to handle this in render
      this.pendingStripeReturn = 'cancel';
    } else {
      console.log('ℹ️ No checkout parameter found in URL');
    }
  }
  
  // Public method to manually check for Stripe returns
  static checkForStripeReturn() {
    if (window.__subscriptionManagerInstance) {
      window.__subscriptionManagerInstance.checkForStripeReturn();
    }
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
      const data = await res.json();
      if (data.checkoutUrl) {
        // Store the selected plan before redirecting
        console.log('💾 Storing plan in localStorage:', plan);
        localStorage.setItem('selectedPlan', plan);
        console.log('💾 Plan stored, redirecting to:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
        return;
      }
      this.sub = data;
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
    
    // Check if we have a pending Stripe return
    if (this.pendingStripeReturn) {
      console.log('🎯 Processing pending Stripe return...');
      if (this.pendingStripeReturn === 'cancel') {
        this.pendingStripeReturn = false;
        this.handleCheckoutCancel();
        return; // Don't render until after handling
      } else {
        this.pendingStripeReturn = false;
        await this.handleCheckoutSuccess();
        return; // Don't render until after handling
      }
    }
    
    // If returned from Stripe, handle subscription activation
    try {
      // Check both URL search params and hash params
      const urlParams = new URLSearchParams(window.location.search);
      
      // Parse hash parameters more robustly
      let hashParams = new URLSearchParams();
      if (window.location.hash && window.location.hash.includes('?')) {
        const hashPart = window.location.hash.split('?')[1];
        hashParams = new URLSearchParams(hashPart);
      }
      
      const checkout = urlParams.get('checkout') || hashParams.get('checkout');
      const section = urlParams.get('section') || hashParams.get('section');
      
      console.log('🔍 Checking URL params:', { 
        search: window.location.search,
        hash: window.location.hash,
        hashPart: window.location.hash.split('?')[1] || 'none',
        searchCheckout: urlParams.get('checkout'),
        hashCheckout: hashParams.get('checkout'),
        checkout: checkout,
        section: section,
        fullUrl: window.location.href 
      });
      
      if (checkout === 'success') {
        console.log('✅ Checkout success detected, calling handleCheckoutSuccess...');
        await this.handleCheckoutSuccess();
      } else if (checkout === 'cancel') {
        console.log('❌ Checkout cancel detected, calling handleCheckoutCancel...');
        this.handleCheckoutCancel();
      } else {
        console.log('ℹ️ No checkout parameter found');
      }
    } catch (error) {
      console.error('💥 Error checking checkout params:', error);
    }
    
    // Debug: Check what elements we can find
    console.log('🔍 Looking for subscription section elements...');
    const subscriptionSection = document.getElementById('subscription');
    console.log('📱 Subscription section found:', !!subscriptionSection);
    if (subscriptionSection) {
      console.log('📱 Subscription section display:', subscriptionSection.style.display);
      console.log('📱 Subscription section classes:', subscriptionSection.className);
    }
    
    const dashboardCard = document.querySelector('#subscription .dashboard-card');
    console.log('🎴 Dashboard card found:', !!dashboardCard);
    
    if (!dashboardCard) {
      console.error('❌ Could not find subscription dashboard card!');
      return;
    }
    
    console.log('🎨 Rendering subscription plans...');
    const body = document.createElement('div');
    body.innerHTML = this.getCardsHtml();
    
    // Keep header; replace content under header
    const elementsToRemove = dashboardCard.querySelectorAll(':scope > *:not(.card-header)');
    console.log('🗑️ Removing', elementsToRemove.length, 'elements from dashboard card');
    elementsToRemove.forEach(el => el.remove());
    
    dashboardCard.appendChild(body);
    this.attachHandlers(dashboardCard);
    console.log('✅ Subscription plans rendered successfully');
  }

  async handleCheckoutSuccess() {
    console.log('🎉 handleCheckoutSuccess called');
    const selectedPlan = localStorage.getItem('selectedPlan');
    console.log('📋 Selected plan from localStorage:', selectedPlan);
    
    // Clean up
    localStorage.removeItem('selectedPlan');
    // Remove checkout params from URL
    const cleanUrl = window.location.origin + window.location.pathname + '#subscription';
    window.history.replaceState({}, document.title, cleanUrl);
    
    if (selectedPlan && selectedPlan !== 'free') {
      console.log('🎉 Payment successful! Subscription activation via webhook in progress...');
      (window.__notify || showNotification)('🎉 Payment successful! Your subscription is being activated via webhook.', 'success');
      
      // Wait for webhook to process, then refresh data
      setTimeout(async () => {
        console.log('⏰ Refreshing subscription data after webhook delay...');
        try {
          await this.fetchSub();
          await this.render();
          console.log('✅ Subscription data refreshed after webhook');
        } catch (error) {
          console.error('❌ Error refreshing subscription data:', error);
        }
      }, 3000); // 3 second delay to allow webhook processing
    } else {
      console.log('⚠️ No valid plan found in localStorage:', selectedPlan);
      (window.__notify || showNotification)('Payment successful!', 'success');
    }
  }

  handleCheckoutCancel() {
    (window.__notify || showNotification)('Checkout canceled. Your plan was not changed.', 'warning');
    // Clean up
    localStorage.removeItem('selectedPlan');
    // Remove checkout params from URL
    const cleanUrl = window.location.origin + window.location.pathname + '#subscription';
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

// expose class for dashboard.js (calls SubscriptionManager.init())
window.SubscriptionManager = SubscriptionManagerClass;

// Global function to check for Stripe returns
window.checkForStripeReturn = () => {
  console.log('🌐 Global checkForStripeReturn called');
  if (window.SubscriptionManager) {
    window.SubscriptionManager.checkForStripeReturn();
  }
};

// Debug function to test URL parsing
window.debugUrlParsing = () => {
  console.log('🔍 Debug URL parsing:');
  console.log('Full URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);
  console.log('Hash:', window.location.hash);
  
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashPart = window.location.hash.split('?')[1];
    console.log('Hash part after split:', hashPart);
    const hashParams = new URLSearchParams(hashPart);
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
  } else {
    console.log('No query parameters in hash');
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  console.log('Search params:', Object.fromEntries(urlParams.entries()));
};

// Test function to simulate Stripe return URL parsing
window.testStripeReturnParsing = (testUrl) => {
  console.log('🧪 Testing Stripe return URL parsing with:', testUrl);
  
  // Parse the test URL
  const url = new URL(testUrl);
  const hash = url.hash;
  
  console.log('Parsed URL:', {
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: hash
  });
  
  if (hash && hash.includes('?')) {
    const hashPart = hash.split('?')[1];
    console.log('Hash part after split:', hashPart);
    const hashParams = new URLSearchParams(hashPart);
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
    
    const checkout = hashParams.get('checkout');
    console.log('Checkout parameter:', checkout);
    
    if (checkout === 'success') {
      console.log('✅ Successfully detected checkout=success');
    } else if (checkout === 'cancel') {
      console.log('❌ Successfully detected checkout=cancel');
    } else {
      console.log('⚠️ Unexpected checkout value:', checkout);
    }
  } else {
    console.log('❌ No query parameters found in hash');
  }
};

// Test current URL parsing logic
window.testCurrentUrlParsing = () => {
  console.log('🧪 Testing current URL parsing logic...');
  
  // Simulate the exact logic used in checkForStripeReturn
  const urlParams = new URLSearchParams(window.location.search);
  
  let hashParams = new URLSearchParams();
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashPart = window.location.hash.split('?')[1];
    hashParams = new URLSearchParams(hashPart);
  }
  
  const checkout = urlParams.get('checkout') || hashParams.get('checkout');
  
  console.log('🔍 Current URL parsing results:', {
    search: window.location.search,
    hash: window.location.hash,
    hashPart: window.location.hash.split('?')[1] || 'none',
    searchCheckout: urlParams.get('checkout'),
    hashCheckout: hashParams.get('checkout'),
    checkout: checkout,
    fullUrl: window.location.href
  });
  
  return checkout;
};