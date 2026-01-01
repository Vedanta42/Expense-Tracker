// public/js/dashboard.js
// Complete file: Handles expense CRUD, premium purchase with Cashfree, success redirect + UI update

const expenseForm = document.getElementById('expenseForm');
const expensesList = document.getElementById('expensesList');
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const premiumBtn = document.getElementById('premiumBtn');

// Authentication check
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
if (!token || !user) {
  window.location.href = 'login.html';
}

const userObj = JSON.parse(user);

// Set auth header for expense APIs (optional for /pay since no auth there now)
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Hide/show premium button based on user status
if (userObj.isPremium) {
  premiumBtn.style.display = 'none';
} else {
  premiumBtn.style.display = 'block';
}

// Show celebration message if just upgraded (after redirect from success page)
if (performance.navigation.type !== 1) {  // Not a reload
  if (userObj.isPremium) {
    messageEl.textContent = 'Welcome to Premium! Enjoy unlimited features 🎉';
    messageEl.style.color = '#28a745';
    setTimeout(() => { messageEl.textContent = ''; }, 6000);
  }
}

// Premium Membership Purchase Flow
premiumBtn.addEventListener('click', async () => {
  messageEl.textContent = 'Creating premium order...';
  messageEl.style.color = '#007bff';

  try {
    // Create order on backend (passes userId in body)
    const response = await axios.post('http://localhost:5000/api/payments/pay', {
      userId: userObj.id,
      amount: 199.00,
      customerPhone: userObj.phone || '9999999999'
    });

    const { paymentSessionId } = response.data;

    // Initialize Cashfree SDK (sandbox)
    const cashfree = Cashfree({
      mode: 'sandbox'  // Change to 'production' when going live
    });

    // Checkout options – opens in same tab
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: '_self'
    };

    // Launch checkout
    const result = await cashfree.checkout(checkoutOptions);

    // Optional logging for debugging
    if (result.paymentDetails) {
      console.log('Payment completed on Cashfree side');
    }
    if (result.error) {
      console.error('Checkout error:', result.error);
      messageEl.style.color = '#dc3545';
      messageEl.textContent = 'Payment cancelled or error occurred.';
    }

  } catch (error) {
    console.error('Error starting payment:', error);
    messageEl.style.color = '#dc3545';
    messageEl.textContent = error.response?.data?.message || 'Failed to initiate payment';
    setTimeout(() => { messageEl.textContent = ''; }, 5000);
  }
});

// Load expenses on page load
loadExpenses();

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const amount = document.getElementById('amount').value;
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;

  try {
    await axios.post('http://localhost:5000/api/expenses/add', {
      amount: parseFloat(amount),
      description,
      category
    });

    expenseForm.reset();
    loadExpenses();

    messageEl.textContent = 'Expense added successfully!';
    messageEl.style.color = '#28a745';
    setTimeout(() => { messageEl.textContent = ''; }, 3000);
  } catch (error) {
    messageEl.textContent = error.response?.data?.message || 'Failed to add expense';
    messageEl.style.color = '#dc3545';
  }
});

async function loadExpenses() {
  try {
    const response = await axios.get('http://localhost:5000/api/expenses');
    const expenses = response.data.expenses || [];

    if (expenses.length === 0) {
      expensesList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">No expenses yet. Add one above!</li>';
      return;
    }

    expensesList.innerHTML = expenses.map(expense => `
      <li class="expense-item">
        <div class="expense-details">
          <strong>₹${expense.amount.toFixed(2)}</strong> - ${expense.description} 
          <em>(${expense.category})</em>
          <span class="expense-date">${new Date(expense.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
        <button class="delete-btn" data-id="${expense.id}">Delete</button>
      </li>
    `).join('');

    // Attach delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Delete this expense?')) {
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
    expensesList.innerHTML = '<li style="text-align:center; color:#dc3545; padding:20px;">Failed to load expenses. Please refresh.</li>';
    console.error('Load expenses error:', err);
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = 'login.html';
});