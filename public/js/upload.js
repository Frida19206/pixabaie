import { api } from './api.js';
import { isLoggedIn, renderNavLinks } from './auth.js';

renderNavLinks();

// Protection de la page : réservée aux utilisateurs connectés
if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const form = document.getElementById('uploadForm');
const errorBox = document.getElementById('errorBox');
const categorySelect = document.getElementById('category');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('imageFile');
const previewImg = document.getElementById('previewImg');
const dzIcon = document.getElementById('dzIcon');
const dzTitle = document.getElementById('dzTitle');
const dzSub = document.getElementById('dzSub');

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

// Glisser-déposer sur la zone
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

async function loadCategoryOptions() {
  try {
    const categories = await api.getCategories();
    categorySelect.innerHTML = '<option value="">-- Choisir une catégorie --</option>' +
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}
loadCategoryOptions();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const file = document.getElementById('imageFile').files[0];
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
    await api.createImage(formData);
    window.location.href = 'index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
