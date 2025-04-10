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
const allowedOrigins = [
  'http://localhost:5173',    // Vite dev server
  'http://localhost:5001',    // Backend dev server
  'https://notegeek.clintgeek.com',  // Production domain
  'http://192.168.1.26:5173'  // Local network access
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add request origin logging
app.use((req, res, next) => {
  console.log('Request Origin:', req.get('Origin'));
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
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

// Add version check at the top of the file
// Ensure Node.js version is compatible
const requiredNodeVersion = '16.0.0';

function compareVersions(v1, v2) {
    const v1parts = v1.split('.').map(Number);
    const v2parts = v2.split('.').map(Number);

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1; // v1 is longer, so greater
        }
        if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        if (v1parts[i] < v2parts[i]) {
            return -1;
        }
    }

    if (v1parts.length !== v2parts.length) {
        return -1; // v2 is longer, so greater
    }

    return 0;
}

if (compareVersions(process.version.substring(1), requiredNodeVersion) < 0) {
    console.error(`\n\n\x1b[31m=========== ERROR: INCOMPATIBLE NODE.JS VERSION ===========\x1b[0m`);
    console.error(`\x1b[31mYou are running Node.js ${process.version}, but NoteGeek requires at least v${requiredNodeVersion}\x1b[0m`);
    console.error(`\x1b[31mPlease run: \x1b[33mnvm use --lts\x1b[31m and try again.\x1b[0m`);
    console.error(`\x1b[31m=========================================================\x1b[0m\n`);
    process.exit(1);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});