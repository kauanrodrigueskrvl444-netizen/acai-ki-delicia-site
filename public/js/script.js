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
      video.closest('.hero-image-frame, .launch-card-media')?.classList.add('is-placeholder');
    }
  };
  video.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
});
