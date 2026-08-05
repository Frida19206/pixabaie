import { api } from './api.js';
import { isLoggedIn, getUser, avatarHTML, resolveImageUrl } from './auth.js';

let currentCategory = '';
let currentSearch = '';
let lastImages = [];

const HEART_ICON = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.2C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.7C19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>`;
const KEBAB_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const PENCIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

// Rend une liste d'images dans le conteneur donné (galerie d'accueil OU galerie de profil)
export function renderImages(images, container, emptyMessage) {
  lastImages = images;

  if (images.length === 0) {
    container.innerHTML = '';
    if (emptyMessage) emptyMessage.hidden = false;
    return;
  }
  if (emptyMessage) emptyMessage.hidden = true;

  const currentUser = getUser();

  container.innerHTML = images.map(img => {
    const isOwner = currentUser && currentUser.id === img.user_id;
    const liked = img.liked_by_me == 1;
    const authorAvatar = avatarHTML(
      { username: img.username, avatar_filename: img.user_avatar },
      { sizeClass: 'avatar avatar-sm' }
    );

    return `
      <article class="card" data-id="${img.id}">
        <div class="card-header">
          <a class="card-author" href="profile.html?user=${encodeURIComponent(img.username)}">
            ${authorAvatar}
            <div class="card-user">
              <p class="card-username">${img.username}</p>
              ${img.category_name ? `<p class="card-category">${img.category_name}</p>` : ''}
            </div>
          </a>
          ${isOwner ? `
            <div class="card-menu-wrap">
              <button class="card-menu-btn" data-toggle-menu>${KEBAB_ICON}</button>
              <div class="card-menu-dropdown" hidden>
                <button class="dropdown-item edit-btn" data-id="${img.id}">${PENCIL_ICON} Modifier</button>
                <button class="dropdown-item danger delete-btn" data-id="${img.id}">${TRASH_ICON} Supprimer</button>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="card-media">
          <img src="${resolveImageUrl(img.filename)}" alt="${img.title}" loading="lazy">
        </div>

        <p class="card-title">${img.title}</p>

        <div class="card-footer">
          <button class="like-btn ${liked ? 'liked' : ''}" data-id="${img.id}">
            ${HEART_ICON} <span class="like-count">${img.likes_count}</span>
          </button>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => handleLike(btn));
  });
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn, container, emptyMessage));
  });
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const img = lastImages.find(i => i.id == btn.dataset.id);
      if (img) openEditModal(img, container, emptyMessage);
    });
  });
  container.querySelectorAll('[data-toggle-menu]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      container.querySelectorAll('.card-menu-dropdown').forEach(d => { if (d !== dropdown) d.hidden = true; });
      dropdown.hidden = !dropdown.hidden;
    });
  });
  document.addEventListener('click', () => {
    container.querySelectorAll('.card-menu-dropdown').forEach(d => { d.hidden = true; });
  });
}

async function handleLike(btn) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  const id = btn.dataset.id;
  try {
    const result = await api.toggleLike(id);
    const countEl = btn.querySelector('.like-count');
    let count = parseInt(countEl.textContent, 10);
    count = result.liked ? count + 1 : count - 1;

    btn.classList.toggle('liked', result.liked);
    btn.innerHTML = `${HEART_ICON} <span class="like-count">${count}</span>`;
  } catch (err) {
    alert(err.message);
  }
}

async function handleDelete(btn, container, emptyMessage) {
  if (!confirm('Supprimer cette photo ?')) return;
  try {
    await api.deleteImage(btn.dataset.id);
    lastImages = lastImages.filter(i => i.id != btn.dataset.id);
    renderImages(lastImages, container, emptyMessage);
  } catch (err) {
    alert(err.message);
  }
}

async function openEditModal(img, container, emptyMessage) {
  const categories = await api.getCategories();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Modifier la photo</h3>
      <label>Titre</label>
      <input type="text" id="editTitleInput" value="${img.title}">
      <label>Catégorie</label>
      <select id="editCategoryInput">
        <option value="">-- Aucune --</option>
        ${categories.map(c => `<option value="${c.id}" ${c.id === img.category_id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancelEditBtn">Annuler</button>
        <button class="btn btn-primary" id="saveEditBtn">Enregistrer</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#cancelEditBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#saveEditBtn').addEventListener('click', async () => {
    const title = overlay.querySelector('#editTitleInput').value.trim();
    const category_id = overlay.querySelector('#editCategoryInput').value;
    try {
      await api.updateImage(img.id, { title, category_id });
      close();
      if (container === document.getElementById('gallery')) {
        loadImages(currentCategory, currentSearch);
      } else {
        img.title = title;
        img.category_id = category_id ? Number(category_id) : null;
        const cat = categories.find(c => c.id == category_id);
        img.category_name = cat ? cat.name : null;
        renderImages(lastImages, container, emptyMessage);
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Recharge les données (fetch) et re-rend le DOM de la galerie d'accueil : pas de reload navigateur
export async function loadImages(categoryId = '', search = '') {
  currentCategory = categoryId;
  currentSearch = search;
  const gallery = document.getElementById('gallery');
  const emptyMessage = document.getElementById('emptyMessage');
  if (!gallery) return;

  try {
    const images = await api.getImages({ category: categoryId, search });
    renderImages(images, gallery, emptyMessage);
  } catch (err) {
    console.error(err);
  }
}

export async function loadCategories() {
  const bar = document.getElementById('categoriesBar');
  if (!bar) return;
  try {
    const categories = await api.getCategories();
    const buttons = categories.map(c => `<button class="cat-btn" data-id="${c.id}">${c.name}</button>`).join('');
    bar.insertAdjacentHTML('beforeend', buttons);

    bar.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadImages(btn.dataset.id, currentSearch); // filtre AJAX, aucun rechargement de page
      });
    });
  } catch (err) {
    console.error(err);
  }
}
