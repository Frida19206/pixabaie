const TOKEN_KEY = 'pixabaie_token';
const USER_KEY = 'pixabaie_user';

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function updateStoredUser(partialUser) {
  const user = { ...getUser(), ...partialUser };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

// Génère le HTML d'un avatar : photo si disponible, sinon initiale sur fond dégradé
export function avatarHTML(user, { sizeClass = 'avatar', id = '', extraAttrs = '' } = {}) {
  const idAttr = id ? `id="${id}"` : '';
  const initial = (user.username || '?').charAt(0).toUpperCase();

  if (user.avatar_filename) {
    return `<img src="/uploads/avatars/${user.avatar_filename}" class="${sizeClass} avatar-img" alt="${user.username}" ${idAttr} ${extraAttrs}>`;
  }
  return `<div class="${sizeClass}" ${idAttr} ${extraAttrs}>${initial}</div>`;
}

const ICONS = {
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

// Construit dynamiquement le menu de navigation selon l'état de connexion
export function renderNavLinks() {
  const nav = document.getElementById('navLinks');
  if (!nav) return;

  if (isLoggedIn()) {
    const user = getUser();

    nav.innerHTML = `
      <button id="notifBtn" class="icon-btn" title="Notifications">
        ${ICONS.bell}<span id="notifBadge" class="badge" hidden>0</span>
      </button>
      <div id="notifDropdown" class="notif-dropdown" hidden></div>

      <a href="upload.html" class="icon-btn icon-btn-accent" title="Publier une photo">${ICONS.plus}</a>

      <div class="profile-menu-wrap">
        ${avatarHTML(user, { id: 'profileBtn', extraAttrs: `title="${user.username}"` })}
        <div class="profile-dropdown" id="profileDropdown" hidden>
          <p class="username-full">${user.username}</p>
          <a class="dropdown-item" href="profile.html?user=${encodeURIComponent(user.username)}">${ICONS.user} Mon profil</a>
          <button class="dropdown-item danger" id="logoutBtn">${ICONS.logout} Déconnexion</button>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', logout);

    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.hidden = !profileDropdown.hidden;
    });
    document.addEventListener('click', () => { profileDropdown.hidden = true; });
  } else {
    nav.innerHTML = `
      <a href="login.html" class="btn btn-outline">Connexion</a>
      <a href="register.html" class="btn btn-primary">Créer un compte</a>
    `;
  }
}
