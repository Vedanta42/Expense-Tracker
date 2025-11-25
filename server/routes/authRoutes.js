const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');  // Add login here

router.post('/signup', signup);
router.post('/login', login);  // ← This is the missing route!

module.exports = router;