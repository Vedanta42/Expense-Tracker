const User = require('../models/User');

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'All fields are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create new user (plain password as requested)
    const user = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = { signup };