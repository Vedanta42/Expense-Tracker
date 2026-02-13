// controllers/expenseController.js
const Expense = require('../models/Expense');
const User = require('../models/User');
const sequelize = require('../config/database');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

const addExpense = async (req, res) => {
  // ... (unchanged - your original code)
  let { amount, description, category } = req.body;
  const userId = req.userId;

  const sanitizedAmount = parseFloat(amount?.trim());
  const sanitizedDescription = description?.trim();
  const sanitizedCategory = category?.trim();

  if (!userId || isNaN(sanitizedAmount) || sanitizedAmount <= 0 || !sanitizedDescription) {
    return res.status(400).json({ message: 'User ID, positive amount, and description required' });
  }

  try {
    if (!sanitizedCategory) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Categorize this expense description into one of: Food, Transport, Shopping, Bills, Entertainment, Salary, Other. Description: ${sanitizedDescription}. Respond with only the category name.`
        });
        category = response.text.trim();
      } catch (aiError) {
        console.error('AI categorization error:', aiError);
        category = 'Other';
      }
    }

    await sequelize.transaction(async (t) => {
      await Expense.create({
        amount: sanitizedAmount,
        description: sanitizedDescription,
        category: sanitizedCategory || category,
        userId
      }, { transaction: t });

      await User.increment('totalExpenses', {
        by: sanitizedAmount,
        where: { id: userId },
        transaction: t
      });
    });

    res.status(201).json({ message: 'Expense added successfully' });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // ← NEW: dynamic limit from frontend

    if (limit < 1 || page < 1) {
      return res.status(400).json({ message: 'Invalid page or limit' });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Expense.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    const expenses = rows;

    res.json({
      success: true,
      expenses,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        totalExpenses: count,
        rowsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteExpense = async (req, res) => {
  // ... (unchanged - your original code)
  const { id } = req.params;
  const userId = req.userId;

  const sanitizedId = parseInt(id?.trim());

  if (!userId || isNaN(sanitizedId)) {
    return res.status(400).json({ message: 'Valid expense ID required' });
  }

  try {
    const expense = await Expense.findOne({ where: { id: sanitizedId, userId } });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await sequelize.transaction(async (t) => {
      await User.decrement('totalExpenses', {
        by: parseFloat(expense.amount),
        where: { id: userId },
        transaction: t
      });

      await expense.destroy({ transaction: t });
    });

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addExpense, getExpenses, deleteExpense };