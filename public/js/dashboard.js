const expenseForm = document.getElementById('expenseForm');
const expensesList = document.getElementById('expensesList');
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const premiumBtn = document.getElementById('premiumBtn');

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token || !userStr) {
  window.location.href = '/login.html';
}

const userObj = JSON.parse(userStr);

axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      showMessage('Session expired. Logging out...', '#dc3545');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setTimeout(() => window.location.href = '/login.html', 2000);
    }
    return Promise.reject(error);
  }
);

if (userObj.isPremium) {
  premiumBtn.style.display = 'none';
} else {
  premiumBtn.style.display = 'block';
}

if (userObj.isPremium && performance.navigation.type !== 1) {
  showMessage('Welcome to Premium! 🎉', '#28a745');
  setTimeout(() => { messageEl.textContent = ''; }, 6000);
}

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order_id');
if (orderId) {
  showMessage('Verifying payment...', '#007bff');
  axios.get(`/api/payments/status/${orderId}`)
    .then(() => {
      localStorage.setItem('user', JSON.stringify({ ...userObj, isPremium: true }));
      window.location.href = '/dashboard.html';  // ← FIXED: Redirect to clean URL (no query) – stops loop/flicker
    })
    .catch(() => {
      showMessage('Payment verification failed.', '#dc3545');
    });
}

premiumBtn.addEventListener('click', async () => {
  showMessage('Creating premium order...', '#007bff');

  try {
    const response = await axios.post('/api/payments/pay', { userId: userObj.id });
    const cashfree = Cashfree({ mode: "sandbox" });
    cashfree.checkout({
      paymentSessionId: response.data.paymentSessionId,
      returnUrl: `http://localhost:5000/dashboard.html?order_id=${response.data.orderId}`
    }).then(() => {
      showMessage('Redirecting to payment...', '#007bff');
    });
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to create order', '#dc3545');
  }
});

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    amount: expenseForm.amount.value,
    description: expenseForm.description.value,
    category: expenseForm.category.value
  };

  try {
    await axios.post('/api/expenses/add', data);
    expenseForm.reset();
    showMessage('Expense added successfully!', '#28a745');
    loadExpenses();
  } catch (error) {
    console.error('Add expense error:', error.response || error);
    showMessage(error.response?.data?.message || 'Failed to add expense', '#dc3545');
  }
});

async function loadExpenses() {
  try {
    const response = await axios.get('/api/expenses');
    const expenses = response.data.expenses || [];

    if (expenses.length === 0) {
      expensesList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">No expenses yet.</li>';
      return;
    }

    expensesList.innerHTML = expenses.map(expense => `
      <li class="expense-item">
        <div class="expense-details">
          <strong>₹${Number(expense.amount).toFixed(2)}</strong> - ${expense.description} 
          <em>(${expense.category})</em>
          <span class="expense-date">${new Date(expense.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
        <button class="delete-btn" data-id="${expense.id}">Delete</button>
      </li>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Delete expense?')) {
          try {
            await axios.delete(`/api/expenses/${id}`);
            loadExpenses();
          } catch (err) {
            console.error('Delete error:', err);
            alert('Delete failed');
          }
        }
      });
    });
  } catch (err) {
    console.error('Load expenses error:', err.response || err);
    expensesList.innerHTML = '<li style="text-align:center; color:#dc3545; padding:20px;">Failed to load expenses.</li>';
  }
}

loadExpenses();

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = '/login.html';
});

function showMessage(text, color = '#dc3545') {
  messageEl.textContent = text;
  messageEl.style.color = color;
  setTimeout(() => { messageEl.textContent = ''; }, 3000);
}