import express from 'express';
import { registerUser } from '../controllers/auth.js'; // We will create this controller function next

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// We will add the login route here later
// router.post('/login', loginUser);

export default router;