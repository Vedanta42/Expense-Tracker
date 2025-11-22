// server.js
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 1. CORS - MUST be before routes and allow Live Server origins
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// 2. Body parser - must be before routes
app.use(express.json());

// 3. Serve static files only if you want (optional when using Live Server)
app.use(express.static('public'));

// 4. API Routes
app.use('/api/auth', authRoutes);

// 5. Test route (optional)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Sync database + start server
(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Allow CORS for Live Server: http://localhost:5500`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
})();