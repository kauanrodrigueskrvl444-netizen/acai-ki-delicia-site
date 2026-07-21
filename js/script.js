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

const heroVideo = document.getElementById('heroImage');
if (heroVideo) {
  const showPlaceholderIfBroken = () => {
    if (heroVideo.error) {
      heroVideo.closest('.hero-image-frame')?.classList.add('is-placeholder');
    }
  };
  heroVideo.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
}
