// server/models/transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  category: String,
  date: Date,
  name: String,
});

export default mongoose.model('Transaction', transactionSchema);
