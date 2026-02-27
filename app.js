// ─── THEME SYSTEM ───
const html = document.documentElement;
const toggle = document.getElementById('themeToggle');
const iconDark = document.getElementById('icon-dark');
const iconLight = document.getElementById('icon-light');

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('apl-theme', theme);
  if (theme === 'light') {
    toggle.classList.add('light-on');
    iconLight.classList.add('active');
    iconDark.classList.remove('active');
  } else {
    toggle.classList.remove('light-on');
    iconDark.classList.add('active');
    iconLight.classList.remove('active');
  }
}

function toggleTheme() {
  const current = html.getAttribute('data-theme') || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

const saved = localStorage.getItem('apl-theme');
applyTheme(saved || getSystemTheme());

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  if (!localStorage.getItem('apl-theme')) applyTheme(e.matches ? 'light' : 'dark');
});

// ─── Timeline switcher ───
function switchYear(year) {
  document.querySelectorAll('.tl-year-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tl-panel').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('panel-' + year).classList.add('active');
}

// ─── Feature tabs ───
function switchTab(tab) {
  document.querySelectorAll('.feat-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.feat-content').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

// ─── FAQ toggle ───
function toggleFaq(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

// ─── Scroll reveal ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.reveal').forEach((child, i) => {
        child.style.transitionDelay = (i * 0.08) + 's';
        child.classList.add('visible');
      });
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ─── Active nav on scroll ───
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const y = window.scrollY + 80;
  sections.forEach(sec => {
    if (y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight) {
      document.querySelectorAll('nav a').forEach(a => a.style.color = '');
      const link = document.querySelector(`nav a[href="#${sec.id}"]`);
      if (link) link.style.color = 'var(--accent)';
    }
  });
});

// ─── Language dropdown ───
function toggleLangDropdown() {
  document.getElementById('langDropdown').classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-switcher')) {
    document.getElementById('langDropdown').classList.remove('open');
  }
});
