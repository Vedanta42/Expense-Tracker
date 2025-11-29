const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');

// No middleware—headers handled in controllers
router.post('/add', addExpense);
router.get('/', getExpenses);
router.delete('/:id', deleteExpense);

module.exports = router;