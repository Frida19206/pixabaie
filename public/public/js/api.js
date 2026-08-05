const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('pixabaie_token');
}

async function request(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue.');
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  getCategories: () => request('/categories'),

  getImages: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    if (opts.userId) params.set('userId', opts.userId);
    if (opts.search) params.set('search', opts.search);
    const qs = params.toString();
    return request(`/images${qs ? `?${qs}` : ''}`);
  },
  createImage: (formData) => request('/images', { method: 'POST', body: formData }),
  updateImage: (id, payload) => request(`/images/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteImage: (id) => request(`/images/${id}`, { method: 'DELETE' }),

  toggleLike: (id) => request(`/likes/${id}`, { method: 'POST' }),

  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  getProfile: (username) => request(`/users/${encodeURIComponent(username)}`),
  updateProfile: (payload) => request('/users/me', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadAvatar: (formData) => request('/users/me/avatar', { method: 'POST', body: formData })
};
