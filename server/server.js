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
import folderRoutes from './routes/folders.js'; // Import folder routes
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

// Define CORS Options first
const allowedOrigins = ['http://localhost:5173']; // Whitelist
const corsOptions = {
  origin: function (origin, callback) { // Use function check
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  // origin: '*', // Revert temporary wildcard
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware FIRST using the defined options
app.use(cors(corsOptions));

// Add request origin logging
app.use((req, res, next) => {
  console.log('Request Origin:', req.get('Origin'));
  console.log('Request Method:', req.method); // Also log method
  next();
});

// Other Middleware
// CORS Configuration - keeping definition here for clarity - moved above
// const allowedOrigins = ['http://localhost:5173']; // Whitelist - Temporarily disabling whitelist
// const corsOptions = { ... }; // Definition moved above
// app.use(cors(corsOptions)); // Moved this line up

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

// HTTP request logger middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes); // Mount note routes
app.use('/api/folders', folderRoutes); // Mount folder routes
app.use('/api/tags', tagRoutes); // Mount tag routes
app.use('/api/search', searchRoutes); // Mount search routes

// Basic route for testing
app.get('/', (req, res) => {
  res.send('NoteGeek API is running...');
});

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});