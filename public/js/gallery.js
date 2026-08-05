import { api } from './api.js';
import { isLoggedIn, getUser, avatarHTML, resolveImageUrl } from './auth.js';
import { minipixaApi, isLoggedIn as isClasseLoggedIn, getStoredUser as getClasseUser } from './api-minipixa.js';

let currentFilter = { ownId: '', classeId: '' };
let currentSearch = '';
let lastImages = [];

const HEART_ICON = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.2C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.7C19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>`;
const KEBAB_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const PENCIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

// Rend une liste d'images (personnelles et/ou de la classe) dans le conteneur donné
export function renderImages(images, container, emptyMessage) {
  lastImages = images;

  if (images.length === 0) {
    container.innerHTML = '';
    if (emptyMessage) emptyMessage.hidden = false;
    return;
  }
  if (emptyMessage) emptyMessage.hidden = true;

  const currentUser = getUser();
  const classeUser = getClasseUser();

  container.innerHTML = images.map(img => {
    const isClasse = img.source === 'classe';
    const isOwner = isClasse
      ? (classeUser && classeUser.name === img.username)
      : (currentUser && currentUser.id === img.user_id);
    const liked = img.liked_by_me == 1;
    const authorAvatar = avatarHTML(
      { username: img.username, avatar_filename: img.user_avatar },
      { sizeClass: 'avatar avatar-sm' }
    );

    return `
      <article class="card" data-id="${img.id}" data-source="${img.source}">
        <div class="card-header">
          <a class="card-author" href="${isClasse ? '#' : `profile.html?user=${encodeURIComponent(img.username)}`}" ${isClasse ? 'onclick="return false;"' : ''}>
            ${authorAvatar}
            <div class="card-user">
              <p class="card-username">${img.username}</p>
              <p class="card-category">${img.category_name || ''}${isClasse ? ' · classe' : ''}</p>
            </div>
          </a>
          ${isOwner ? `
            <div class="card-menu-wrap">
              <button class="card-menu-btn" data-toggle-menu>${KEBAB_ICON}</button>
              <div class="card-menu-dropdown" hidden>
                ${!isClasse ? `<button class="dropdown-item edit-btn" data-id="${img.id}">${PENCIL_ICON} Modifier</button>` : ''}
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

function findImage(id) {
  return lastImages.find(i => i.id == id);
}

async function handleLike(btn) {
  const img = findImage(btn.dataset.id);
  if (!img) return;
  const isClasse = img.source === 'classe';

  if (isClasse) {
    if (!isClasseLoggedIn()) {
      alert("Connectez-vous sur la page \"Photos de la classe\" pour liker les photos de vos camarades.");
      return;
    }
  } else if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const result = isClasse
      ? await minipixaApi.toggleLike(img.realId)
      : await api.toggleLike(img.id);

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

async function handleDelete(btn, container, emptyMessage) {
  const img = findImage(btn.dataset.id);
  if (!img) return;
  if (!confirm('Supprimer cette photo ?')) return;

  try {
    if (img.source === 'classe') {
      await minipixaApi.deletePhoto(img.realId);
    } else {
      await api.deleteImage(img.id);
    }
    lastImages = lastImages.filter(i => i.id != img.id);
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
        loadImages(currentFilter, currentSearch);
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

// Recharge les photos personnelles ET les photos de la classe, fusionnées en un seul flux (accueil uniquement)
// filter peut être une chaîne (rétro-compatibilité) ou { ownId, classeId }
export async function loadImages(filter = {}, search = '') {
  const { ownId = '', classeId = '' } = typeof filter === 'string' ? { ownId: filter, classeId: filter } : filter;
  currentFilter = { ownId, classeId };
  currentSearch = search;

  const gallery = document.getElementById('gallery');
  const emptyMessage = document.getElementById('emptyMessage');
  if (!gallery) return;

  try {
    const ownImages = await api.getImages({ category: ownId, search });
    const tagged = ownImages.map(img => ({ ...img, source: 'pixabaie' }));

    let classeImages = [];
    try {
      const classePhotos = await minipixaApi.getPhotos(classeId);
      const filtered = search
        ? classePhotos.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
        : classePhotos;

      classeImages = filtered.map(p => ({
        id: `classe-${p.id}`,
        realId: p.id,
        title: p.title,
        filename: p.url,
        username: p.publisher,
        category_name: p.category,
        likes_count: p.likes_count,
        liked_by_me: p.is_liked ? 1 : 0,
        source: 'classe'
      }));
    } catch (err) {
      console.error('Erreur chargement photos de la classe :', err);
    }

    // Mélange les deux flux façon fil d'actualité (au lieu de tout coller à la suite)
    const merged = [...tagged, ...classeImages].sort(() => Math.random() - 0.5);
    renderImages(merged, gallery, emptyMessage);
  } catch (err) {
    console.error(err);
  }
}

// Fusionne les catégories des deux APIs par nom (insensible à la casse), pour un seul filtre synchronisé
export async function loadCategories() {
  const bar = document.getElementById('categoriesBar');
  if (!bar) return;
  try {
    const [ownCats, classCatsRaw] = await Promise.all([
      api.getCategories(),
      minipixaApi.getCategories().catch(() => [])
    ]);
    const classCats = Array.isArray(classCatsRaw) ? classCatsRaw : (classCatsRaw.data || []);

    const merged = {};
    ownCats.forEach(c => {
      const key = c.name.trim().toLowerCase();
      merged[key] = merged[key] || { name: c.name };
      merged[key].ownId = c.id;
    });
    classCats.forEach(c => {
      const key = c.name.trim().toLowerCase();
      merged[key] = merged[key] || { name: c.name };
      merged[key].classeId = c.id;
    });

    const buttons = Object.values(merged).map(c => `
      <button class="cat-btn" data-own-id="${c.ownId || ''}" data-classe-id="${c.classeId || ''}">${c.name}</button>
    `).join('');
    bar.insertAdjacentHTML('beforeend', buttons);

    bar.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadImages({ ownId: btn.dataset.ownId || '', classeId: btn.dataset.classeId || '' }, currentSearch);
      });
    });
  } catch (err) {
    console.error(err);
  }
}
