import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getMySubscription, updateSubscription, cancelSubscription, canConnectMoreBanks, activateSubscription } from '../controllers/subscriptionController.js';
import { stripe, verifyWebhookSignature } from '../services/stripeService.js';
import Subscription from '../models/subscription.js';
import User from '../models/user.js';

const router = express.Router();

router.get('/me', verifyToken, getMySubscription);
router.post('/update', verifyToken, updateSubscription);
router.post('/activate', verifyToken, activateSubscription);
router.post('/cancel', verifyToken, cancelSubscription);
router.get('/can-connect', verifyToken, canConnectMoreBanks);

export default router;

// Stripe webhook (no auth)
export const webhookRouter = express.Router();
webhookRouter.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) return res.status(500).send('Stripe not configured');
    const sig = req.headers['stripe-signature'];
    const event = verifyWebhookSignature(req.body, sig);

    console.log('🔔 Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('✅ Checkout session completed:', session.id);
        
        const { userId, plan } = session.metadata;
        if (!userId || !plan) {
          console.error('❌ Missing metadata in session:', session.metadata);
          break;
        }

        // Update subscription status
        await Subscription.findOneAndUpdate(
          { userId },
          {
            plan,
            status: 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (plan === 'pro_monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Subscription activated for user ${userId}: ${plan}`);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('✅ Invoice payment succeeded:', invoice.id);
        
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
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Invoice payment failed:', invoice.id);
        
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription
        });

        if (subscription) {
          subscription.status = 'past_due';
          subscription.updatedAt = new Date();
          await subscription.save();
          
          console.log(`❌ Subscription marked as past due: ${subscription.plan}`);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('🔄 Subscription updated:', subscription.id);
        
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
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🗑️ Subscription deleted:', subscription.id);
        
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            status: 'canceled',
            updatedAt: new Date()
          }
        );
        
        console.log(`🗑️ Subscription canceled: ${subscription.id}`);
        break;
      }
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});


