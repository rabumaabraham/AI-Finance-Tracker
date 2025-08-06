// server/models/transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  date: {
    type: Date,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense'
  }
}, { timestamps: true });

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, bankAccountId: 1 });
transactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model('Transaction', transactionSchema);
