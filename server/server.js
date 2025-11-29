// server.js
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');  // NEW
const Expense = require('./models/Expense');  // NEW: Auto-sync table

const app = express();

// CORS for Live Server
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// JSON parsing
app.use(express.json());

// Serve static frontend
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);  // NEW

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Sync DB & Launch
(async () => {
  try {
    await sequelize.sync({ force: false });  // Creates/updates tables
    console.log('Database synced successfully');

    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Frontend: http://127.0.0.1:5500/login.html`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
})();