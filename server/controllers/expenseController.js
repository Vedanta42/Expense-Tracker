const Expense = require('../models/Expense');

const addExpense = async (req, res) => {
  const { amount, description, category } = req.body;
  const userId = req.userId;  // From verified token (replaced header)

  if (!userId || !amount || !description || !category) {
    return res.status(400).json({ message: 'User ID and all fields required' });
  }

  try {
    const expense = await Expense.create({
      amount,
      description,
      category,
      userId  // Save from token (secure)
    });

    res.status(201).json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getExpenses = async (req, res) => {
  const userId = req.userId;  // From verified token

  if (!userId) {
    return res.status(401).json({ message: 'User ID required' });
  }

  try {
    const expenses = await Expense.findAll({
      where: { userId },  // Only user's expenses
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
  const userId = req.userId;  // From verified token

  if (!userId) {
    return res.status(401).json({ message: 'User ID required' });
  }

  try {
    const expense = await Expense.findOne({ where: { id, userId } });  // Only if owner

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