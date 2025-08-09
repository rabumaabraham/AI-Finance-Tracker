import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  secure: false,
  tls: { rejectUnauthorized: false }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).select('name email createdAt');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update name
router.put('/me', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    { name: name.trim() },
    { new: true, select: 'name email createdAt' }
  );
  res.json(user);
});

// Request password reset: email a 6-digit code
router.post('/password/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.passwordResetToken = code;
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
  await user.save();

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `Finance Tracker <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Your password reset code',
    html: `<p>Use this code to reset your password:</p><h2 style="letter-spacing:3px;">${code}</h2><p>This code expires in 10 minutes.</p>`
  });

  const isProd = process.env.NODE_ENV === 'production';
  res.json(isProd ? { message: 'Reset code sent' } : { message: 'Reset code sent', code });
});

// Reset password with code
router.post('/password/verify', async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password || password.length < 6) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  const user = await User.findOne({ passwordResetToken: code, passwordResetExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// Request account deletion (email confirmation)
router.post('/account/delete/request', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.accountDeletionToken = code;
  user.accountDeletionExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
  await user.save();

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `Finance Tracker <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Your account deletion code',
    html: `<p>Use this code to confirm account deletion:</p><h2 style="letter-spacing:3px;">${code}</h2><p>This code expires in 10 minutes.</p>`
  });

  const isProdDel = process.env.NODE_ENV === 'production';
  res.json(isProdDel ? { message: 'Deletion code sent' } : { message: 'Deletion code sent', code });
});

// Confirm account deletion
router.post('/account/delete/confirm', async (req, res) => {
  const { code } = req.body;
  const user = await User.findOne({ accountDeletionToken: code, accountDeletionExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  await User.findByIdAndDelete(user._id);
  res.json({ message: 'Account deleted successfully' });
});

export default router;

