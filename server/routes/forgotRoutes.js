// routes/forgotRoutes.js
const express = require('express');
const router = express.Router();
const { forgotPassword, resetPasswordPage, updatePassword } = require('../controllers/authController');

router.post('/forgotpassword', forgotPassword);
router.get('/resetpassword/:id', resetPasswordPage);
router.post('/updatepassword', updatePassword);

module.exports = router;