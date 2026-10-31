/* Storefront home page */
(function () {
  'use strict';
  const TS = window.TS;
  const { icon, escapeHtml } = TS;

  const state = {
    products: [],
    categories: [],
    settings: {},
    stats: {},
    category: 'all',
    query: '',
    sort: 'newest',
    visible: 9,
    step: 9
  };

  const els = {};
  let searchTimer = null;

  function socialLink(href, name, iconName) {
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="${name}">${icon(iconName)}</a>`;
  }

  function renderCategories() {
    const counts = state.products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    els.categoryGrid.innerHTML = state.categories
      .map(
        (cat, i) => `
        <div class="category-card reveal" role="button" tabindex="0" data-cat="${escapeHtml(cat.id)}" style="transition-delay:${i * 60}ms">
          <span class="category-icon">${icon(cat.icon || TS.categoryIcon(cat.id))}</span>
          <h3>${escapeHtml(cat.name)}</h3>
          <p>${escapeHtml(cat.blurb || '')}</p>
          <span class="cat-count">${counts[cat.id] || 0} ${(counts[cat.id] || 0) === 1 ? 'item' : 'items'} →</span>
        </div>`
      )
      .join('');
    els.categoryGrid.querySelectorAll('[data-cat]').forEach((card) => {
      const activate = () => {
        setCategory(card.dataset.cat);
        document.getElementById('browse').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
    TS.initReveal();
  }

  function renderChips() {
    const options = [{ id: 'all', name: 'All' }].concat(
      state.categories.map((c) => ({ id: c.id, name: c.name }))
    );
    els.chips.innerHTML = options
      .map(
        (opt) =>
          `<button class="chip ${state.category === opt.id ? 'is-active' : ''}" type="button" data-chip="${escapeHtml(
            opt.id
          )}">${escapeHtml(opt.name)}</button>`
      )
      .join('');
    els.chips.querySelectorAll('[data-chip]').forEach((btn) => {
      btn.addEventListener('click', () => setCategory(btn.dataset.chip));
    });
  }

  function filteredProducts() {
    let list = state.products;
    if (state.category !== 'all') list = list.filter((p) => p.category === state.category);
    const q = state.query.trim().toLowerCase();
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const haystack = [p.title, p.tagline, p.description, (p.tags || []).join(' '), TS.categoryName(p.category)]
          .join(' ')
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    }
    const sorted = [...list];
    if (state.sort === 'downloads') sorted.sort((a, b) => b.downloads - a.downloads);
    else if (state.sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  }

  function renderGrid() {
    const list = filteredProducts();
    const shown = list.slice(0, state.visible);
    els.count.textContent = list.length
      ? `${list.length} ${list.length === 1 ? 'item' : 'items'} on the shelf${state.category !== 'all' ? ` · ${TS.categoryName(state.category)}` : ''}`
      : 'Nothing matched that search yet';

    if (!shown.length) {
      const isEmptyShelf = !state.products.length;
      els.grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          ${icon(isEmptyShelf ? 'box' : 'search')}
          <h3>${isEmptyShelf ? 'The shelf is empty — for now' : 'No product matches that'}</h3>
          <p>${
            isEmptyShelf
              ? 'Sign in to the upload hub and add your first product, software, course or APK.'
              : 'Try a different keyword, or clear the filters to see everything again.'
          }</p>
          <a class="btn btn-primary btn-sm" href="${isEmptyShelf ? '/admin.html' : '#'}" data-reset="${isEmptyShelf ? 'false' : 'true'}">
            ${isEmptyShelf ? 'Open upload hub' : 'Clear filters'}
          </a>
        </div>`;
      const reset = els.grid.querySelector('[data-reset="true"]');
      if (reset) {
        reset.addEventListener('click', (e) => {
          e.preventDefault();
          setCategory('all');
          state.query = '';
          els.search.value = '';
          renderGrid();
        });
      }
      els.footer.innerHTML = '';
      return;
    }

    els.grid.innerHTML = shown.map((p) => TS.productCard(p, state.settings)).join('');
    const remaining = list.length - shown.length;
    els.footer.innerHTML = remaining
      ? `<button class="btn" type="button" id="load-more">Show ${Math.min(remaining, state.step)} more (${remaining} left)</button>`
      : list.length > state.step
        ? '<span class="mono" style="font-size:0.72rem;color:var(--muted-2);letter-spacing:0.1em;text-transform:uppercase;">That\'s everything</span>'
        : '';
    const more = document.getElementById('load-more');
    if (more) {
      more.addEventListener('click', () => {
        state.visible += state.step;
        renderGrid();
      });
    }
  }

  function setCategory(cat) {
    state.category = cat;
    state.visible = state.step;
    renderChips();
    renderGrid();
    renderNavActive();
    if (history.replaceState) {
      const url = new URL(window.location.href);
      if (cat === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', cat);
      history.replaceState({}, '', url.pathname + (url.search || '') + '#browse');
    }
  }

  function renderNavActive() {
    document.querySelectorAll('[data-cat-link]').forEach((link) => {
      const isActive = link.dataset.catLink === state.category;
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function applySettings() {
    const s = state.settings;
    if (s.heroTitle && s.heroTitle.trim() !== 'Real products. Real problems solved.') {
      // Keep the gradient split on the headline when a custom title is set.
      const words = s.heroTitle.trim().split(/\s+/);
      if (words.length > 3) {
        const mid = Math.ceil(words.length / 2);
        document.querySelector('.hero h1').innerHTML =
          `${escapeHtml(words.slice(0, mid).join(' '))}<br><span class="grad-text">${escapeHtml(
            words.slice(mid).join(' ')
          )}</span>`;
      } else {
        document.querySelector('.hero h1').textContent = s.heroTitle;
      }
    }
    if (s.heroSubtitle) els.heroSub.textContent = s.heroSubtitle;
    if (s.contactEmail) {
      els.ctaEmail.href = `mailto:${s.contactEmail}`;
      document.getElementById('footer-email').href = `mailto:${s.contactEmail}`;
      document.getElementById('footer-email').textContent = s.contactEmail;
    }
    if (s.whatsapp) {
      const digits = String(s.whatsapp).replace(/[^\d+]/g, '').replace(/^\+/, '');
      els.ctaWhatsapp.hidden = false;
      els.ctaWhatsapp.href = `https://wa.me/${digits}`;
      const footerWa = document.getElementById('footer-whatsapp');
      footerWa.hidden = false;
      footerWa.href = `https://wa.me/${digits}`;
    } else {
      els.ctaWhatsapp.hidden = true;
      document.getElementById('footer-whatsapp').hidden = true;
    }

    const socials = [];
    if (s.github) socials.push(socialLink(s.github, 'GitHub', 'github'));
    if (s.facebook) socials.push(socialLink(s.facebook, 'Facebook', 'facebook'));
    if (s.youtube) socials.push(socialLink(s.youtube, 'YouTube', 'youtube'));
    if (s.contactEmail) socials.push(socialLink(`mailto:${s.contactEmail}`, 'Email', 'mail'));
    if (s.whatsapp) socials.push(socialLink(`https://wa.me/${String(s.whatsapp).replace(/[^\d]/g, '')}`, 'WhatsApp', 'whatsapp'));
    document.getElementById('footer-social').innerHTML = socials.join('');

    if (s.siteName) document.title = `${s.siteName} — Products, Software, Courses & APK`;
    document.getElementById('hero-downloads').textContent =
      `${TS.formatNumber(state.stats.downloads || 0)} downloads so far`;
  }

  function renderStats() {
    const stats = state.stats || {};
    document.getElementById('stat-products').textContent = stats.products || state.products.length;
    document.getElementById('stat-downloads').textContent = TS.formatNumber(stats.downloads || 0);
    document.getElementById('stat-free').textContent = stats.free || 0;
  }

  function bindEvents() {
    els.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = els.search.value;
        state.visible = state.step;
        renderGrid();
      }, 140);
    });

    els.sort.addEventListener('change', () => {
      state.sort = els.sort.value;
      renderGrid();
    });

    document.querySelectorAll('[data-cat-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        setCategory(link.dataset.catLink);
        const target = document.getElementById('browse');
        const menu = document.querySelector('[data-mobile-menu]');
        if (menu) menu.classList.remove('is-open');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (els.search && new URL(window.location.href).searchParams.get('q')) {
      els.search.value = new URL(window.location.href).searchParams.get('q');
      state.query = els.search.value;
    }
  }

  async function init() {
    els.grid = document.getElementById('product-grid');
    els.count = document.getElementById('result-count');
    els.footer = document.getElementById('grid-footer');
    els.chips = document.getElementById('filter-chips');
    els.search = document.getElementById('search-input');
    els.sort = document.getElementById('sort-select');
    els.categoryGrid = document.getElementById('category-grid');
    els.heroSub = document.getElementById('hero-sub');
    els.ctaEmail = document.getElementById('cta-email');
    els.ctaWhatsapp = document.getElementById('cta-whatsapp');
    document.getElementById('year').textContent = new Date().getFullYear();

    // Skeleton state while the shelf loads
    els.grid.innerHTML = Array.from({ length: 3 })
      .map(
        () => `
        <div class="skeleton">
          <div class="sk-media sk-shimmer"></div>
          <div class="sk-line sk-shimmer" style="width:70%"></div>
          <div class="sk-line sk-shimmer" style="width:90%"></div>
          <div class="sk-line sk-shimmer" style="width:40%;margin-bottom:1.4rem"></div>
        </div>`
      )
      .join('');

    try {
      const [site, data] = await Promise.all([TS.api('/api/site'), TS.api('/api/products?sort=newest&limit=200')]);
      state.settings = site.settings || {};
      state.categories = site.categories || [];
      state.stats = site.stats || {};
      state.products = data.products || [];

      const params = new URLSearchParams(window.location.search);
      const cat = params.get('cat');
      if (cat && (cat === 'all' || state.categories.some((c) => c.id === cat))) state.category = cat;

      renderCategories();
      renderChips();
      renderNavActive();
      renderStats();
      applySettings();
      bindEvents();
      renderGrid();
    } catch (err) {
      els.count.textContent = 'Could not load the shelf';
      els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${icon('alert')}<h3>Something went wrong</h3><p>${escapeHtml(
        err.message
      )}</p><button class="btn btn-primary btn-sm" onclick="location.reload()">Try again</button></div>`;
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
