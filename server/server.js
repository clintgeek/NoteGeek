import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js'; // Import database connection

// Import route files
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js'; // Import note routes
import tagRoutes from './routes/tags.js'; // Import tag routes
import searchRoutes from './routes/search.js'; // Import search routes

// Load environment variables
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path to .env.local relative to the current file
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
// Load .env if .env.local is not found or doesn't contain all variables
dotenv.config(); // Loads .env by default

// Connect to Database
connectDB();

// Initialize Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Add request origin logging
app.use((req, res, next) => {
  console.log('Request Origin:', req.get('Origin'));
  console.log('Request Method:', req.method);
  next();
});

// Other Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

// HTTP request logger middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/search', searchRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('NoteGeek API is running...');
});

// Define port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});