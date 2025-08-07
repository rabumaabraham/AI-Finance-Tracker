import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['week', 'month', 'quarter', 'year'],
    default: 'month'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one budget per category per user per period
budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
