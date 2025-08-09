import Subscription from '../models/subscription.js';
import BankAccount from '../models/bankAccount.js';

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
    const { plan } = req.body; // 'free' | 'pro_monthly' | 'pro_yearly'
    if (!['free', 'pro_monthly', 'pro_yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
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
    res.status(500).json({ message: 'Failed to update subscription' });
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

export { PLAN_LIMITS };


