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

const heroImage = document.getElementById('heroImage');
if (heroImage) {
  const showPlaceholderIfBroken = () => {
    if (heroImage.complete && heroImage.naturalWidth === 0) {
      heroImage.closest('.hero-image-frame')?.classList.add('is-placeholder');
    }
  };
  heroImage.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
}
