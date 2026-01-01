// server.js (updated section only - add this line with other routes)

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');  // ← NEW

const app = express();

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);  // ← NEW: Premium payment routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Sync DB & Launch
(async () => {
  try {
    await sequelize.sync({ alter: true });  // alter: true to add new fields/tables safely
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