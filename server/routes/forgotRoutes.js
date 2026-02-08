// routes/forgotRoutes.js
const express = require('express');
const router = express.Router();
const { forgotPassword } = require('../controllers/authController');

router.post('/forgotpassword', forgotPassword);

module.exports = router;