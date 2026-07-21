const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('video[data-video-fallback]').forEach((video) => {
  const showPlaceholderIfBroken = () => {
    if (video.error) {
      video.closest('.hero-image-frame, .launch-card-media, .feature-card-media')?.classList.add('is-placeholder');
    }
  };
  video.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
});

const menuFilters = document.getElementById('menuFilters');
if (menuFilters) {
  const categories = document.querySelectorAll('.menu-category');

  menuFilters.addEventListener('click', (event) => {
    const button = event.target.closest('.menu-filter');
    if (!button) return;

    menuFilters.querySelectorAll('.menu-filter').forEach((btn) => {
      btn.classList.toggle('is-active', btn === button);
    });

    const filter = button.dataset.filter;
    categories.forEach((category) => {
      const matches = filter === 'todos' || category.dataset.category === filter;
      category.classList.toggle('is-hidden', !matches);
    });
  });
}
