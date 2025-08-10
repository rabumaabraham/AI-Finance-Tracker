import Stripe from 'stripe';
import { Subscription } from '../models/subscription.js';
import { User } from '../models/user.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  
  try {
    const { userId, plan } = session.metadata;
    
    if (!userId || !plan) {
      console.error('❌ Missing metadata in session:', session.metadata);
      return;
    }

    // Update subscription status
    await Subscription.findOneAndUpdate(
      { userId },
      {
        plan,
        status: 'active',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodStart: new Date(session.subscription_data?.trial_start * 1000),
        currentPeriodEnd: new Date(session.subscription_data?.trial_end * 1000),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Subscription activated for user ${userId}: ${plan}`);
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('✅ Invoice payment succeeded:', invoice.id);
  
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
      subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
      subscription.updatedAt = new Date();
      await subscription.save();
      
      console.log(`✅ Subscription renewed: ${subscription.plan}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.status = 'past_due';
      subscription.updatedAt = new Date();
      await subscription.save();
      
      console.log(`❌ Subscription marked as past due: ${subscription.plan}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice failure:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  try {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      dbSubscription.status = subscription.status;
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      dbSubscription.updatedAt = new Date();
      await dbSubscription.save();
      
      console.log(`🔄 Subscription updated: ${dbSubscription.plan} - ${subscription.status}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);
  
  try {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: 'canceled',
        updatedAt: new Date()
      }
    );
    
    console.log(`🗑️ Subscription canceled: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}
