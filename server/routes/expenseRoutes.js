const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');  // Added middleware
const { addExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');

// Apply middleware to all expense routes (protects add/get/delete)
router.use(authenticateToken);

router.post('/add', addExpense);
router.get('/', getExpenses);
router.delete('/:id', deleteExpense);

module.exports = router;