const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT']
}));

app.use(express.json());

// ← FIXED: Absolute path to public (works from /Expense App/server)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

(async () => {
  try {
    await sequelize.sync({ alter: true });
    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Access app: http://localhost:${PORT}/login.html`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
})();