import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { Resend } from 'resend';

const router = express.Router();

const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

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
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Password reset request processed' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = code;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
    await user.save();

    console.log(`📧 Sending password reset code to ${email}`);

    // Create Resend client
    const resend = createResendClient();
    
    // Send password reset email using Resend
    const result = await resend.emails.send({
      from: 'AI Finance Tracker <noreply@seenoai.com>',
      to: [user.email],
      subject: 'Your password reset code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3056d3 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 2rem;">Password Reset</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">AI Finance Tracker</p>
            </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #3056d3; margin-bottom: 20px;">Hello ${user.name},</h2>
            
            <p style="font-size: 1.1rem; margin-bottom: 25px;">You requested a password reset for your AI Finance Tracker account.</p>
            
            <div style="background: white; border: 2px solid #3056d3; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 15px; font-weight: 600; color: #333;">Your reset code is:</p>
              <h1 style="margin: 0; font-size: 3rem; letter-spacing: 8px; color: #3056d3; font-family: 'Courier New', monospace;">${code}</h1>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-weight: 600;">This code expires in 10 minutes</p>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-top: 25px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.8rem;">
            <p>© 2024 AI Finance Tracker. All rights reserved.</p>
          </div>
        </div>
      `
    });

    console.log('📧 Resend API response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message || result.error}`);
    }
    
    if (!result.data || !result.data.id) {
      throw new Error('Resend API returned no email ID - email may not have been sent');
    }

    console.log(`✅ Password reset code sent successfully to ${email}`);
    console.log(`📧 Resend email ID: ${result.data.id}`);

    const isProd = process.env.NODE_ENV === 'production';
    res.json(isProd ? { message: 'Password reset code sent to your email' } : { message: 'Password reset code sent to your email', code });
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message || error);
    res.status(500).json({ message: 'Failed to send reset code. Please try again.' });
  }
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
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.accountDeletionToken = code;
    user.accountDeletionExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
    await user.save();
    
    console.log('🔍 Account deletion code generated:', { 
      userId: user._id, 
      email: user.email, 
      code, 
      expiresAt: user.accountDeletionExpires,
      timestamp: new Date().toISOString()
    });

    console.log(`📧 Sending account deletion code to ${user.email}`);

    // Create Resend client
    const resend = createResendClient();
    
    // Send account deletion email using Resend
    const result = await resend.emails.send({
      from: 'AI Finance Tracker <noreply@seenoai.com>',
      to: [user.email],
      subject: 'Your account deletion code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 2rem;">Account Deletion</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">AI Finance Tracker</p>
            </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc3545; margin-bottom: 20px;">Hello ${user.name},</h2>
            
            <p style="font-size: 1.1rem; margin-bottom: 25px;">You requested to delete your AI Finance Tracker account.</p>
            
            <div style="background: white; border: 2px solid #dc3545; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 15px; font-weight: 600; color: #333;">Your deletion code is:</p>
              <h1 style="margin: 0; font-size: 3rem; letter-spacing: 8px; color: #dc3545; font-family: 'Courier New', monospace;">${code}</h1>
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24; font-weight: 600;">This action cannot be undone. All your data will be permanently deleted.</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-weight: 600;">This code expires in 10 minutes</p>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-top: 25px;">
              If you didn't request this account deletion, please ignore this email. Your account will remain active.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.8rem;">
            <p>© 2024 AI Finance Tracker. All rights reserved.</p>
          </div>
        </div>
      `
    });

    console.log('📧 Resend API response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message || result.error}`);
    }
    
    if (!result.data || !result.data.id) {
      throw new Error('Resend API returned no email ID - email may not have been sent');
    }

    console.log(`✅ Account deletion code sent successfully to ${user.email}`);
    console.log(`📧 Resend email ID: ${result.data.id}`);

    const isProdDel = process.env.NODE_ENV === 'production';
    res.json(isProdDel ? { message: 'Deletion code sent' } : { message: 'Deletion code sent', code });
    
  } catch (error) {
    console.error('❌ Error sending account deletion email:', error.message || error);
    res.status(500).json({ message: 'Failed to send deletion code. Please try again.' });
  }
});

// Confirm account deletion
router.post('/account/delete/confirm', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('🔍 Account deletion confirmation attempt:', { code, timestamp: new Date().toISOString() });
    
    if (!code) {
      console.log('❌ No code provided');
      return res.status(400).json({ message: 'Code is required' });
    }

    // Find user with matching deletion token
    const user = await User.findOne({ 
      accountDeletionToken: code, 
      accountDeletionExpires: { $gt: new Date() } 
    });
    
    console.log('🔍 User lookup result:', { 
      found: !!user, 
      userId: user?._id,
      storedToken: user?.accountDeletionToken,
      providedCode: code,
      tokenMatch: user?.accountDeletionToken === code,
      expiresAt: user?.accountDeletionExpires,
      isExpired: user?.accountDeletionExpires ? user.accountDeletionExpires <= new Date() : 'no expiry'
    });
    
    if (!user) {
      console.log('❌ No user found with matching token or token expired');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log('✅ Valid deletion code, proceeding with account deletion');
    await User.findByIdAndDelete(user._id);
    console.log('✅ Account deleted successfully');
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error in account deletion confirmation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

