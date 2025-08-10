import Stripe from 'stripe';
import User from '../models/user.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
console.log('🔑 Stripe Secret Key:', stripeSecret ? '✅ Set' : '❌ Missing');
console.log('🔑 Stripe Secret Key length:', stripeSecret ? stripeSecret.length : 0);
console.log('🔑 Stripe Secret Key starts with:', stripeSecret ? stripeSecret.substring(0, 7) : 'N/A');

export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
console.log('🔑 Stripe instance created:', !!stripe);

export async function getOrCreateCustomer(userId, email) {
  if (!stripe) throw new Error('Stripe not configured');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  const customer = await stripe.customers.create({ email });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

export async function createCheckoutSession({ userId, email, priceId, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');
  const customerId = await getOrCreateCustomer(userId, email);
  
  // Determine plan from price ID
  const plan = priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ? 'pro_monthly' : 'pro_yearly';
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    automatic_tax: { enabled: true },
    customer_update: {
      address: 'auto',
      shipping: 'auto'
    },
    metadata: {
      userId: userId.toString(),
      plan: plan,
      priceId: priceId
    }
  });
  return session;
}

export async function createBillingPortalSession({ customerId, returnUrl }) {
  if (!stripe) throw new Error('Stripe not configured');
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!stripe) throw new Error('Stripe not configured');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) throw new Error('STRIPE_WEBHOOK_SECRET missing');
  return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
}


