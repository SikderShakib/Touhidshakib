/* Shared helpers for the storefront and the admin panel. */
(function () {
  'use strict';

  const ICONS = {
    search:
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
    'arrow-up-right': '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/>',
    eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/>',
    box: '<path d="M21 8.2v7.6a2 2 0 0 1-1 1.74l-7 3.9a2 2 0 0 1-2 0l-7-3.9A2 2 0 0 1 3 15.8V8.2a2 2 0 0 1 1-1.74l7-3.9a2 2 0 0 1 2 0l7 3.9A2 2 0 0 1 21 8.2z"/><path d="M3.4 7.2L12 12l8.6-4.8"/><path d="M12 21.6V12"/>',
    code: '<path d="M8 6l-5 6 5 6"/><path d="M16 6l5 6-5 6"/><path d="M13.5 4l-3 16"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15"/><path d="M8 7.5h8"/>',
    android: '<path d="M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M8 9V6.5a4 4 0 0 1 8 0V9"/><path d="M9.5 4.2L8.6 2.8"/><path d="M14.5 4.2l.9-1.4"/><path d="M3 11v5"/><path d="M21 11v5"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9.2"/><path d="M8 12.4l2.7 2.7L16.2 9.5"/>',
    upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M13.5 6.5l3 3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
    whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M9 8.5c0 3 3 5.5 6 5.5.7 0 1-.5 1-1l-1.6-.9-1 .9c-1-.4-1.8-1.2-2.2-2.2l.9-1L11.2 8c-.5 0-1.2 0-1.2.5z"/>',
    facebook: '<path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z"/>',
    github:
      '<path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.01 10.01 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/>',
    youtube:
      '<path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.4 4.1 12 4.1 12 4.1s-4.4 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 8.9 2 10.5v1.5c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.1 6.8.2 6.8.2s4.4 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.7.2-3.3v-1.5c0-1.6-.2-3.3-.2-3.3z"/><path d="M10 15V9l5.2 3-5.2 3z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6"/><path d="M3.2 14.5h17.6"/><path d="M12 3c2.6 2.6 3.8 6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-6-3.8-9S9.4 5.6 12 3z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    zap: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.4-3.2 7.9-8 9-4.8-1.1-8-4.6-8-9V6l8-3z"/><path d="M8.5 12.2l2.4 2.4 4.6-4.6"/>',
    filter: '<path d="M3 5h18"/><path d="M6.5 12h11"/><path d="M10 19h4"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    alert: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><path d="M12 17.2v.01"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5 3 3L15 12l5 5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    link: '<path d="M10 13a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11 6.3"/><path d="M14 11a4 4 0 0 0-5.7 0L5.7 13.6a4 4 0 0 0 5.7 5.7l1.6-1.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M18 14.4c2.3.7 4 2.8 4 5.6"/>',
    'trending-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15"/>',
    'refresh': '<path d="M20 11a8 8 0 0 0-13.7-5.3L3 9"/><path d="M4 13a8 8 0 0 0 13.7 5.3L21 15"/><path d="M3 4v5h5"/><path d="M21 20v-5h-5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 4l4 4"/><path d="M14 6l3 3"/>'
  };

  function icon(name, className) {
    const path = ICONS[name] || ICONS.box;
    return `<svg class="${className || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const CATEGORY_META = {
    product: { name: 'Product', icon: 'box', plural: 'Products' },
    software: { name: 'Software', icon: 'code', plural: 'Software' },
    course: { name: 'Course', icon: 'book', plural: 'Courses' },
    apk: { name: 'APK', icon: 'android', plural: 'APK & Apps' }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function api(path, options) {
    const opts = Object.assign({ headers: {} }, options || {});
    if (opts.body && !(opts.body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }
    if (!res.ok) {
      const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  const utils = {
    icon,
    escapeHtml,
    api,
    CATEGORY_META,
    categoryName(id) {
      return (CATEGORY_META[id] || {}).name || id;
    },
    categoryIcon(id) {
      return (CATEGORY_META[id] || {}).icon || 'box';
    },
    formatNumber(value) {
      const n = Number(value) || 0;
      if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.0', '')}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
      return String(n);
    },
    price(product, currency) {
      if (product.priceLabel) return product.priceLabel;
      if (!Number(product.price)) return 'Free';
      return `${currency || '৳'}${Number(product.price).toLocaleString('en-US')}`;
    },
    dateLabel(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    timeAgo(iso) {
      const then = new Date(iso).getTime();
      if (!then) return '';
      const diff = Date.now() - then;
      const days = Math.floor(diff / 86400000);
      if (days < 1) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 30) return `${days} days ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
      return `${Math.floor(months / 12)} yr ago`;
    },
    toast(message, type) {
      let stack = document.querySelector('.toast-stack');
      if (!stack) {
        stack = document.createElement('div');
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
      }
      const el = document.createElement('div');
      el.className = `toast ${type === 'error' ? 'error' : 'success'}`;
      el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check-circle')}<span>${escapeHtml(message)}</span>`;
      stack.appendChild(el);
      setTimeout(() => {
        el.classList.add('is-leaving');
        setTimeout(() => el.remove(), 260);
      }, 3800);
    }
  };

  /* Theme */
  const THEME_KEY = 'ts-theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = icon(theme === 'light' ? 'moon' : 'sun');
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f8fc' : '#06070d');
  }

  function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (err) {
      stored = null;
    }
    applyTheme(stored || 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (err) {
          /* ignore */
        }
      });
    });
  }

  /* Header + mobile menu */
  function initChrome() {
    const header = document.querySelector('.site-header');
    const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        toggle.innerHTML = icon(open ? 'x' : 'menu');
        toggle.setAttribute('aria-expanded', String(open));
      });
      menu.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => {
          menu.classList.remove('is-open');
          toggle.innerHTML = icon('menu');
        })
      );
    }
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
  }

  utils.productCard = function productCard(product, settings) {
    const cat = (CATEGORY_META[product.category] || CATEGORY_META.product).name;
    const priceText = utils.price(product, settings && settings.currency);
    const isFree = !Number(product.price) || product.priceLabel === 'Free';
    const href = `/product.html?id=${encodeURIComponent(product.id)}`;
    const tags = (product.tags || [])
      .slice(0, 3)
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('');
    return `
      <article class="product-card">
        <div class="card-media">
          <a href="${href}" tabindex="-1" aria-hidden="true">
            <img src="${escapeHtml(product.cover || '/assets/covers/opskit.svg')}" alt="" loading="lazy">
          </a>
          <div class="card-badges">
            <span class="badge">${escapeHtml(cat)}</span>
            ${isFree ? '<span class="badge badge-free">Free</span>' : ''}
            ${product.featured ? '<span class="badge badge-featured">★ Featured</span>' : ''}
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title"><a class="stretched-link" href="${href}">${escapeHtml(product.title)}</a></h3>
          <p class="card-tagline">${escapeHtml(product.tagline)}</p>
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>
        <div class="card-foot">
          <div style="display:flex;align-items:center;gap:0.8rem;">
            <span class="price ${isFree ? 'is-free' : ''}">${escapeHtml(priceText)}</span>
            <span class="card-meta">
              ${icon('download')} ${utils.formatNumber(product.downloads)}
            </span>
          </div>
          <span class="card-link">Details ${icon('arrow-right')}</span>
        </div>
      </article>`;
  };

  window.TS = utils;
  window.TS.initTheme = initTheme;
  window.TS.initChrome = initChrome;
  window.TS.initReveal = initReveal;
  window.TS.setIcon = (selector, name) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.innerHTML = icon(name);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initChrome();
    initReveal();
  });
})();
