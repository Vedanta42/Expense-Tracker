// server/routes/premiumRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getLeaderboard } = require('../controllers/premiumController');

// Protect all premium routes
router.use(authenticateToken);

router.get('/leaderboard', getLeaderboard);

module.exports = router;