const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config({ quiet: true });

// Log stripping for production
if (process.env.NODE_ENV === 'production') {
  console.log = function() {};
  console.info = function() {};
  console.debug = function() {};
  // Keeping console.error and console.warn for critical server issues
}

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from /uploads
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Middleware
app.use(express.json());

// Strict CORS for Production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://rehablito.vercel.app']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const adminRoutes = require('./routes/admin.routes');
const managerRoutes = require('./routes/manager.routes');
const staffRoutes = require('./routes/staff.routes');
const parentRoutes = require('./routes/parent.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
    res.send('Rehablito API is running...');
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Initialize Cron Jobs
require('./cron/billingCron');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.error(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`); // using error so it prints in prod
});

// Process protections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: Unhandled Rejection: ${err.message}`);
  // Do not crash server
});

process.on('uncaughtException', (err) => {
  console.error(`Error: Uncaught Exception: ${err.message}`);
  // Do not crash server
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error('Server startup error:', error);
  process.exit(1);
});
