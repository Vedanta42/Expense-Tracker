// public/js/dashboard.js
const expenseForm = document.getElementById('expenseForm');
const expensesList = document.getElementById('expensesList');
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const premiumBtn = document.getElementById('premiumBtn');
const premiumMessage = document.getElementById('premiumMessage');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardSection = document.getElementById('leaderboardSection');
const leaderboardList = document.getElementById('leaderboardList');

// Reports
const reportBtn = document.getElementById('reportBtn');
const reportSection = document.getElementById('reportSection');
const reportType = document.getElementById('reportType');
const reportContent = document.getElementById('reportContent');
const downloadBtn = document.getElementById('downloadBtn');

// Pagination controls
const paginationContainer = document.getElementById('pagination');
const rowsPerPageSelect = document.getElementById('rowsPerPage');

let currentPage = 1;
let currentLimit = 10; // default

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

// Load saved rows-per-page preference from localStorage
const savedLimit = localStorage.getItem(`expenseRowsPerPage_${userObj.id}`);
if (savedLimit) {
  currentLimit = parseInt(savedLimit);
  if (rowsPerPageSelect) rowsPerPageSelect.value = currentLimit;
}

// Show/Hide Premium Elements
if (userObj.isPremium) {
  premiumBtn.style.display = 'none';
  premiumMessage.style.display = 'block';
  leaderboardBtn.style.display = 'block';
  reportBtn.style.display = 'block';
  if (performance.navigation.type !== 1) {
    showMessage('Welcome to Premium! 🎉', '#28a745');
    setTimeout(() => { messageEl.textContent = ''; }, 6000);
  }
} else {
  premiumBtn.style.display = 'block';
  premiumMessage.style.display = 'none';
  leaderboardBtn.style.display = 'none';
  reportBtn.style.display = 'none';
  if (downloadBtn) downloadBtn.disabled = true;
}

// Payment verification from Cashfree redirect
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order_id');
if (orderId) {
  showMessage('Verifying payment...', '#007bff');
  axios.get(`/api/payments/status/${orderId}`)
    .then(() => {
      localStorage.setItem('user', JSON.stringify({ ...userObj, isPremium: true }));
      window.location.href = '/dashboard.html'; // Clean redirect
    })
    .catch(() => {
      showMessage('Payment verification failed.', '#dc3545');
    });
}

// Premium Buy Button
premiumBtn.addEventListener('click', async () => {
  showMessage('Creating premium order...', '#007bff');
  try {
    const response = await axios.post('/api/payments/pay', { userId: userObj.id });
    const cashfree = Cashfree({ mode: "sandbox" });
    cashfree.checkout({
      paymentSessionId: response.data.paymentSessionId,
      returnUrl: `http://localhost:5000/dashboard.html?order_id=${response.data.orderId}`
    });
  } catch (error) {
    showMessage('Failed to initiate payment', '#dc3545');
  }
});

// Rows per page selector change
if (rowsPerPageSelect) {
  rowsPerPageSelect.value = currentLimit;
  rowsPerPageSelect.addEventListener('change', (e) => {
    currentLimit = parseInt(e.target.value);
    localStorage.setItem(`expenseRowsPerPage_${userObj.id}`, currentLimit);
    currentPage = 1; // Reset to page 1 when limit changes
    loadExpenses(currentPage, currentLimit);
  });
}

// ==================== LOAD PAGINATED EXPENSES ====================
async function loadExpenses(page = 1, limit = currentLimit) {
  currentPage = page;

  try {
    const response = await axios.get(`/api/expenses?page=${page}&limit=${limit}`);
    const data = response.data;
    const expenses = data.expenses || [];
    const pagination = data.pagination;

    // If current page is empty after delete/change → go to last valid page
    if (expenses.length === 0 && currentPage > 1 && pagination.totalPages > 0) {
      loadExpenses(pagination.totalPages, limit);
      return;
    }

    if (expenses.length === 0) {
      expensesList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">No expenses yet.</li>';
    } else {
      expensesList.innerHTML = expenses.map(expense => `
        <li class="expense-item">
          <div class="expense-details">
            <strong>₹${Number(expense.amount).toFixed(2)}</strong> - ${expense.description}
            <em>(${expense.category})</em>
            <span class="expense-date">${new Date(expense.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          <button class="delete-btn" data-id="${expense.id}">Delete</button>
        </li>
      `).join('');

      // Attach delete listeners
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (confirm('Delete expense?')) {
            try {
              await axios.delete(`/api/expenses/${id}`);
              loadExpenses(currentPage, currentLimit);   // refresh current page
              loadAllExpenses();                         // refresh reports
            } catch (err) {
              console.error('Delete error:', err);
              alert('Delete failed');
            }
          }
        });
      });
    }

    renderPagination(pagination);
  } catch (err) {
    console.error('Load expenses error:', err);
    expensesList.innerHTML = '<li style="text-align:center; color:#dc3545; padding:20px;">Failed to load expenses.</li>';
  }
}

function renderPagination(pagination) {
  paginationContainer.innerHTML = '';
  if (!pagination || pagination.totalPages <= 1) return;

  // Previous
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.disabled = !pagination.hasPrevPage;
  prevBtn.onclick = () => loadExpenses(currentPage - 1, currentLimit);
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= pagination.totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === pagination.currentPage) btn.classList.add('active');
    btn.onclick = () => loadExpenses(i, currentLimit);
    paginationContainer.appendChild(btn);
  }

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = !pagination.hasNextPage;
  nextBtn.onclick = () => loadExpenses(currentPage + 1, currentLimit);
  paginationContainer.appendChild(nextBtn);
}

// ==================== FULL EXPENSES FOR REPORTS ====================
async function loadAllExpenses() {
  try {
    const response = await axios.get('/api/expenses'); // no page/limit → full list
    window.allExpenses = response.data.expenses || [];
  } catch (err) {
    console.error('Failed to load all expenses for reports');
  }
}

// ==================== ADD EXPENSE ====================
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = e.target.amount.value;
  const description = e.target.description.value;
  const category = e.target.category.value;

  try {
    await axios.post('/api/expenses/add', { amount, description, category });
    e.target.reset();
    showMessage('Expense added!', '#28a745');

    loadExpenses(1, currentLimit);   // new expense → page 1
    loadAllExpenses();               // update reports
  } catch (error) {
    console.error('Add expense error:', error.response || error);
    showMessage(error.response?.data?.message || 'Failed to add expense', '#dc3545');
  }
});

// ==================== REPORTS ====================
reportBtn.addEventListener('click', async () => {
  if (reportSection.style.display === 'block') {
    reportSection.style.display = 'none';
    reportBtn.textContent = 'Show Reports';
    return;
  }
  await loadAllExpenses();   // ensure full data
  generateReport();
  reportSection.style.display = 'block';
  reportBtn.textContent = 'Hide Reports';
});

reportType.addEventListener('change', generateReport);

function generateReport() {
  if (!window.allExpenses || window.allExpenses.length === 0) {
    reportContent.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No expenses to show in report.</p>';
    return;
  }
  const type = reportType.value;
  const sorted = [...window.allExpenses].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const groups = groupExpenses(sorted, type);

  let html = '';
  for (let key in groups) {
    html += `<h3>${key}</h3>`;
    html += buildTable(groups[key]);
    html += buildTotals(groups[key]);
  }
  html += '<h3>Summary</h3>';
  html += buildSummary(groups);
  reportContent.innerHTML = html;
}

function groupExpenses(exps, type) {
  const groups = {};
  exps.forEach(exp => {
    const date = new Date(exp.created_at);
    let key;
    if (type === 'daily') {
      key = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (type === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = `Week of ${weekStart.toLocaleDateString('en-IN')}`;
    } else if (type === 'monthly') {
      key = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
    } else {
      key = 'All Time';
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(exp);
  });
  return groups;
}

function buildTable(exps) {
  let html = '<table class="report-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Income</th><th>Expense</th></tr></thead><tbody>';
  exps.forEach(exp => {
    const date = new Date(exp.created_at).toLocaleDateString('en-IN');
    const income = exp.category === 'Salary' ? Number(exp.amount).toFixed(2) : '0.00';
    const expense = exp.category !== 'Salary' ? Number(exp.amount).toFixed(2) : '0.00';
    html += `<tr><td>${date}</td><td>${exp.description}</td><td>${exp.category}</td><td>₹${income}</td><td>₹${expense}</td></tr>`;
  });
  return html + '</tbody></table>';
}

function buildTotals(exps) {
  let totalIncome = 0, totalExpense = 0;
  exps.forEach(exp => {
    if (exp.category === 'Salary') totalIncome += parseFloat(exp.amount);
    else totalExpense += parseFloat(exp.amount);
  });
  const savings = totalIncome - totalExpense;
  return `<p style="font-weight:bold; margin:10px 0;">Total Income: ₹${totalIncome.toFixed(2)} | Expense: ₹${totalExpense.toFixed(2)} | Savings: ₹${savings.toFixed(2)}</p>`;
}

function buildSummary(groups) {
  let html = '<table class="report-table"><thead><tr><th>Period</th><th>Income</th><th>Expense</th><th>Savings</th></tr></thead><tbody>';
  let grandIncome = 0, grandExpense = 0;
  for (let key in groups) {
    let ti = 0, te = 0;
    groups[key].forEach(exp => {
      if (exp.category === 'Salary') ti += parseFloat(exp.amount);
      else te += parseFloat(exp.amount);
    });
    const ts = ti - te;
    html += `<tr><td>${key}</td><td>₹${ti.toFixed(2)}</td><td>₹${te.toFixed(2)}</td><td>₹${ts.toFixed(2)}</td></tr>`;
    grandIncome += ti;
    grandExpense += te;
  }
  const grandSavings = grandIncome - grandExpense;
  html += `<tr style="font-weight:bold;"><td>Total</td><td>₹${grandIncome.toFixed(2)}</td><td>₹${grandExpense.toFixed(2)}</td><td>₹${grandSavings.toFixed(2)}</td></tr>`;
  return html + '</tbody></table>';
}

// Download Report as CSV
downloadBtn.addEventListener('click', () => {
  if (!window.allExpenses || window.allExpenses.length === 0) {
    showMessage('No data to download', '#dc3545');
    return;
  }
  const type = reportType.value;
  const groups = groupExpenses(window.allExpenses, type);
  let csv = 'Expense Report\n\n';

  for (let key in groups) {
    csv += `${key}\n`;
    csv += 'Date,Description,Category,Income,Expense\n';
    groups[key].forEach(exp => {
      const date = new Date(exp.created_at).toLocaleDateString('en-IN');
      const income = exp.category === 'Salary' ? exp.amount : 0;
      const expense = exp.category !== 'Salary' ? exp.amount : 0;
      csv += `"${date}","${exp.description.replace(/"/g, '""')}","${exp.category}",${income},${expense}\n`;
    });

    let ti = 0, te = 0;
    groups[key].forEach(exp => {
      if (exp.category === 'Salary') ti += parseFloat(exp.amount);
      else te += parseFloat(exp.amount);
    });
    csv += `Totals,,${ti},${te},${ti - te}\n\n`;
  }

  csv += 'Summary\nPeriod,Income,Expense,Savings\n';
  let gi = 0, ge = 0;
  for (let key in groups) {
    let ti = 0, te = 0;
    groups[key].forEach(exp => {
      if (exp.category === 'Salary') ti += parseFloat(exp.amount);
      else te += parseFloat(exp.amount);
    });
    csv += `"${key}",${ti},${te},${ti - te}\n`;
    gi += ti;
    ge += te;
  }
  csv += `Total,${gi},${ge},${gi - ge}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `expense_report_${type}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// Leaderboard
leaderboardBtn.addEventListener('click', async () => {
  if (leaderboardSection.style.display === 'block') {
    leaderboardSection.style.display = 'none';
    leaderboardBtn.textContent = 'Show Leaderboard';
    return;
  }
  try {
    const response = await axios.get('/api/premium/leaderboard');
    const leaderboard = response.data;
    if (leaderboard.length === 0) {
      leaderboardList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">No users yet.</li>';
    } else {
      leaderboardList.innerHTML = leaderboard.map((user, index) => `
        <li class="expense-item leaderboard-item">
          <div class="expense-details">
            <strong>#${index + 1}: ${user.name}</strong> - Total: ₹${Number(user.total_expense || 0).toFixed(2)}
          </div>
        </li>
      `).join('');
    }
    leaderboardSection.style.display = 'block';
    leaderboardBtn.textContent = 'Hide Leaderboard';
  } catch (error) {
    console.error('Leaderboard error:', error);
    showMessage('Failed to load leaderboard', '#dc3545');
  }
});

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

// Initial load
loadExpenses(1, currentLimit);
loadAllExpenses();