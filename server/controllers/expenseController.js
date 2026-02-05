// controllers/expenseController.js
const Expense = require('../models/Expense');
const User = require('../models/User');
const sequelize = require('../config/database');

const addExpense = async (req, res) => {
  const { amount, description, category } = req.body;
  const userId = req.userId;

  if (!userId || !amount || !description || !category || isNaN(amount)) {
    return res.status(400).json({ message: 'User ID and all fields required; amount must be numeric' });
  }

  try {
    await sequelize.transaction(async (t) => {
      await Expense.create({
        amount,
        description,
        category,
        userId
      }, { transaction: t });

      await User.increment('totalExpenses', {
        by: parseFloat(amount),
        where: { id: userId },
        transaction: t
      });
    });

    res.status(201).json({ success: true, message: 'Expense added successfully' });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getExpenses = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User ID required' });
  }

  try {
    const expenses = await Expense.findAll({
      where: { userId },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User ID required' });
  }

  try {
    const expense = await Expense.findOne({ where: { id, userId } });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addExpense, getExpenses, deleteExpense };