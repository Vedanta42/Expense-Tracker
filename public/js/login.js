document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');

  messageEl.textContent = '';

  if (!email || !password) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });

    // Store token and user for secure requests
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Login successful! Redirecting...';

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);

  } catch (error) {
    messageEl.style.color = '#dc3545';
    const errorMsg = error.response?.data?.message || 'Invalid credentials. Please try again.';
    messageEl.textContent = errorMsg;
  }
});