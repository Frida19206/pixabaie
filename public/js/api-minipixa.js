const BASE = 'https://mini-pixa-production-bs4miy.laravel.cloud/api';
const TOKEN_KEY = 'minipixa_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export function isLoggedIn() {
  return !!getToken();
}

async function request(endpoint, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* réponse vide */ }

  if (!res.ok) {
    let message = (data && data.message) || `Erreur ${res.status}`;
    if (data && data.errors) {
      message = Object.values(data.errors).flat().join(' ');
    }
    throw new Error(message);
  }
  return data;
}

export const minipixaApi = {
  register: (payload) => request('/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),
  getCategories: () => request('/categories'),
  getPhotos: (categoryId = '') => request(`/photos${categoryId ? `?category_id=${categoryId}` : ''}`),
  createPhoto: (formData) => request('/photos', { method: 'POST', body: formData }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/photos/${id}/like`, { method: 'POST' })
};
