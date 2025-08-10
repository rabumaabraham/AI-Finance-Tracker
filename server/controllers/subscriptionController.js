import Subscription from '../models/subscription.js';
import BankAccount from '../models/bankAccount.js';
import User from '../models/user.js';
import { createCheckoutSession, createBillingPortalSession, stripe } from '../services/stripeService.js';

const PLAN_LIMITS = {
  free: 1,
  pro_monthly: Infinity,
  pro_yearly: Infinity,
};

export async function getMySubscription(req, res) {
  try {
    let sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      sub = await Subscription.create({ userId: req.userId, plan: 'free', status: 'active' });
    }
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load subscription' });
  }
}

export async function updateSubscription(req, res) {
  try {
    console.log('🔍 updateSubscription called with:', { plan: req.body.plan, userId: req.userId });
    
    const { plan } = req.body; // 'free' | 'pro_monthly' | 'pro_yearly'
    if (!['free', 'pro_monthly', 'pro_yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // If paid plan, require Stripe session creation instead of instant update
    if (plan !== 'free') {
      console.log('💰 Processing paid plan:', plan);
      console.log('🔑 Stripe configured:', !!stripe);
      console.log('📧 User email:', req.userId);
      
      if (!stripe) return res.status(500).json({ message: 'Payments not configured' });
      
      const user = await User.findById(req.userId).select('email stripeCustomerId');
      console.log('👤 User found:', !!user, 'Email:', user?.email);
      
      if (!user) return res.status(404).json({ message: 'User not found' });

      const priceId = plan === 'pro_monthly'
        ? process.env.STRIPE_PRICE_PRO_MONTHLY
        : process.env.STRIPE_PRICE_PRO_YEARLY;
      console.log('💳 Price ID for', plan, ':', priceId);
      
      if (!priceId) return res.status(500).json({ message: 'Stripe price not configured' });

      // Use the same origin as the request for local development
      const baseUrl = req.get('origin') || 'http://localhost:5000';
      // Use hash-based routing for SPA
      const successUrl = `${baseUrl}/dashboard.html#subscription?checkout=success`;
      const cancelUrl = `${baseUrl}/dashboard.html#subscription?checkout=cancel`;
      console.log('🌐 URLs:', { successUrl, cancelUrl });

      const session = await createCheckoutSession({
        userId: req.userId,
        email: user.email,
        priceId,
        successUrl,
        cancelUrl,
      });
      console.log('✅ Stripe session created:', session.id);
      return res.json({ checkoutUrl: session.url });
    }

    let sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      sub = new Subscription({ userId: req.userId });
    }

    sub.plan = plan;
    sub.status = 'active';

    // Set period end for paid plans for basic UX (not enforcing payments here)
    const now = new Date();
    if (plan === 'pro_monthly') {
      sub.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (plan === 'pro_yearly') {
      sub.currentPeriodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      sub.currentPeriodEnd = undefined;
    }

    await sub.save();
    res.json(sub);
  } catch (err) {
    console.error('❌ Error in updateSubscription:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: 'Failed to update subscription', error: err.message });
  }
}

export async function cancelSubscription(req, res) {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    sub.plan = 'free';
    sub.status = 'active';
    sub.canceledAt = new Date();
    sub.currentPeriodEnd = undefined;
    await sub.save();

    // Clear Stripe subscription fields on user (does not cancel at Stripe here)
    await User.findByIdAndUpdate(req.userId, { $unset: { stripeSubscriptionId: 1 } });

    // Enforce free limit immediately: if user has >1 bank, keep first and disconnect rest
    const connectedBanks = await BankAccount.find({ userId: req.userId, status: 'connected' }).sort({ createdAt: 1 });
    if (connectedBanks.length > PLAN_LIMITS.free) {
      const toRemove = connectedBanks.slice(PLAN_LIMITS.free);
      for (const bank of toRemove) {
        await BankAccount.findByIdAndDelete(bank._id);
      }
    }

    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
}

export async function canConnectMoreBanks(req, res) {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    const plan = sub?.plan || 'free';
    const limit = PLAN_LIMITS[plan];
    const count = await BankAccount.countDocuments({ userId: req.userId, status: 'connected' });
    const allowed = count < limit;
    res.json({ allowed, limit, current: count, plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check limit' });
  }
}

// Manual subscription activation for testing
export async function activateSubscription(req, res) {
  try {
    const { plan } = req.body;
    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    let sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      sub = new Subscription({ userId: req.userId });
    }

    sub.plan = plan;
    sub.status = 'active';
    sub.currentPeriodEnd = plan === 'pro_monthly' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Failed to activate subscription' });
  }
}

export { PLAN_LIMITS };


