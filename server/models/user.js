// server/models/user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  accountDeletionToken: { type: String },
  accountDeletionExpires: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
