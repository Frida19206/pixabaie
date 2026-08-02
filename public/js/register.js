import { api } from './api.js';
import { saveSession } from './auth.js';

const form = document.getElementById('registerForm');
const errorBox = document.getElementById('errorBox');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    errorBox.textContent = 'Les mots de passe ne correspondent pas.';
    errorBox.hidden = false;
    return;
  }

  try {
    const data = await api.register({ username, email, password });
    saveSession(data.token, data.user);
    window.location.href = 'index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
