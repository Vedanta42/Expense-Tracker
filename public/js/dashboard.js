// public/js/dashboard.js
const expenseForm = document.getElementById('expenseForm');
const expensesList = document.getElementById('expensesList');
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');

// Protect: Redirect if no user
const user = localStorage.getItem('user');
if (!user) {
  window.location.href = 'login.html';
}

// Set userId header for all calls
const userObj = JSON.parse(user);
axios.defaults.headers.common['X-User-ID'] = userObj.id;

// Load on start/refresh
loadExpenses();

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const amount = document.getElementById('amount').value;
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;

  try {
    await axios.post('http://localhost:5000/api/expenses/add', {
      amount, description, category
    });

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Expense added successfully!';
    expenseForm.reset();
    loadExpenses();
  } catch (err) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = err.response?.data?.message || 'Failed to add expense';
  }
});

async function loadExpenses() {
  try {
    const res = await axios.get('http://localhost:5000/api/expenses');
    const expenses = res.data.expenses;

    expensesList.innerHTML = '';

    if (expenses.length === 0) {
      expensesList.innerHTML = '<li style="text-align: center; color: #666; padding: 20px;">No expenses yet. Add one above!</li>';
      return;
    }

    expenses.forEach(exp => {
      const li = document.createElement('li');
      li.className = 'expense-item';
      li.innerHTML = `
        <div class="expense-details">
          <strong>₹${parseFloat(exp.amount).toFixed(2)}</strong>
          <p>${exp.description}</p>
          <span class="category-tag">${exp.category}</span>
        </div>
        <button class="delete-btn" data-id="${exp.id}">Delete</button>
      `;
      expensesList.appendChild(li);
    });

    // Delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this expense?')) {
          try {
            await axios.delete(`http://localhost:5000/api/expenses/${id}`);
            loadExpenses();
          } catch (err) {
            alert('Failed to delete expense');
          }
        }
      });
    });

  } catch (err) {
    expensesList.innerHTML = '<li style="text-align: center; color: #dc3545; padding: 20px;">Failed to load expenses. Please refresh.</li>';
  }
}

// Logout: Clear & redirect
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['X-User-ID'];
  window.location.href = 'login.html';
});