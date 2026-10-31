/* Product detail page */
(function () {
  'use strict';
  const TS = window.TS;
  const { icon, escapeHtml } = TS;

  const root = document.getElementById('product-root');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  let settings = {};

  function whatsappDigits(value) {
    return String(value || '').replace(/[^\d]/g, '');
  }

  function emailHref(subject) {
    return `mailto:${settings.contactEmail || ''}?subject=${encodeURIComponent(subject)}`;
  }

  function downloadArea(product) {
    const priceText = TS.price(product, settings.currency);
    const isFree = !Number(product.price) || product.priceLabel === 'Free';

    if (product.hasDownload) {
      return `
        <a class="btn btn-primary" href="/api/products/${encodeURIComponent(product.id)}/download"
           ${product.externalDownload ? 'target="_blank" rel="noopener"' : ''}>
          ${icon('download')} ${isFree ? 'Download now' : `Get it — ${escapeHtml(priceText)}`}
        </a>`;
    }
    if (!isFree) {
      const whatsapp = whatsappDigits(settings.whatsapp);
      return whatsapp
        ? `<a class="btn btn-primary" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(
            `Hi! I want to buy "${product.title}" (${priceText}).`
          )}" target="_blank" rel="noopener">${icon('whatsapp')} Buy — ${escapeHtml(priceText)}</a>`
        : `<a class="btn btn-primary" href="${emailHref(`Buy ${product.title}`)}">${icon('mail')} Buy — ${escapeHtml(priceText)}</a>`;
    }
    return `<a class="btn btn-primary" href="${emailHref(`Request access: ${product.title}`)}">${icon('mail')} Request access</a>`;
  }

  function secondaryAction(product) {
    if (product.demoUrl) {
      return `<a class="btn btn-ghost" href="${escapeHtml(product.demoUrl)}" target="_blank" rel="noopener">${icon(
        'external'
      )} Live demo</a>`;
    }
    if (!product.hasDownload) {
      return `<a class="btn btn-ghost" href="${emailHref(`Question about ${product.title}`)}">${icon(
        'mail'
      )} Ask a question</a>`;
    }
    return `<a class="btn btn-ghost" href="${emailHref(`Support: ${product.title}`)}">${icon('mail')} Get support</a>`;
  }

  function render(product, related) {
    const catName = TS.categoryName(product.category);
    const priceText = TS.price(product, settings.currency);
    const isFree = !Number(product.price) || product.priceLabel === 'Free';
    const paragraphs = (product.description || '')
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');

    document.getElementById('breadcrumb').innerHTML = `
      <a href="/">Home</a><span class="sep">/</span>
      <a href="/#browse">Shelf</a><span class="sep">/</span>
      <a href="/?cat=${encodeURIComponent(product.category)}#browse">${escapeHtml(catName)}</a>
      <span class="sep">/</span><span>${escapeHtml(product.title)}</span>`;

    root.innerHTML = `
      <div class="product-layout">
        <div>
          <div class="media-panel">
            <img src="${escapeHtml(product.cover || '/assets/covers/opskit.svg')}" alt="${escapeHtml(product.title)} cover">
            <div class="media-note">${icon('shield')} Checked &amp; packaged by the maker</div>
          </div>

          <div class="detail-block" style="border-top:0;padding-bottom:0;">
            <div class="share-row">
              <button class="btn btn-sm" type="button" id="copy-link">${icon('copy')} Copy link</button>
              <a class="btn btn-sm" href="https://wa.me/?text=${encodeURIComponent(
                `${product.title} — ${window.location.href}`
              )}" target="_blank" rel="noopener">${icon('whatsapp')} Share</a>
              <a class="btn btn-sm" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                window.location.href
              )}" target="_blank" rel="noopener">${icon('facebook')} Post</a>
            </div>
          </div>
        </div>

        <div class="info-panel">
          <span class="eyebrow">${escapeHtml(catName)}${product.version ? ` · v${escapeHtml(product.version)}` : ''}</span>
          <h1>${escapeHtml(product.title)}</h1>
          <p class="info-tagline">${escapeHtml(product.tagline)}</p>

          <div class="info-badges">
            ${product.featured ? '<span class="badge badge-featured">★ Featured</span>' : ''}
            ${isFree ? '<span class="badge badge-free">Free download</span>' : ''}
            ${(product.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>

          <div class="purchase-box">
            <div class="purchase-row">
              <div>
                <div class="purchase-price ${isFree ? 'is-free' : ''}" style="${isFree ? 'color:var(--success)' : ''}">
                  ${escapeHtml(priceText)}
                  <small>${isFree ? 'No cost · no signup' : 'One-time payment · lifetime updates'}</small>
                </div>
              </div>
              <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
                ${downloadArea(product)}
                ${secondaryAction(product)}
              </div>
            </div>
            <div class="purchase-meta">
              <span>${icon('download')} ${TS.formatNumber(product.downloads)} downloads</span>
              <span>${icon('eye')} ${TS.formatNumber(product.views)} views</span>
              <span>${icon('clock')} Updated ${TS.dateLabel(product.updatedAt)}</span>
            </div>
          </div>

          <dl class="meta-grid">
            <div class="meta-item"><dt>Version</dt><dd>${escapeHtml(product.version || '—')}</dd></div>
            <div class="meta-item"><dt>Format</dt><dd>${escapeHtml(product.fileType || '—')}</dd></div>
            <div class="meta-item"><dt>Size</dt><dd>${escapeHtml(product.fileSize || '—')}</dd></div>
            <div class="meta-item"><dt>Category</dt><dd>${escapeHtml(catName)}</dd></div>
          </dl>
        </div>
      </div>

      <div class="detail-block">
        <h2>What it is</h2>
        <div class="prose">${paragraphs || `<p>${escapeHtml(product.tagline)}</p>`}</div>
      </div>

      ${
        (product.features || []).length
          ? `<div class="detail-block">
              <h2>What's inside</h2>
              <ul class="feature-list">
                ${product.features.map((f) => `<li>${icon('check-circle')}<span>${escapeHtml(f)}</span></li>`).join('')}
              </ul>
            </div>`
          : ''
      }
    `;

    const copyBtn = document.getElementById('copy-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          TS.toast('Link copied to clipboard');
        } catch (err) {
          TS.toast('Copy failed — you can copy the URL from the address bar', 'error');
        }
      });
    }

    document.title = `${product.title} — ${settings.siteName || 'Touhid Shakib'}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', product.tagline || '');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', product.title);

    if (related && related.length) {
      document.getElementById('related-section').hidden = false;
      document.getElementById('related-grid').innerHTML = related
        .map((p) => TS.productCard(p, settings))
        .join('');
    }

    // Count the view once per browser session per product.
    try {
      const key = `ts-view-${product.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        fetch(`/api/products/${encodeURIComponent(product.id)}?view=1`).catch(() => {});
      }
    } catch (err) {
      /* private mode — ignore */
    }
  }

  function renderError(message) {
    root.innerHTML = `
      <div class="empty-state" style="margin:2rem 0 4rem;">
        ${icon('alert')}
        <h3>We couldn't find that product</h3>
        <p>${escapeHtml(message || 'It may have been taken down or the link is incomplete.')}</p>
        <a class="btn btn-primary" href="/#browse">Back to the shelf</a>
      </div>`;
  }

  async function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    if (!id) return renderError('No product was selected. Open a product from the shelf instead.');

    try {
      const site = await TS.api('/api/site');
      settings = site.settings || {};
      const data = await TS.api(`/api/products/${encodeURIComponent(id)}`);
      render(data.product, data.related);
    } catch (err) {
      renderError(err.status === 404 ? 'This product is no longer available.' : err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
