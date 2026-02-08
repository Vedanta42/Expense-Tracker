document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageEl = document.getElementById('message');

  messageEl.textContent = '';

  if (!email || !password) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const response = await axios.post('/api/auth/login', {  // Relative
      email,
      password
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Login successful! Redirecting...';

    setTimeout(() => {
      window.location.href = '/dashboard.html';  // Relative
    }, 1500);

  } catch (error) {
    messageEl.style.color = '#dc3545';
    const errorMsg = error.response?.data?.message || 'Invalid credentials. Please try again.';
    messageEl.textContent = errorMsg;
  }
});

// Forgot Password Logic
const loginSection = document.querySelector('.container > .auth-box');  // First auth-box (login)
const forgotSection = document.getElementById('forgotPasswordSection');
const forgotLink = document.getElementById('forgotPasswordLink');
const backLink = document.getElementById('backToLoginLink');
const forgotForm = document.getElementById('forgotPasswordForm');
const forgotMessage = document.getElementById('forgotMessage');

forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginSection.style.display = 'none';
  forgotSection.style.display = 'block';
});

backLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotSection.style.display = 'none';
  loginSection.style.display = 'block';
});

forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('forgotEmail').value.trim();
  forgotMessage.textContent = '';

  if (!email) {
    forgotMessage.style.color = '#dc3545';
    forgotMessage.textContent = 'Email required';
    return;
  }

  try {
    const response = await axios.post('/password/forgotpassword', { email });

    forgotMessage.style.color = '#28a745';
    forgotMessage.textContent = 'Reset email sent! Check your inbox.';

    setTimeout(() => {
      forgotSection.style.display = 'none';
      loginSection.style.display = 'block';
    }, 3000);

  } catch (error) {
    forgotMessage.style.color = '#dc3545';
    const errorMsg = error.response?.data?.message || 'Failed to send reset email.';
    forgotMessage.textContent = errorMsg;
  }
});