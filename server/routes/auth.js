// server/routes/auth
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { body, validationResult } from 'express-validator';
import { verifyToken } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Signup
router.post('/signup',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {   
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ name, email, password: hashedPassword });
      await user.save();

      // Send welcome email to new user
      try {
        await sendWelcomeEmail(name, email);
        console.log(`✅ Welcome email sent to new user: ${email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError);
        // Don't fail the signup if email fails
      }

      // Don't return token on signup - user must login separately
      res.json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: req.userId, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
