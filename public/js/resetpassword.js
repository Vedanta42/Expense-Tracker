document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value.trim();
  const messageEl = document.getElementById('message');

  messageEl.textContent = '';

  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('requestId');

  if (!requestId) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = 'Invalid reset link';
    return;
  }

  if (!newPassword) {
    messageEl.style.color = '#dc3545';
    messageEl.textContent = 'Please enter a new password';
    return;
  }

  try {
    const response = await axios.post('/password/updatepassword', {
      requestId,
      newPassword
    });

    messageEl.style.color = '#28a745';
    messageEl.textContent = 'Password updated! Redirecting to login...';

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);

  } catch (error) {
    messageEl.style.color = '#dc3545';
    const errorMsg = error.response?.data?.message || 'Failed to update password. Please try again.';
    messageEl.textContent = errorMsg;
  }
});