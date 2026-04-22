const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ quiet: true });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Route files
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const adminRoutes = require('./routes/admin.routes');
const managerRoutes = require('./routes/manager.routes');
const staffRoutes = require('./routes/staff.routes');

// Mount routers (specific paths first, generic last)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
    res.send('Rehablito API is running...');
});

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
