import { minipixaApi, isLoggedIn, saveToken, clearToken } from './api-minipixa.js';

const USER_KEY = 'minipixa_user';
function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

const authBlock = document.getElementById('authBlock');
const publishBlock = document.getElementById('publishBlock');
const userBadge = document.getElementById('classeUserBadge');
const galleryEl = document.getElementById('classeGallery');
const emptyEl = document.getElementById('classeEmptyMessage');
const loadingEl = document.getElementById('classeLoading');

const HEART_ICON = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.2C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.7C19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;

// Récupère le nom de l'utilisateur connecté depuis l'API (pour savoir quelles photos sont les siennes)
async function refreshCurrentUser() {
  if (!isLoggedIn()) return;
  try {
    const me = await minipixaApi.me();
    const user = me.data || me;
    saveUser(user);
    userBadge.textContent = `Connectée : ${user.name}`;
  } catch (err) {
    console.error(err);
  }
}

function updateAuthUI() {
  if (isLoggedIn()) {
    authBlock.hidden = true;
    publishBlock.hidden = false;
    const user = getUser();
    userBadge.textContent = user ? `Connectée : ${user.name}` : '';
  } else {
    authBlock.hidden = false;
    publishBlock.hidden = true;
    userBadge.textContent = '';
  }
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
    if (data.user) saveUser(data.user);
    updateAuthUI();
    await refreshCurrentUser();
    loadPublishCategories();
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
    if (data.user) saveUser(data.user);
    updateAuthUI();
    await refreshCurrentUser();
    loadPublishCategories();
  } catch (err) {
    authError.textContent = err.message;
    authError.hidden = false;
  }
});

document.getElementById('logoutClasseBtn').addEventListener('click', async () => {
  try { await minipixaApi.logout(); } catch (e) { /* on déconnecte localement de toute façon */ }
  clearToken();
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
});

// --- Publication ---
const publishForm = document.getElementById('publishForm');
const publishError = document.getElementById('publishError');
const categorySelect = document.getElementById('publishCategory');

async function loadPublishCategories() {
  try {
    const categories = await minipixaApi.getCategories();
    const list = Array.isArray(categories) ? categories : (categories.data || []);
    categorySelect.innerHTML = list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

publishForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  publishError.hidden = true;

  const formData = new FormData();
  formData.append('title', document.getElementById('publishTitle').value.trim());
  formData.append('category_id', categorySelect.value);
  formData.append('image', document.getElementById('publishFile').files[0]);

  try {
    await minipixaApi.createPhoto(formData);
    publishForm.reset();
    loadClassePhotos();
  } catch (err) {
    publishError.textContent = err.message;
    publishError.hidden = false;
  }
});

// --- Galerie ---
async function loadClassePhotos() {
  try {
    const photos = await minipixaApi.getPhotos();
    loadingEl.hidden = true;

    if (!photos || photos.length === 0) {
      galleryEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    const currentUser = getUser();

    galleryEl.innerHTML = photos.map(p => {
      const isOwner = currentUser && currentUser.name === p.publisher;
      return `
      <article class="card" data-id="${p.id}">
        <div class="card-header">
          <div class="avatar avatar-sm">${(p.publisher || '?').charAt(0).toUpperCase()}</div>
          <div class="card-user">
            <p class="card-username">${p.publisher}</p>
            ${p.category ? `<p class="card-category">${p.category}</p>` : ''}
          </div>
          ${isOwner ? `<button class="card-menu-btn delete-classe-btn" data-id="${p.id}" title="Supprimer">${TRASH_ICON}</button>` : ''}
        </div>
        <div class="card-media">
          <img src="${p.url}" alt="${p.title}" loading="lazy">
        </div>
        <p class="card-title">${p.title}</p>
        <div class="card-footer">
          <button class="like-btn ${p.is_liked ? 'liked' : ''}" data-id="${p.id}" ${isLoggedIn() ? '' : 'disabled'}>
            ${HEART_ICON} <span class="like-count">${p.likes_count}</span>
          </button>
        </div>
      </article>
    `;
    }).join('');

    galleryEl.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => handleLike(btn));
    });
    galleryEl.querySelectorAll('.delete-classe-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteClasse(btn));
    });
  } catch (err) {
    loadingEl.textContent = 'Erreur de chargement : ' + err.message;
  }
}

async function handleDeleteClasse(btn) {
  if (!confirm('Supprimer cette photo ?')) return;
  try {
    await minipixaApi.deletePhoto(btn.dataset.id);
    loadClassePhotos();
  } catch (err) {
    alert(err.message);
  }
}

async function handleLike(btn) {
  if (!isLoggedIn()) return;
  const id = btn.dataset.id;
  try {
    const result = await minipixaApi.toggleLike(id);
    const liked = result.liked !== undefined ? result.liked : !btn.classList.contains('liked');
    const countEl = btn.querySelector('.like-count');
    let count = parseInt(countEl.textContent, 10);
    count = liked ? count + 1 : count - 1;
    btn.classList.toggle('liked', liked);
    btn.innerHTML = `${HEART_ICON} <span class="like-count">${count}</span>`;
  } catch (err) {
    alert(err.message);
  }
}

updateAuthUI();
if (isLoggedIn()) {
  refreshCurrentUser();
  loadPublishCategories();
}
loadClassePhotos();
