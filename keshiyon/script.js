// The rules page uses native HTML for navigation and FAQ accordions.
// Keep a small enhancement that marks the currently viewed section in the nav.
(() => {
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !navLinks.length) return;
  const byId = new Map(navLinks.map(link => [link.getAttribute('href').slice(1), link]));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      const active = byId.get(entry.target.id);
      if (active) active.setAttribute('aria-current', 'location');
    }
  }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
})();
