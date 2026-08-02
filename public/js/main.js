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
    loadImages(activeCat ? activeCat.dataset.id : '', searchInput.value.trim());
  }, 350);
});
