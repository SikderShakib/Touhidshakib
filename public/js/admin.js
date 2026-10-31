/* Upload hub — admin logic */
(function () {
  'use strict';
  const TS = window.TS;
  const { icon, escapeHtml } = TS;

  const state = {
    products: [],
    stats: null,
    settings: {},
    search: '',
    filter: 'all',
    editingId: null,
    existingCover: '',
    existingFileUrl: '',
    coverFile: null,
    dataFile: null,
    removeCover: false,
    confirmAction: null
  };

  const $ = (sel) => document.querySelector(sel);

  const VIEW_COPY = {
    dashboard: ['Dashboard', "A quick look at what's live on your shelf."],
    products: ['My products', 'Upload, edit, publish or remove anything on the shelf.'],
    settings: ['Settings', 'Storefront details, security and backups.']
  };

  function formatBytes(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
  }

  /* ---------------- Auth ---------------- */
  function showAuth() {
    $('#auth-view').hidden = false;
    $('#app-view').hidden = true;
  }

  function showApp() {
    $('#auth-view').hidden = true;
    $('#app-view').hidden = false;
    loadData();
  }

  async function checkAuth() {
    try {
      const me = await TS.api('/api/me');
      $('#side-user').textContent = me.user || 'admin';
      $('#user-avatar').textContent = (me.user || 'TS').slice(0, 2).toUpperCase();
      showApp();
    } catch (err) {
      showAuth();
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const errorBox = $('#login-error');
    const submit = $('#login-submit');
    errorBox.classList.remove('is-visible');
    submit.disabled = true;
    submit.textContent = 'Signing in…';
    try {
      const data = await TS.api('/api/login', {
        method: 'POST',
        body: {
          username: $('#login-user').value.trim(),
          password: $('#login-pass').value
        }
      });
      $('#side-user').textContent = data.user || 'admin';
      showApp();
      TS.toast('Welcome back');
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add('is-visible');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Sign in';
    }
  }

  async function handleLogout() {
    try {
      await TS.api('/api/logout', { method: 'POST' });
    } catch (err) {
      /* ignore */
    }
    state.products = [];
    showAuth();
    TS.toast('Signed out');
  }

  /* ---------------- Data ---------------- */
  async function loadData() {
    try {
      const [stats, list, settings] = await Promise.all([
        TS.api('/api/admin/stats'),
        TS.api('/api/products?all=1&sort=newest&limit=200'),
        TS.api('/api/admin/settings')
      ]);
      state.stats = stats;
      state.products = list.products || [];
      state.settings = settings.settings || {};
      $('#side-user').textContent = settings.adminUser || 'admin';
      renderAll();
    } catch (err) {
      if (err.status === 401) return showAuth();
      TS.toast(err.message, 'error');
    }
  }

  function renderAll() {
    renderKPIs();
    renderBreakdown();
    renderTable($('#recent-tbody'), state.products.slice(0, 5), { compact: true });
    renderProductsTable();
    fillSettingsForm();
    $('#nav-count').textContent = state.products.length;
  }

  function renderKPIs() {
    const s = state.stats || {};
    $('#kpi-products').textContent = s.products || 0;
    $('#kpi-downloads').textContent = TS.formatNumber(s.downloads || 0);
    $('#kpi-views').textContent = TS.formatNumber(s.views || 0);
    $('#kpi-drafts').textContent = s.drafts || 0;
  }

  function renderBreakdown() {
    const byCat = (state.stats && state.stats.byCategory) || [];
    const total = state.products.length || 1;
    $('#category-breakdown').innerHTML = byCat
      .map((c) => {
        const pct = Math.round((c.count / total) * 100);
        return `
        <div class="breakdown-row">
          <div class="bd-top"><b>${escapeHtml(TS.categoryName(c.id))}</b><span>${c.count} · ${pct}%</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>`;
      })
      .join('');
  }

  function statusPill(product) {
    return product.published
      ? '<span class="pill live">Live</span>'
      : '<span class="pill draft">Draft</span>';
  }

  function renderTable(tbody, products, opts) {
    const compact = opts && opts.compact;
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty">${icon('box')}<div>Nothing here yet. Add your first product.</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = products
      .map(
        (p) => `
        <tr data-id="${escapeHtml(p.id)}">
          <td>
            <div class="cell-product">
              <img class="cell-thumb" src="${escapeHtml(p.cover || '/assets/covers/opskit.svg')}" alt="" loading="lazy">
              <div>
                <b>${escapeHtml(p.title)}</b>
                <span>${escapeHtml(p.version || TS.categoryName(p.category))}${p.featured ? ' · ★ featured' : ''}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(TS.categoryName(p.category))}</td>
          ${
            compact
              ? ''
              : `<td>${escapeHtml(TS.price(p, state.settings.currency))}</td>`
          }
          <td>${statusPill(p)}</td>
          <td class="mono" style="font-size:0.78rem;">${TS.formatNumber(p.downloads)}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" type="button" data-edit="${escapeHtml(p.id)}" aria-label="Edit ${escapeHtml(
                p.title
              )}" title="Edit">${icon('edit')}</button>
              ${
                compact
                  ? ''
                  : `<a class="icon-btn" href="/product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" title="View on site" aria-label="View ${escapeHtml(p.title)}">${icon(
                      'eye'
                    )}</a>
                    <button class="icon-btn" type="button" data-publish="${escapeHtml(p.id)}" title="${
                      p.published ? 'Unpublish' : 'Publish'
                    }" aria-label="${p.published ? 'Unpublish' : 'Publish'} ${escapeHtml(p.title)}">${icon(
                      p.published ? 'file' : 'check'
                    )}</button>`
              }
              <button class="icon-btn danger" type="button" data-delete="${escapeHtml(p.id)}" aria-label="Delete ${escapeHtml(
                p.title
              )}" title="Delete">${icon('trash')}</button>
            </div>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => openEditor(btn.dataset.edit))
    );
    tbody.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', () => askDelete(btn.dataset.delete))
    );
    tbody.querySelectorAll('[data-publish]').forEach((btn) =>
      btn.addEventListener('click', () => togglePublish(btn.dataset.publish))
    );
  }

  function filteredProducts() {
    let list = state.products;
    if (state.filter !== 'all') list = list.filter((p) => p.category === state.filter);
    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.title, p.tagline, (p.tags || []).join(' '), p.category].join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderProductsTable() {
    const list = filteredProducts();
    renderTable($('#products-tbody'), list);
    $('#table-count').textContent = `${list.length} of ${state.products.length}`;
  }

  /* ---------------- Navigation ---------------- */
  function switchView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${name}`));
    document.querySelectorAll('[data-nav]').forEach((btn) =>
      btn.classList.toggle('is-active', btn.dataset.nav === name)
    );
    const copy = VIEW_COPY[name] || VIEW_COPY.dashboard;
    $('#view-title').textContent = copy[0];
    $('#view-sub').textContent = copy[1];
    document.querySelector('[data-sidebar]').classList.remove('is-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Editor ---------------- */
  const editor = {};
  const form = {};

  function cacheEditor() {
    editor.modal = $('#editor-modal');
    editor.title = $('#editor-title');
    editor.sub = $('#editor-sub');
    editor.error = $('#editor-error');
    editor.coverInput = $('#cover-input');
    editor.coverDrop = $('#cover-drop');
    editor.coverPreview = $('#cover-preview');
    editor.coverImg = $('#cover-preview-img');
    editor.fileInput = $('#file-input');
    editor.fileDrop = $('#file-drop');
    editor.fileSelected = $('#file-selected');
    editor.fileName = $('#file-name');
    editor.fileSize = $('#file-size');
    editor.progress = $('#upload-progress');
    editor.progressBar = editor.progress.querySelector('i');
    editor.saveBtn = $('#save-product');

    form.title = $('#f-title');
    form.category = $('#f-category');
    form.tagline = $('#f-tagline');
    form.description = $('#f-description');
    form.features = $('#f-features');
    form.tags = $('#f-tags');
    form.price = $('#f-price');
    form.priceLabel = $('#f-priceLabel');
    form.version = $('#f-version');
    form.fileType = $('#f-fileType');
    form.fileSize = $('#f-fileSize');
    form.demoUrl = $('#f-demoUrl');
    form.externalUrl = $('#f-externalUrl');
    form.featured = $('#f-featured');
    form.published = $('#f-published');
  }

  function setPreview(src) {
    if (src) {
      editor.coverImg.src = src;
      editor.coverPreview.hidden = false;
    } else {
      editor.coverPreview.hidden = true;
      editor.coverImg.removeAttribute('src');
    }
  }

  function setFileChip(name, sizeText) {
    if (!name) {
      editor.fileSelected.style.display = 'none';
      editor.fileName.textContent = '';
      editor.fileSize.textContent = '';
      return;
    }
    editor.fileSelected.style.display = 'block';
    editor.fileName.textContent = name;
    editor.fileSize.textContent = sizeText;
  }

  function openEditor(id) {
    const product = id ? state.products.find((p) => p.id === id) : null;
    state.editingId = product ? product.id : null;
    state.coverFile = null;
    state.dataFile = null;
    state.removeCover = false;
    state.existingCover = product ? product.cover || '' : '';
    state.existingFileUrl = product && product.fileUrl ? product.fileUrl : '';

    editor.title.textContent = product ? 'Edit product' : 'New product';
    editor.sub.textContent = product
      ? 'Changes go live as soon as you save (if it is published).'
      : 'Add an item to your shelf. Only the title and tagline are required.';
    editor.error.classList.remove('is-visible');
    editor.progress.classList.remove('is-visible');
    editor.progressBar.style.width = '0%';

    form.title.value = product ? product.title : '';
    form.category.value = product ? product.category : 'product';
    form.tagline.value = product ? product.tagline : '';
    form.description.value = product ? product.description : '';
    form.features.value = product ? (product.features || []).join('\n') : '';
    form.tags.value = product ? (product.tags || []).join(', ') : '';
    form.price.value = product && Number(product.price) ? product.price : '';
    form.priceLabel.value = product ? product.priceLabel || '' : '';
    form.version.value = product ? product.version || '' : '';
    form.fileType.value = product ? product.fileType || '' : '';
    form.fileSize.value = product ? product.fileSize || '' : '';
    form.demoUrl.value = product ? product.demoUrl || '' : '';
    form.externalUrl.value = product ? product.externalUrl || '' : '';
    form.featured.checked = product ? !!product.featured : false;
    form.published.checked = product ? product.published !== false : true;

    editor.coverInput.value = '';
    editor.fileInput.value = '';
    setPreview(product && product.cover ? product.cover : '');
    setFileChip(
      product && product.fileUrl ? product.fileUrl.split('/').pop() : '',
      product && product.fileUrl ? 'Uploaded file · will be replaced only if you pick a new one' : ''
    );

    editor.modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.title.focus(), 60);
  }

  function closeEditor() {
    editor.modal.classList.remove('is-open');
    document.body.style.overflow = '';
    state.editingId = null;
    state.coverFile = null;
    state.dataFile = null;
  }

  function bindDropzone(zone, input, onFile, acceptMessage) {
    ['dragenter', 'dragover'].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add('is-dragover');
      })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove('is-dragover');
      })
    );
    zone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) onFile(file);
    });
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) onFile(file);
    });
    return acceptMessage;
  }

  function handleCover(file) {
    if (!/^image\//.test(file.type)) {
      TS.toast('Cover must be an image file', 'error');
      return;
    }
    state.coverFile = file;
    state.removeCover = false;
    setPreview(URL.createObjectURL(file));
  }

  function handleDataFile(file) {
    state.dataFile = file;
    setFileChip(file.name, formatBytes(file.size));
    if (!form.fileSize.value) form.fileSize.value = formatBytes(file.size);
    if (!form.fileType.value) {
      const ext = file.name.split('.').pop();
      if (ext && ext.length <= 6) form.fileType.value = ext.toUpperCase();
    }
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('title', form.title.value.trim());
    fd.append('category', form.category.value);
    fd.append('tagline', form.tagline.value.trim());
    fd.append('description', form.description.value);
    fd.append('features', form.features.value);
    fd.append('tags', form.tags.value);
    fd.append('price', form.price.value === '' ? '0' : form.price.value);
    fd.append('priceLabel', form.priceLabel.value);
    fd.append('version', form.version.value);
    fd.append('fileType', form.fileType.value);
    fd.append('fileSize', form.fileSize.value);
    fd.append('demoUrl', form.demoUrl.value);
    fd.append('externalUrl', form.externalUrl.value);
    fd.append('featured', form.featured.checked ? 'true' : 'false');
    fd.append('published', form.published.checked ? 'true' : 'false');
    if (state.coverFile) fd.append('cover', state.coverFile);
    if (state.dataFile) fd.append('file', state.dataFile);
    if (state.removeCover) fd.append('removeCover', 'true');
    return fd;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errorBox = editor.error;
    errorBox.classList.remove('is-visible');

    if (!form.title.value.trim()) {
      errorBox.textContent = 'Please give the product a title.';
      errorBox.classList.add('is-visible');
      form.title.focus();
      return;
    }
    if (!form.tagline.value.trim()) {
      errorBox.textContent = 'Please add a one-line tagline.';
      errorBox.classList.add('is-visible');
      form.tagline.focus();
      return;
    }

    const fd = buildFormData();
    const editing = Boolean(state.editingId);
    const url = editing ? `/api/admin/products/${state.editingId}` : '/api/admin/products';

    editor.saveBtn.disabled = true;
    editor.saveBtn.textContent = editing ? 'Saving…' : 'Uploading…';

    const xhr = new XMLHttpRequest();
    xhr.open(editing ? 'PUT' : 'POST', url);
    xhr.withCredentials = true;

    xhr.upload.addEventListener('progress', (evt) => {
      if (!evt.lengthComputable) return;
      editor.progress.classList.add('is-visible');
      editor.progressBar.style.width = `${Math.round((evt.loaded / evt.total) * 100)}%`;
    });

    xhr.addEventListener('load', () => {
      editor.saveBtn.disabled = false;
      editor.saveBtn.innerHTML = `${icon('check')} Save product`;
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (err) {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        closeEditor();
        TS.toast(editing ? 'Product updated' : 'Product published to your shelf');
        loadData();
      } else if (xhr.status === 401) {
        closeEditor();
        showAuth();
        TS.toast('Session expired — please sign in again', 'error');
      } else {
        errorBox.textContent = (data && (data.error || data.message)) || `Upload failed (${xhr.status})`;
        errorBox.classList.add('is-visible');
        editor.progress.classList.remove('is-visible');
      }
    });

    xhr.addEventListener('error', () => {
      editor.saveBtn.disabled = false;
      editor.saveBtn.innerHTML = `${icon('check')} Save product`;
      errorBox.textContent = 'Network error — is the server still running?';
      errorBox.classList.add('is-visible');
    });

    xhr.send(fd);
  }

  /* ---------------- Delete / publish ---------------- */
  function askDelete(id) {
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    $('#confirm-text').innerHTML = `You are about to remove <b>${escapeHtml(
      product.title
    )}</b> from the shelf. Its uploaded files will be deleted too. This cannot be undone.`;
    state.confirmAction = async () => {
      try {
        await TS.api(`/api/admin/products/${id}`, { method: 'DELETE' });
        TS.toast('Product deleted');
        loadData();
      } catch (err) {
        TS.toast(err.message, 'error');
      }
    };
    $('#confirm-modal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeConfirm() {
    $('#confirm-modal').classList.remove('is-open');
    document.body.style.overflow = '';
    state.confirmAction = null;
  }

  async function togglePublish(id) {
    try {
      const data = await TS.api(`/api/admin/products/${id}/publish`, { method: 'PATCH' });
      TS.toast(data.product.published ? 'Published — visitors can see it now' : 'Moved to drafts');
      loadData();
    } catch (err) {
      TS.toast(err.message, 'error');
    }
  }

  /* ---------------- Settings ---------------- */
  const SETTING_FIELDS = [
    'siteName',
    'siteTagline',
    'heroTitle',
    'heroSubtitle',
    'contactEmail',
    'whatsapp',
    'facebook',
    'youtube',
    'github',
    'currency'
  ];

  function fillSettingsForm() {
    SETTING_FIELDS.forEach((key) => {
      const el = document.getElementById(`set-${key}`);
      if (el) el.value = state.settings[key] || '';
    });
  }

  async function saveSettings(e) {
    e.preventDefault();
    const payload = {};
    SETTING_FIELDS.forEach((key) => {
      const el = document.getElementById(`set-${key}`);
      if (el) payload[key] = el.value.trim();
    });
    try {
      const data = await TS.api('/api/admin/settings', { method: 'PUT', body: payload });
      state.settings = data.settings;
      fillSettingsForm();
      TS.toast('Storefront details saved');
    } catch (err) {
      TS.toast(err.message, 'error');
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const errorBox = $('#password-error');
    errorBox.classList.remove('is-visible');
    const current = $('#pw-current').value;
    const next = $('#pw-new').value;
    const confirm = $('#pw-confirm').value;

    if (next !== confirm) {
      errorBox.textContent = 'The two new passwords do not match.';
      errorBox.classList.add('is-visible');
      return;
    }
    try {
      await TS.api('/api/admin/password', { method: 'PUT', body: { currentPassword: current, newPassword: next } });
      e.currentTarget.reset();
      TS.toast('Password updated');
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add('is-visible');
    }
  }

  /* ---------------- Boot ---------------- */
  function bind() {
    $('#login-form').addEventListener('submit', handleLogin);
    $('#logout-btn').addEventListener('click', handleLogout);
    $('#settings-form').addEventListener('submit', saveSettings);
    $('#password-form').addEventListener('submit', changePassword);
    $('#product-form').addEventListener('submit', handleSubmit);

    document.querySelectorAll('[data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => switchView(btn.dataset.nav))
    );
    document.querySelectorAll('[data-goto]').forEach((btn) =>
      btn.addEventListener('click', () => switchView(btn.dataset.goto))
    );
    document.querySelectorAll('[data-new-product]').forEach((btn) =>
      btn.addEventListener('click', () => openEditor(null))
    );
    document.querySelectorAll('[data-close-editor]').forEach((btn) =>
      btn.addEventListener('click', closeEditor)
    );
    document.querySelectorAll('[data-close-confirm]').forEach((btn) =>
      btn.addEventListener('click', closeConfirm)
    );

    $('#confirm-yes').addEventListener('click', () => {
      const action = state.confirmAction;
      closeConfirm();
      if (action) action();
    });

    $('#cover-remove').addEventListener('click', () => {
      state.coverFile = null;
      editor.coverInput.value = '';
      state.removeCover = true;
      setPreview('');
    });

    $('#file-remove').addEventListener('click', () => {
      state.dataFile = null;
      editor.fileInput.value = '';
      setFileChip('', '');
    });

    bindDropzone(editor.coverDrop, editor.coverInput, handleCover);
    bindDropzone(editor.fileDrop, editor.fileInput, handleDataFile);

    $('#admin-search').addEventListener('input', (e) => {
      state.search = e.target.value;
      renderProductsTable();
    });
    $('#admin-filter').addEventListener('change', (e) => {
      state.filter = e.target.value;
      renderProductsTable();
    });

    document.querySelectorAll('[data-side-toggle]').forEach((btn) =>
      btn.addEventListener('click', () => document.querySelector('[data-sidebar]').classList.toggle('is-open'))
    );

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (editor.modal.classList.contains('is-open')) closeEditor();
        if ($('#confirm-modal').classList.contains('is-open')) closeConfirm();
      }
    });

    // Click outside the card closes modals
    [editor.modal, $('#confirm-modal')].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal === editor.modal) closeEditor();
          else closeConfirm();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });
    cacheEditor();
    bind();
    checkAuth();
  });
})();
