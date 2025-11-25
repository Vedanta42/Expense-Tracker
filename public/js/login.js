document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');

  // Clear previous message
  messageEl.textContent = '';
  
  // Basic client-side validation
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

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Login successful! Redirecting...';

    // Redirect to dashboard after success
    setTimeout(() => {
      window.location.href = 'dashboard.html'; // We'll create this next
    }, 1500);

  } catch (error) {
    messageEl.style.color = '#dc3545';
    
    // Security best practice: Same message for user not found OR wrong password
    const errorMsg = error.response?.data?.message || 'Invalid credentials. Please try again.';
    messageEl.textContent = errorMsg;
  }
});