import { renderNavLinks } from './auth.js';
import { initNotifications } from './notifications.js';
import { loadCategories, loadImages } from './gallery.js';

renderNavLinks();
initNotifications();
loadCategories();
loadImages();

// Recherche par titre, sans rechargement de page (debounce 350ms)
const searchInput = document.getElementById('searchInput');
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const activeCat = document.querySelector('.cat-btn.active');
    const ownId = activeCat ? (activeCat.dataset.ownId || '') : '';
    const classeId = activeCat ? (activeCat.dataset.classeId || '') : '';
    loadImages({ ownId, classeId }, searchInput.value.trim());
  }, 350);
});
