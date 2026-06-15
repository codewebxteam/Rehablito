const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config({ quiet: true });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
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
const parentRoutes = require('./routes/parent.routes'); // 🔥 NEW: Parent Portal routes
const paymentRoutes = require('./routes/payment.routes'); // NEW

// Mount routers (specific paths first, generic last)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parent', parentRoutes); // 🔥 NEW: Parent Portal routes
app.use('/api/payments', paymentRoutes); // NEW
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
    res.send('Rehablito API is running...');
});

// Initialize Cron Jobs
require('./cron/billingCron');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or use a different PORT.`);
    process.exit(1);
  }

  console.error('Server startup error:', error);
  process.exit(1);
});
