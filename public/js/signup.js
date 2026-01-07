document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const messageEl = document.getElementById('message');

  try {
    const response = await axios.post('/api/auth/signup', {  // Relative
      name,
      email,
      password
    });

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Account created successfully! Redirecting...';

    setTimeout(() => {
      window.location.href = '/login.html';  // Relative
    }, 2000);

  } catch (error) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = error.response?.data?.message || 'Signup failed. Please try again.';
  }
});