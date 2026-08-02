import { api } from './api.js';
import { saveSession } from './auth.js';

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await api.login({ email, password });
    saveSession(data.token, data.user);
    window.location.href = 'index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
