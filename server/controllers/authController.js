// controllers/authController.js
const User = require('../models/User');
const ForgotPasswordRequest = require('../models/ForgotPasswordRequest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } = require('@getbrevo/brevo');
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

const transactionalEmailsApi = new TransactionalEmailsApi();
transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const signup = async (req, res) => {
  // Sanitize inputs
  const { name, email, password } = req.body;
  const sanitizedEmail = email?.trim().toLowerCase();
  const sanitizedName = name?.trim();
  const sanitizedPassword = password?.trim();

  if (!sanitizedName || !sanitizedEmail || !sanitizedPassword || sanitizedPassword.length < 6) {
    return res.status(400).json({ message: 'All fields required; password min 6 chars' });
  }

  // Basic email validation (Sequelize has isEmail, but reinforce here)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const existingUser = await User.findOne({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(sanitizedPassword, saltRounds);

    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  // Sanitize inputs
  const { email, password } = req.body;
  const sanitizedEmail = email?.trim().toLowerCase();

  if (!sanitizedEmail || !password?.trim()) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ where: { email: sanitizedEmail } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const forgotPassword = async (req, res) => {
  // Sanitize input
  const { email } = req.body;
  const sanitizedEmail = email?.trim().toLowerCase();

  if (!sanitizedEmail) {
    return res.status(400).json({ message: 'Email required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const user = await User.findOne({ where: { email: sanitizedEmail } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If email exists, reset link sent' });
    }

    const id = uuidv4();

    await sequelize.transaction(async (t) => {
      // Deactivate old requests
      await ForgotPasswordRequest.update({ isactive: false }, { where: { userId: user.id }, transaction: t });

      await ForgotPasswordRequest.create({
        id,
        userId: user.id
      }, { transaction: t });
    });

    // Send email
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = 'Password Reset - Expense Tracker';
    sendSmtpEmail.htmlBody = `
      <h2>Reset Your Password</h2>
      <p>Click <a href="http://localhost:5000/password/resetpassword/${id}">here</a> to reset (valid for 1 hour).</p>
      <p>If not requested, ignore this.</p>
    `;
    sendSmtpEmail.sender = { name: 'Expense Tracker', email: 'noreply@expensetracker.com' };
    sendSmtpEmail.to = [{ email: sanitizedEmail }];

    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    res.json({ message: 'Reset email sent if email exists' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

const resetPasswordPage = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send('<h2>Invalid reset link</h2>');
  }

  try {
    const request = await ForgotPasswordRequest.findByPk(id);
    if (!request || !request.isactive) {
      return res.status(400).send('<h2>Invalid or expired reset link</h2>');
    }

    // Valid → redirect to form with requestId
    res.redirect(`/resetpassword.html?requestId=${id}`);
  } catch (error) {
    console.error('Reset page error:', error);
    res.status(500).send('<h2>Server error</h2>');
  }
};

const updatePassword = async (req, res) => {
  // Sanitize input
  const { requestId, newPassword } = req.body;
  const sanitizedNewPassword = newPassword?.trim();

  if (!sanitizedNewPassword || sanitizedNewPassword.length < 6) {
    return res.status(400).json({ message: 'Password min 6 chars' });
  }

  try {
    await sequelize.transaction(async (t) => {
      const request = await ForgotPasswordRequest.findByPk(requestId, { transaction: t });
      if (!request || !request.isactive) {
        throw new Error('Invalid or expired reset link');
      }

      const user = await User.findByPk(request.userId, { transaction: t });
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(sanitizedNewPassword, saltRounds);
      await user.update({ password: hashedPassword }, { transaction: t });
      await request.update({ isactive: false }, { transaction: t });
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPasswordPage, updatePassword };