import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  plaidAccessToken: String,
});

export default mongoose.model('User', userSchema);
