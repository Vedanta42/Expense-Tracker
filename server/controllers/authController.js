const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } = require('@getbrevo/brevo');
const saltRounds = 10;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

const transactionalEmailsApi = new TransactionalEmailsApi();
transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'All fields required; password min 6 chars' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium  // Added for consistency
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium  // Added: Fixes dashboard check
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });  // Or "Email sent if exists" for security
    }

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = 'Password Reset - Expense Tracker';
    sendSmtpEmail.textContent = 'This is a dummy password reset email. Your reset link would be here. If you didn\'t request this, ignore it.';
    // UPDATED: Use your Brevo-registered email as sender (e.g., vedanta420@gmail.com) – replace below
    sendSmtpEmail.sender = { name: 'Expense Tracker Support', email: 'vedanta420@gmail.com' };  // ← CHANGE THIS TO YOUR VERIFIED EMAIL
    sendSmtpEmail.to = [{ email: user.email, name: user.name }];

    const result = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', result);

    res.json({ success: true, message: 'Reset email sent! Check your inbox (including spam folder).' });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Handle Brevo-specific errors (e.g., sender invalid)
    if (error.message && error.message.includes('sender')) {
      res.status(500).json({ message: 'Sender email not verified. Please check Brevo settings or use a verified email.' });
    } else {
      res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
  }
};

module.exports = { signup, login, forgotPassword };