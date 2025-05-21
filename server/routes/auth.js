import express from 'express';
import { registerUser, loginUser } from '../controllers/auth.js'; // Import loginUser
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginUser);

// @desc    Validate SSO token from GeekBase
// @route   POST /api/auth/validate-sso
// @access  Public
router.post('/validate-sso', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded SSO token:', decoded);

    // Find the user by ID
    let user = await User.findById(decoded.id).select('-password');

    // If user doesn't exist, create them
    if (!user) {
      console.log('User not found, creating new user from SSO data');
      user = await User.create({
        email: decoded.email,
        // Don't set password since this is SSO
        passwordHash: 'SSO_USER',
      });
    }

    // Return user data
    res.json({
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      token: token, // Return the same token
    });
  } catch (error) {
    console.error('SSO validation error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;