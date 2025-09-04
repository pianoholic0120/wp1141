// Smooth scroll helpers
const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Down arrow to first content section
const downBtn = document.getElementById('scrollDown');
downBtn?.addEventListener('click', () => scrollToId('about'));

// Copy email
const emailBtn = document.getElementById('copyEmail');
emailBtn?.addEventListener('click', async () => {
  const email = 'arthurlin0120@gmail.com';
  try {
    await navigator.clipboard.writeText(email);
    (emailBtn as HTMLButtonElement).title = 'Copied!';
  } catch (_) {
    // ignore
  }
});

// Nav click -> smooth scroll
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__item'));
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const id = link.dataset.target;
    if (id) scrollToId(id);
  });
});

// Observe sections to highlight the active nav item
const sectionIds = ['about','education','skills','experience','projects','extracurriculars'];
const sectionMap = new Map<string, HTMLElement>();
sectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionMap.set(id, el);
});

const setActive = (id: string) => {
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === id));
};

const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter(e => e.isIntersecting)
    .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));
  if (visible[0]) {
    const id = visible[0].target.id;
    setActive(id);
  }
}, { root: document.querySelector('.content'), threshold: 0.6 });

sectionMap.forEach(section => observer.observe(section));

// Skills: swap gray/color on hover via data attributes
document.querySelectorAll<HTMLLIElement>('.skill').forEach(item => {
  const img = item.querySelector('img');
  if (!img) return;
  const gray = img.getAttribute('data-gray') || '';
  const color = img.getAttribute('data-color') || '';
  item.addEventListener('mouseenter', () => { img.src = color; });
  item.addEventListener('mouseleave', () => { img.src = gray; });
});

// Back to top button
const backBtn = document.getElementById('backToTop');
const content = document.querySelector('.content');
const toggleBackBtn = () => {
  const scrolled = (content ? (content as HTMLElement).scrollTop : window.scrollY) > 400;
  backBtn?.classList.toggle('show', scrolled);
};
content?.addEventListener('scroll', toggleBackBtn);
window.addEventListener('scroll', toggleBackBtn);
backBtn?.addEventListener('click', () => scrollToId('hero'));


