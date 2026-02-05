// server/controllers/premiumController.js
const sequelize = require('../config/database');
const User = require('../models/User');
const Expense = require('../models/Expense');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.findAll({
      attributes: [
        'name',
        [sequelize.fn('SUM', sequelize.col('Expenses.amount')), 'total_expense']
      ],
      include: [{
        model: Expense,
        attributes: []
      }],
      group: ['User.id'],
      order: [[sequelize.col('total_expense'), 'DESC']]
    });

    // Map to plain objects (Sequelize instances → JSON-like)
    const formattedLeaderboard = leaderboard.map(user => ({
      name: user.name,
      total_expense: user.dataValues.total_expense || 0  // Handle null as 0
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };