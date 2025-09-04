// server/models/bankAccount.js
import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requisitionId: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountId: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'connected'
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  }
}, { timestamps: true });

// Compound index to ensure one requisition per user (but same requisition can be used by different users)
bankAccountSchema.index({ userId: 1, requisitionId: 1 }, { unique: true });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount; 