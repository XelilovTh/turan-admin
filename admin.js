/**
 * ============================================================
 * TURAN LEATHER — admin.js
 * Admin panel logic:
 *  - Login / Logout (localStorage-based auth)
 *  - Full CRUD: Add, Read, Update, Delete products
 *  - GitHub image URL preview (live)
 *  - Settings management (GitHub config, WhatsApp, password)
 *  - Search & category filter
 *  - Stats dashboard
 *  - Toast notifications
 * ============================================================
 *
 * Data Model (shared with main.js):
 * {
 *   id:          string   — nanoid-style unique ID
 *   name:        string   — məhsul adı
 *   price:       number   — qiymət (AZN)
 *   category:    string   — "cuzdan" | "kemer" | "aksesuar"
 *   imagePrefix: string   — GitHub images/ qovluğundakı fayl prefiksi
 *   imageCount:  number   — şəkil sayı
 *   description: string   — məhsul təsviri
 *   createdAt:   string   — ISO timestamp
 * }
 * ============================================================
 */

'use strict';

/* ──────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────── */
const STORAGE_KEY      = 'turanLeatherProducts';
const AUTH_KEY         = 'turanLeatherAuth';
const SETTINGS_KEY     = 'turanLeatherSettings';
const CREDENTIALS_KEY  = 'turanLeatherCredentials';

const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'turan2024',
};

const DEFAULT_SETTINGS = {
  githubOwner:  'your-username',
  githubRepo:   'turan-leather-imgs',
  githubBranch: 'main',
  whatsapp:     '994XXXXXXXXX',
};

const CATEGORY_LABELS = {
  cuzdan:   'Cüzdan',
  kemer:    'Kəmər',
  aksesuar: 'Aksesuar',
};

/* ──────────────────────────────────────────
   NANO ID (lightweight unique ID generator)
────────────────────────────────────────── */
function nanoid() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/* ──────────────────────────────────────────
   STATE
────────────────────────────────────────── */
let state = {
  products:       [],
  filteredProducts: [],
  searchQuery:    '',
  filterCategory: 'all',
  editingId:      null,
  deleteTargetId: null,
  settings:       { ...DEFAULT_SETTINGS },
};

/* ──────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────── */
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_CREDENTIALS };
  } catch {
    return { ...DEFAULT_CREDENTIALS };
  }
}

function saveCredentials(creds) {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
}

/* ──────────────────────────────────────────
   AUTH
────────────────────────────────────────── */
function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function login(username, password) {
  const creds = loadCredentials();
  return username === creds.username && password === creds.password;
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showAdminLayout() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
}

/* ──────────────────────────────────────────
   GITHUB IMAGE URL BUILDER
────────────────────────────────────────── */
function buildGitHubUrls(prefix, count) {
  const { githubOwner, githubRepo, githubBranch } = state.settings;
  const urls = [];
  for (let i = 1; i <= count; i++) {
    urls.push(
      `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/images/${prefix}_${i}.jpg`
    );
  }
  return urls;
}

function getFirstImageUrl(product) {
  const urls = buildGitHubUrls(product.imagePrefix, 1);
  return urls[0];
}

/* ──────────────────────────────────────────
   TOAST
────────────────────────────────────────── */
let toastTimer = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('adminToast');
  toast.textContent = message;
  toast.className = `admin-toast show ${type}`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ──────────────────────────────────────────
   STATS
────────────────────────────────────────── */
function updateStats() {
  const products = state.products;
  document.getElementById('statTotal').textContent    = products.length;
  document.getElementById('statCuzdan').textContent   = products.filter(p => p.category === 'cuzdan').length;
  document.getElementById('statKemer').textContent    = products.filter(p => p.category === 'kemer').length;
  document.getElementById('statAksesuar').textContent = products.filter(p => p.category === 'aksesuar').length;

  const count = products.length;
  document.getElementById('productCount').textContent =
    count === 0 ? 'Heç bir məhsul yoxdur' : `${count} məhsul`;
}

/* ──────────────────────────────────────────
   FILTER & SEARCH
────────────────────────────────────────── */
function applyFilters() {
  let filtered = [...state.products];

  // Category filter
  if (state.filterCategory !== 'all') {
    filtered = filtered.filter(p => p.category === state.filterCategory);
  }

  // Search
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.imagePrefix.toLowerCase().includes(q)
    );
  }

  state.filteredProducts = filtered;
  renderTable();
}

/* ──────────────────────────────────────────
   TABLE RENDER
────────────────────────────────────────── */
function renderTable() {
  const tbody = document.getElementById('adminTableBody');
  const products = state.filteredProducts;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          <div style="color: var(--cream-dim); font-size: 0.88rem;">
            ${state.searchQuery || state.filterCategory !== 'all'
              ? 'Axtarışa uyğun məhsul tapılmadı.'
              : 'Hələ heç bir məhsul əlavə edilməyib. "Yeni Məhsul" düyməsini sıxın.'}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(product => {
    const imgUrl = getFirstImageUrl(product);
    const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

    return `
      <tr>
        <td>
          <img
            class="table-thumb"
            src="${imgUrl}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="table-thumb-placeholder" style="display:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        </td>
        <td class="table-name">${escapeHtml(product.name)}</td>
        <td><span class="table-badge">${categoryLabel}</span></td>
        <td class="table-price">${product.price} <span style="font-size:0.7rem; color: var(--cream-dim); font-family: var(--font-body);">AZN</span></td>
        <td><code class="table-prefix">${escapeHtml(product.imagePrefix)}</code></td>
        <td style="color: var(--cream-muted);">${product.imageCount}</td>
        <td>
          <div class="table-actions">
            <button class="btn-table-edit" onclick="openEditForm('${product.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Redaktə
            </button>
            <button class="btn-table-delete" onclick="openDeleteConfirm('${product.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Sil
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ──────────────────────────────────────────
   PRODUCT FORM MODAL
────────────────────────────────────────── */
function openAddForm() {
  state.editingId = null;
  document.getElementById('formModalTitle').textContent = 'Yeni Məhsul';
  document.getElementById('formSubmitBtn').innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Əlavə Et
  `;

  // Form sıfırla
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('formError').textContent = '';
  document.getElementById('githubPreview').classList.remove('visible');

  openFormModal();
}

function openEditForm(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  state.editingId = id;
  document.getElementById('formModalTitle').textContent = 'Məhsulu Redaktə Et';
  document.getElementById('formSubmitBtn').innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Yadda Saxla
  `;

  // Form doldur
  document.getElementById('productId').value          = product.id;
  document.getElementById('productName').value        = product.name;
  document.getElementById('productPrice').value       = product.price;
  document.getElementById('productCategory').value    = product.category;
  document.getElementById('productImagePrefix').value = product.imagePrefix;
  document.getElementById('productImageCount').value  = product.imageCount;
  document.getElementById('productDesc').value        = product.description || '';
  document.getElementById('formError').textContent    = '';

  // GitHub preview yenilə
  updateGitHubPreview(product.imagePrefix, product.imageCount);

  openFormModal();
}

function openFormModal() {
  document.getElementById('productFormOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('productName').focus(), 100);
}

function closeFormModal() {
  document.getElementById('productFormOverlay').classList.remove('open');
  document.body.style.overflow = '';
  state.editingId = null;
}

/* ──────────────────────────────────────────
   DELETE CONFIRM
────────────────────────────────────────── */
function openDeleteConfirm(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  state.deleteTargetId = id;
  document.getElementById('deleteProductName').textContent = product.name;
  document.getElementById('deleteConfirmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteConfirm() {
  document.getElementById('deleteConfirmOverlay').classList.remove('open');
  document.body.style.overflow = '';
  state.deleteTargetId = null;
}

function confirmDelete() {
  if (!state.deleteTargetId) return;

  state.products = state.products.filter(p => p.id !== state.deleteTargetId);
  saveProducts(state.products);
  applyFilters();
  updateStats();
  closeDeleteConfirm();
  showToast('Məhsul silindi.', 'success');
}

/* ──────────────────────────────────────────
   FORM SUBMIT (Add / Edit)
────────────────────────────────────────── */
function handleFormSubmit(e) {
  e.preventDefault();

  const name        = document.getElementById('productName').value.trim();
  const price       = parseFloat(document.getElementById('productPrice').value);
  const category    = document.getElementById('productCategory').value;
  const imagePrefix = document.getElementById('productImagePrefix').value.trim();
  const imageCount  = parseInt(document.getElementById('productImageCount').value, 10);
  const description = document.getElementById('productDesc').value.trim();
  const errorEl     = document.getElementById('formError');

  // Validation
  if (!name) {
    errorEl.textContent = 'Məhsul adı tələb olunur.';
    document.getElementById('productName').focus();
    return;
  }
  if (isNaN(price) || price < 0) {
    errorEl.textContent = 'Düzgün qiymət daxil edin.';
    document.getElementById('productPrice').focus();
    return;
  }
  if (!category) {
    errorEl.textContent = 'Kateqoriya seçin.';
    document.getElementById('productCategory').focus();
    return;
  }
  if (!imagePrefix) {
    errorEl.textContent = 'Şəkil prefiksi tələb olunur.';
    document.getElementById('productImagePrefix').focus();
    return;
  }
  if (isNaN(imageCount) || imageCount < 1) {
    errorEl.textContent = 'Şəkil sayı ən azı 1 olmalıdır.';
    document.getElementById('productImageCount').focus();
    return;
  }

  errorEl.textContent = '';

  if (state.editingId) {
    // UPDATE
    const idx = state.products.findIndex(p => p.id === state.editingId);
    if (idx !== -1) {
      state.products[idx] = {
        ...state.products[idx],
        name,
        price,
        category,
        imagePrefix,
        imageCount,
        description,
        updatedAt: new Date().toISOString(),
      };
    }
    showToast(`"${name}" yeniləndi.`, 'success');
  } else {
    // CREATE
    const newProduct = {
      id:          nanoid(),
      name,
      price,
      category,
      imagePrefix,
      imageCount,
      description,
      createdAt:   new Date().toISOString(),
    };
    state.products.unshift(newProduct); // Yeni məhsul əvvələ əlavə olunur
    showToast(`"${name}" əlavə edildi.`, 'success');
  }

  saveProducts(state.products);
  applyFilters();
  updateStats();
  closeFormModal();
}

/* ──────────────────────────────────────────
   GITHUB PREVIEW (live update)
────────────────────────────────────────── */
function updateGitHubPreview(prefix, count) {
  const preview = document.getElementById('githubPreview');
  const urlsContainer = document.getElementById('githubPreviewUrls');

  if (!prefix || !count || count < 1) {
    preview.classList.remove('visible');
    return;
  }

  const urls = buildGitHubUrls(prefix, Math.min(count, 5)); // Max 5 preview
  urlsContainer.innerHTML = urls.map(url =>
    `<div class="github-preview-url">→ ${url}</div>`
  ).join('');

  if (count > 5) {
    urlsContainer.insertAdjacentHTML('beforeend',
      `<div class="github-preview-url" style="color: var(--cream-dim);">... +${count - 5} daha</div>`
    );
  }

  preview.classList.add('visible');
}

function initGitHubPreviewListeners() {
  const prefixInput = document.getElementById('productImagePrefix');
  const countInput  = document.getElementById('productImageCount');

  const update = () => {
    const prefix = prefixInput.value.trim();
    const count  = parseInt(countInput.value, 10) || 1;
    updateGitHubPreview(prefix, count);
  };

  prefixInput.addEventListener('input', update);
  countInput.addEventListener('input', update);
}

/* ──────────────────────────────────────────
   SETTINGS
────────────────────────────────────────── */
function loadSettingsToForm() {
  const s = state.settings;
  document.getElementById('settingOwner').value    = s.githubOwner;
  document.getElementById('settingRepo').value     = s.githubRepo;
  document.getElementById('settingBranch').value   = s.githubBranch;
  document.getElementById('settingWhatsapp').value = s.whatsapp;
}

function saveSettingsFromForm() {
  state.settings = {
    githubOwner:  document.getElementById('settingOwner').value.trim(),
    githubRepo:   document.getElementById('settingRepo').value.trim(),
    githubBranch: document.getElementById('settingBranch').value.trim() || 'main',
    whatsapp:     document.getElementById('settingWhatsapp').value.trim(),
  };
  saveSettings(state.settings);
  showToast('Parametrlər yadda saxlandı.', 'success');
}

function changePassword() {
  const newPass     = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;

  if (!newPass || newPass.length < 6) {
    showToast('Şifrə ən azı 6 simvol olmalıdır.', 'error');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('Şifrələr uyğun gəlmir.', 'error');
    return;
  }

  const creds = loadCredentials();
  creds.password = newPass;
  saveCredentials(creds);

  document.getElementById('newPassword').value     = '';
  document.getElementById('confirmPassword').value = '';
  showToast('Şifrə uğurla dəyişdirildi.', 'success');
}

function clearAllProducts() {
  if (!confirm('Bütün məhsulları silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!')) return;
  state.products = [];
  saveProducts([]);
  applyFilters();
  updateStats();
  showToast('Bütün məhsullar silindi.', 'success');
}

/* ──────────────────────────────────────────
   VIEW SWITCHING
────────────────────────────────────────── */
function switchView(viewName) {
  document.querySelectorAll('.admin-view').forEach(v => v.style.display = 'none');
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`view${capitalize(viewName)}`).style.display = 'block';
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

  if (viewName === 'settings') loadSettingsToForm();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ──────────────────────────────────────────
   ESCAPE HTML (XSS protection)
────────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ──────────────────────────────────────────
   LOGIN FORM
────────────────────────────────────────── */
function initLoginForm() {
  const form    = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  // Password toggle
  const toggleBtn  = document.getElementById('togglePass');
  const passInput  = document.getElementById('loginPass');
  const eyeShow    = toggleBtn.querySelector('.eye-show');
  const eyeHide    = toggleBtn.querySelector('.eye-hide');

  toggleBtn.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    eyeShow.style.display = isPass ? 'none' : 'block';
    eyeHide.style.display = isPass ? 'block' : 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    if (login(username, password)) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      errorEl.textContent = '';
      showAdminLayout();
      initDashboard();
    } else {
      errorEl.textContent = 'İstifadəçi adı və ya şifrə yanlışdır.';
      passInput.value = '';
      passInput.focus();
    }
  });
}

/* ──────────────────────────────────────────
   DASHBOARD INIT (after login)
────────────────────────────────────────── */
function initDashboard() {
  // Load data
  state.products = loadProducts();
  state.settings = loadSettings();

  // Initial render
  applyFilters();
  updateStats();

  // Sidebar nav
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Add product button
  document.getElementById('addProductBtn').addEventListener('click', openAddForm);

  // Product form
  document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('formModalClose').addEventListener('click', closeFormModal);
  document.getElementById('formCancelBtn').addEventListener('click', closeFormModal);

  // Close form modal on overlay click
  document.getElementById('productFormOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('productFormOverlay')) closeFormModal();
  });

  // Delete confirm
  document.getElementById('deleteModalClose').addEventListener('click', closeDeleteConfirm);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteConfirm);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);

  document.getElementById('deleteConfirmOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteConfirmOverlay')) closeDeleteConfirm();
  });

  // Search
  document.getElementById('adminSearch').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyFilters();
  });

  // Category filter
  document.getElementById('adminFilterCat').addEventListener('change', (e) => {
    state.filterCategory = e.target.value;
    applyFilters();
  });

  // Settings
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettingsFromForm);
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllProducts);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Mobile sidebar
  const toggle  = document.getElementById('adminMenuToggle');
  const sidebar = document.getElementById('adminSidebar');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== toggle
    ) {
      sidebar.classList.remove('open');
    }
  });

  // GitHub preview listeners
  initGitHubPreviewListeners();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('productFormOverlay').classList.contains('open')) closeFormModal();
      if (document.getElementById('deleteConfirmOverlay').classList.contains('open')) closeDeleteConfirm();
    }
  });
}

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
function init() {
  initLoginForm();

  if (isLoggedIn()) {
    showAdminLayout();
    initDashboard();
  } else {
    showLoginScreen();
  }
}

// Make functions globally accessible (called from inline onclick)
window.openEditForm    = openEditForm;
window.openDeleteConfirm = openDeleteConfirm;

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
