// routes/passwordRoutes.js
const express = require('express');
const router = express.Router();
const { forgotPassword } = require('../controllers/passwordController');

router.post('/forgotpassword', forgotPassword);

module.exports = router;