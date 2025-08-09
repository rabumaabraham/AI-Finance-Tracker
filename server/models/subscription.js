import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, enum: ['free', 'pro_monthly', 'pro_yearly'], default: 'free' },
  status: { type: String, enum: ['active', 'canceled'], default: 'active' },
  currentPeriodEnd: { type: Date },
  canceledAt: { type: Date },
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;


