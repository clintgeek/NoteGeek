import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model

// Function to generate JWT token
const generateToken = (id) => {
  // Ensure JWT_SECRET is set in environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Add more robust password validation here if needed (e.g., length, complexity)
  if (password.length < 6) {
     return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10); // Generate salt
    const passwordHash = await bcrypt.hash(password, salt); // Hash password

    // Create user
    const user = await User.create({
      email,
      passwordHash,
    });

    if (user) {
      // Return user data and token (exclude passwordHash)
      res.status(201).json({
        _id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' }); // Should not happen if validation passes
    }
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// We will add loginUser function here later
// export const loginUser = async (req, res) => { ... };