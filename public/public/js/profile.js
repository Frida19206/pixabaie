import { api } from './api.js';
import { renderNavLinks, getUser, isLoggedIn, avatarHTML, updateStoredUser } from './auth.js';
import { initNotifications } from './notifications.js';
import { renderImages } from './gallery.js';

renderNavLinks();
initNotifications();

const params = new URLSearchParams(window.location.search);
let targetUsername = params.get('user');

if (!targetUsername) {
  if (isLoggedIn()) {
    targetUsername = getUser().username;
  } else {
    window.location.href = 'login.html';
  }
}

const headerSection = document.getElementById('profileHeader');
const avatarWrap = document.getElementById('profileAvatarWrap');
const usernameEl = document.getElementById('profileUsername');
const bioEl = document.getElementById('profileBio');
const statsEl = document.getElementById('profileStats');
const editBtn = document.getElementById('editProfileBtn');
const galleryEl = document.getElementById('profileGallery');
const emptyMessageEl = document.getElementById('profileEmptyMessage');
const notFoundEl = document.getElementById('notFoundMessage');

function formatJoinDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
}

async function loadProfile() {
  let profile;
  try {
    profile = await api.getProfile(targetUsername);
  } catch (err) {
    headerSection.hidden = true;
    notFoundEl.hidden = false;
    return;
  }

  document.title = `${profile.username} - Pixabaie`;
  usernameEl.textContent = profile.username;
  bioEl.textContent = profile.bio || 'Aucune bio pour le moment.';
  bioEl.classList.toggle('placeholder', !profile.bio);

  avatarWrap.innerHTML = avatarHTML(
    { username: profile.username, avatar_filename: profile.avatar_filename },
    { sizeClass: 'avatar profile-avatar-lg' }
  );

  statsEl.innerHTML = `
    <span><strong>${profile.posts_count}</strong> publications</span>
    <span><strong>${profile.likes_received}</strong> likes reçus</span>
    <span>Membre depuis ${formatJoinDate(profile.created_at)}</span>
  `;

  const currentUser = getUser();
  const isOwnProfile = currentUser && currentUser.username === profile.username;
  editBtn.hidden = !isOwnProfile;
  if (isOwnProfile) {
    editBtn.onclick = () => openEditProfileModal(profile);
  }

  try {
    const images = await api.getImages({ userId: profile.id });
    renderImages(images, galleryEl, emptyMessageEl);
  } catch (err) {
    console.error(err);
  }
}

function openEditProfileModal(profile) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Modifier le profil</h3>

      <label>Photo de profil</label>
      <label class="dropzone dropzone-avatar" id="avatarDropzone">
        <div id="avatarPreviewWrap">${avatarHTML({ username: profile.username, avatar_filename: profile.avatar_filename }, { sizeClass: 'avatar profile-avatar-md' })}</div>
        <span class="dz-sub">Cliquez pour changer</span>
        <input type="file" id="avatarInput" accept="image/jpeg,image/png,image/webp">
      </label>

      <label for="bioInput">Bio</label>
      <textarea id="bioInput" maxlength="160" rows="3" placeholder="Parlez un peu de vous...">${profile.bio || ''}</textarea>

      <p id="modalError" class="error-box" hidden></p>

      <div class="modal-actions">
        <button class="btn btn-outline" id="cancelProfileBtn">Annuler</button>
        <button class="btn btn-primary" id="saveProfileBtn">Enregistrer</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#cancelProfileBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const avatarInput = overlay.querySelector('#avatarInput');
  const previewWrap = overlay.querySelector('#avatarPreviewWrap');
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewWrap.innerHTML = `<img src="${e.target.result}" class="avatar profile-avatar-md avatar-img" alt="Aperçu">`;
    };
    reader.readAsDataURL(file);
  });

  overlay.querySelector('#saveProfileBtn').addEventListener('click', async () => {
    const errorBox = overlay.querySelector('#modalError');
    errorBox.hidden = true;
    const bio = overlay.querySelector('#bioInput').value.trim();

    try {
      if (avatarInput.files[0]) {
        const formData = new FormData();
        formData.append('avatar', avatarInput.files[0]);
        const avatarResult = await api.uploadAvatar(formData);
        updateStoredUser({ avatar_filename: avatarResult.avatar_filename });
      }
      await api.updateProfile({ bio });
      updateStoredUser({ bio });

      close();
      renderNavLinks();
      loadProfile();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  });
}

loadProfile();
