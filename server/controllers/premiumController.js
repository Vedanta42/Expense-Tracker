// controllers/premiumController.js
const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.findAll({
      attributes: ['name', 'totalExpenses'],
      order: [['totalExpenses', 'DESC']]
    });

    res.json(leaderboard.map(user => ({
      name: user.name,
      total_expense: Number(user.totalExpenses) || 0
    })));
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };