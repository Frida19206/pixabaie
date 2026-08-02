import { api } from './api.js';
import { isLoggedIn } from './auth.js';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    ['an', 31536000], ['mois', 2592000], ['jour', 86400],
    ['heure', 3600], ['minute', 60]
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      const plural = label !== 'mois' && count > 1 ? 's' : '';
      return `il y a ${count} ${label}${plural}`;
    }
  }
  return "à l'instant";
}

async function loadNotifications() {
  const badge = document.getElementById('notifBadge');
  const dropdown = document.getElementById('notifDropdown');
  if (!badge || !dropdown) return;

  try {
    const notifications = await api.getNotifications();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    badge.textContent = unreadCount;
    badge.hidden = unreadCount === 0;

    if (notifications.length === 0) {
      dropdown.innerHTML = '<p class="notif-empty">Aucune notification pour le moment.</p>';
      return;
    }

    const heartIcon = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.2C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.7C19.5 16.4 12 21 12 21z"/></svg>`;

    dropdown.innerHTML = '<h4>Notifications</h4>' + notifications.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-thumb-wrap">
          ${n.filename ? `<img src="/uploads/${n.filename}" alt="" class="notif-thumb">` : ''}
          <span class="notif-heart-badge">${heartIcon}</span>
        </div>
        <div class="notif-text">
          <p>${n.message}</p>
          <span class="notif-time">${timeAgo(n.created_at)}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    dropdown.innerHTML = '<p class="notif-empty">Erreur de chargement.</p>';
  }
}

export function initNotifications() {
  if (!isLoggedIn()) return;

  const notifBtn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  if (!notifBtn || !dropdown) return;

  loadNotifications();
  setInterval(loadNotifications, 30000); // rafraîchit toutes les 30s

  notifBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;

    if (!dropdown.hidden) {
      await api.markAllNotificationsRead();
      document.getElementById('notifBadge').hidden = true;
      dropdown.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    }
  });

  document.addEventListener('click', () => {
    dropdown.hidden = true;
  });
}
