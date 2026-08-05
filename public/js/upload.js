import { renderNavLinks } from './auth.js';
import { minipixaApi, isLoggedIn, saveToken, clearToken, getStoredUser, saveStoredUser } from './api-minipixa.js';

renderNavLinks();

const classeAuthBlock = document.getElementById('classeAuthBlock');
const uploadForm = document.getElementById('uploadForm');

function showPublishForm() {
  classeAuthBlock.hidden = true;
  uploadForm.hidden = false;
  loadCategoryOptions();
}
function showAuthForm() {
  classeAuthBlock.hidden = false;
  uploadForm.hidden = true;
}

if (isLoggedIn()) {
  showPublishForm();
} else {
  showAuthForm();
}

// --- Onglets connexion / inscription ---
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginFormClasse');
const registerForm = document.getElementById('registerFormClasse');
const authError = document.getElementById('authError');

tabLogin.addEventListener('click', () => {
  tabLogin.className = 'btn btn-primary';
  tabRegister.className = 'btn btn-outline';
  loginForm.hidden = false;
  registerForm.hidden = true;
  authError.hidden = true;
});
tabRegister.addEventListener('click', () => {
  tabRegister.className = 'btn btn-primary';
  tabLogin.className = 'btn btn-outline';
  registerForm.hidden = false;
  loginForm.hidden = true;
  authError.hidden = true;
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.hidden = true;
  try {
    const data = await minipixaApi.login({
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    });
    saveToken(data.token || data.access_token);
    if (data.user) saveStoredUser(data.user);
    showPublishForm();
  } catch (err) {
    authError.textContent = err.message;
    authError.hidden = false;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.hidden = true;
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerPasswordConfirm').value;
  if (password !== confirm) {
    authError.textContent = 'Les mots de passe ne correspondent pas.';
    authError.hidden = false;
    return;
  }
  try {
    const data = await minipixaApi.register({
      name: document.getElementById('registerName').value.trim(),
      email: document.getElementById('registerEmail').value.trim(),
      password,
      password_confirmation: confirm
    });
    saveToken(data.token || data.access_token);
    if (data.user) saveStoredUser(data.user);
    showPublishForm();
  } catch (err) {
    authError.textContent = err.message;
    authError.hidden = false;
  }
});

// --- Publication ---
const errorBox = document.getElementById('errorBox');
const categorySelect = document.getElementById('category');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('imageFile');
const previewImg = document.getElementById('previewImg');
const dzIcon = document.getElementById('dzIcon');
const dzTitle = document.getElementById('dzTitle');
const dzSub = document.getElementById('dzSub');

async function loadCategoryOptions() {
  try {
    const categories = await minipixaApi.getCategories();
    const list = Array.isArray(categories) ? categories : (categories.data || []);
    categorySelect.innerHTML = list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

function showPreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.hidden = false;
    dzIcon.hidden = true;
    dzTitle.textContent = file.name;
    dzSub.textContent = 'Cliquez pour changer de photo';
  };
  reader.readAsDataURL(file);
}

fileInput.addEventListener('change', () => showPreview(fileInput.files[0]));

['dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => e.preventDefault());
});
dropzone.addEventListener('dragover', () => dropzone.classList.add('drag-over'));
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', (e) => {
  dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    showPreview(file);
  }
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const file = fileInput.files[0];
  if (!file) {
    errorBox.textContent = 'Veuillez sélectionner une image.';
    errorBox.hidden = false;
    return;
  }

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value.trim());
  formData.append('category_id', categorySelect.value);
  formData.append('image', file);

  try {
    await minipixaApi.createPhoto(formData);
    window.location.href = 'index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
