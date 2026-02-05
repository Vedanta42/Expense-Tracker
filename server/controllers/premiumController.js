// server/controllers/premiumController.js
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await sequelize.query(
      `SELECT u.name, SUM(COALESCE(e.amount, 0)) AS total_expense 
       FROM users u 
       LEFT JOIN expenses e ON u.id = e.userId 
       GROUP BY u.id, u.name 
       ORDER BY total_expense DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };