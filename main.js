/**
 * ============================================================
 * TURAN LEATHER — main.js
 * Showcase page logic:
 *  - localStorage data management (shared with admin.js)
 *  - Dynamic product gallery with category filtering
 *  - Product modal with image carousel
 *  - WhatsApp message generator
 *  - Scroll animations (IntersectionObserver)
 *  - Navbar scroll behavior
 *  - Mobile menu
 * ============================================================
 *
 * Data Model (shared with admin):
 * {
 *   id:          string   — nanoid
 *   name:        string   — məhsul adı
 *   price:       number   — qiymət (AZN)
 *   category:    string   — "cuzdan" | "kemer" | "aksesuar"
 *   imagePrefix: string   — GitHub images/ qovluğundakı fayl prefiksi
 *   imageCount:  number   — şəkil sayı (prefix_1.jpg ... prefix_N.jpg)
 *   description: string   — məhsul təsviri
 *   createdAt:   string   — ISO timestamp
 * }
 *
 * GitHub Image URL pattern:
 *   https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/images/{prefix}_{n}.jpg
 * ============================================================
 */

'use strict';

/* ──────────────────────────────────────────
   CONFIG
   Öz GitHub repo məlumatlarınızı buraya yazın
────────────────────────────────────────── */
const CONFIG = {
  GITHUB_OWNER:  'your-username',      // GitHub istifadəçi adı
  GITHUB_REPO:   'turan-leather-imgs', // Repo adı
  GITHUB_BRANCH: 'main',              // Branch
  WHATSAPP_NUMBER: '994XXXXXXXXX',    // WhatsApp nömrəsi (ölkə kodu ilə)
  STORAGE_KEY: 'turanLeatherProducts',
};

/* ──────────────────────────────────────────
   DEMO DATA (Admin panel boş olduqda göstərilir)
────────────────────────────────────────── */
const DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    name: 'Klassik Bifold Cüzdan',
    price: 120,
    category: 'cuzdan',
    imagePrefix: 'wallet_classic',
    imageCount: 1,
    description: 'Tam dəridən əl işi ilə hazırlanmış klassik bifold cüzdan. 6 kart yuvası, 2 pul bölməsi. Qızılı tikiş detalları ilə tamamlanmış.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/wallet-showcase-gUzxHXEHkZQ6k9kSbjgiav.webp',
  },
  {
    id: 'demo-2',
    name: 'Premium Dəri Kəmər',
    price: 85,
    category: 'kemer',
    imagePrefix: 'belt_premium',
    imageCount: 1,
    description: 'Pirinç toqqa ilə tamamlanmış tam dəri kəmər. Əl işi tikiş, möhkəm konstruksiya. Hər ölçüdə mövcuddur.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/belt-showcase-cRqguELB9dLC2hfzYEkDyM.webp',
  },
  {
    id: 'demo-3',
    name: 'Dəri Aksesuar Dəsti',
    price: 65,
    category: 'aksesuar',
    imagePrefix: 'accessories_set',
    imageCount: 1,
    description: 'Açar qabı, kart holder və sikkə kisəsindən ibarət premium aksesuar dəsti. Hədiyyə üçün ideal seçim.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/accessories-showcase-END7AfVwAHkSTSeao3vaGP.webp',
  },
  {
    id: 'demo-4',
    name: 'Slim Kart Holder',
    price: 45,
    category: 'cuzdan',
    imagePrefix: 'cardholder_slim',
    imageCount: 1,
    description: 'Ultra-nazik dizayn, 4 kart yuvası. Cib üçün mükəmməl ölçü. Tam dəri, qızılı detallar.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/accessories-showcase-END7AfVwAHkSTSeao3vaGP.webp',
  },
  {
    id: 'demo-5',
    name: 'Formal Dəri Kəmər',
    price: 95,
    category: 'kemer',
    imagePrefix: 'belt_formal',
    imageCount: 1,
    description: 'Formal geyimlər üçün nəzərdə tutulmuş premium dəri kəmər. İncə dizayn, gümüş toqqa.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/belt-showcase-cRqguELB9dLC2hfzYEkDyM.webp',
  },
  {
    id: 'demo-6',
    name: 'Dəri Açar Qabı',
    price: 35,
    category: 'aksesuar',
    imagePrefix: 'keyfob',
    imageCount: 1,
    description: 'Tam dəri açar qabı. Qızılı halqa, əl işi tikiş. Gündəlik istifadə üçün möhkəm konstruksiya.',
    createdAt: new Date().toISOString(),
    _demoImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663663487791/iLEzUUBPS2SsqttTwM2ifu/accessories-showcase-END7AfVwAHkSTSeao3vaGP.webp',
  },
];

/* ──────────────────────────────────────────
   CATEGORY LABELS
────────────────────────────────────────── */
const CATEGORY_LABELS = {
  cuzdan:   'Cüzdan',
  kemer:    'Kəmər',
  aksesuar: 'Aksesuar',
};

/* ──────────────────────────────────────────
   STATE
────────────────────────────────────────── */
let state = {
  products:       [],
  filteredProducts: [],
  activeFilter:   'all',
  modal: {
    open:         false,
    product:      null,
    currentImage: 0,
    images:       [],
  },
};

/* ──────────────────────────────────────────
   GITHUB IMAGE URL BUILDER
   Admin paneldən imagePrefix + imageCount gəlir.
   Bu funksiya GitHub raw URL-lərini avtomatik qurur.
────────────────────────────────────────── */
function buildGitHubImageUrls(prefix, count) {
  const urls = [];
  for (let i = 1; i <= count; i++) {
    urls.push(
      `https://raw.githubusercontent.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/images/${prefix}_${i}.jpg`
    );
  }
  return urls;
}

/**
 * Məhsul üçün şəkil URL-lərini qaytarır.
 * Demo məhsullar üçün öncədən generasiya edilmiş şəkilləri istifadə edir.
 * Real məhsullar üçün GitHub URL-lərini qurur.
 */
function getProductImages(product) {
  if (product._demoImage) {
    return [product._demoImage];
  }
  return buildGitHubImageUrls(product.imagePrefix, product.imageCount || 1);
}

/* ──────────────────────────────────────────
   LOCALSTORAGE
────────────────────────────────────────── */
function loadProducts() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[TuranLeather] localStorage oxuma xətası:', e);
  }
  // localStorage boşdursa demo data göstər
  return DEMO_PRODUCTS;
}

/* ──────────────────────────────────────────
   WHATSAPP MESSAGE GENERATOR
────────────────────────────────────────── */
function buildWhatsAppUrl(productName) {
  const message = encodeURIComponent(
    `Salam, "${productName}" haqqında məlumat almaq istəyirəm.`
  );
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
}

/* ──────────────────────────────────────────
   SKELETON LOADING
────────────────────────────────────────── */
function renderSkeletons(count = 6) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    grid.insertAdjacentHTML('beforeend', `
      <div class="skeleton">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--full"></div>
        </div>
      </div>
    `);
  }
}

/* ──────────────────────────────────────────
   PRODUCT CARD RENDERER
────────────────────────────────────────── */
function renderProductCard(product, index) {
  const images = getProductImages(product);
  const mainImage = images[0];
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;
  const whatsappUrl = buildWhatsAppUrl(product.name);

  const card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);
  card.setAttribute('data-category', product.category);
  card.style.animationDelay = `${index * 60}ms`;

  card.innerHTML = `
    <div class="product-card-image">
      <img
        src="${mainImage}"
        alt="${product.name}"
        loading="lazy"
        onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'><rect fill=\\'%23161616\\' width=\\'400\\' height=\\'300\\'/><text fill=\\'%23444\\' font-family=\\'serif\\' font-size=\\'14\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\'>Şəkil yüklənmir</text></svg>'"
      />
      <div class="product-card-overlay"></div>
      <span class="product-card-view">Ətraflı Bax</span>
    </div>
    <div class="product-card-body">
      <div class="product-card-category">${categoryLabel}</div>
      <h3 class="product-card-name">${product.name}</h3>
      <p class="product-card-desc">${product.description || ''}</p>
      <div class="product-card-footer">
        <div class="product-card-price">
          ${product.price} <span>AZN</span>
        </div>
        <a
          href="${whatsappUrl}"
          target="_blank"
          rel="noopener"
          class="product-card-btn"
          onclick="event.stopPropagation()"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Sifariş
        </a>
      </div>
    </div>
  `;

  // Karta klik — modal aç
  card.addEventListener('click', () => openModal(product));

  return card;
}

/* ──────────────────────────────────────────
   GALLERY RENDER
────────────────────────────────────────── */
function renderGallery(filter = 'all') {
  const grid = document.getElementById('productGrid');

  // Filtrə görə məhsulları seç
  const filtered = filter === 'all'
    ? state.products
    : state.products.filter(p => p.category === filter);

  state.filteredProducts = filtered;

  // Boş vəziyyət
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◈</div>
        <h3 class="empty-state-title">Məhsul tapılmadı</h3>
        <p class="empty-state-desc">Bu kateqoriyada hələ məhsul əlavə edilməyib.</p>
      </div>
    `;
    return;
  }

  // Skeleton göstər, sonra real kartlar
  renderSkeletons(Math.min(filtered.length, 6));

  setTimeout(() => {
    grid.innerHTML = '';
    filtered.forEach((product, index) => {
      const card = renderProductCard(product, index);
      grid.appendChild(card);
    });
  }, 400);
}

/* ──────────────────────────────────────────
   FILTER TABS
────────────────────────────────────────── */
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      if (filter === state.activeFilter) return;

      state.activeFilter = filter;

      // Active class yenilə
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      renderGallery(filter);
    });
  });
}

/* ──────────────────────────────────────────
   MODAL
────────────────────────────────────────── */
function openModal(product) {
  const images = getProductImages(product);
  state.modal = {
    open: true,
    product,
    currentImage: 0,
    images,
  };

  // DOM elementlərini doldur
  document.getElementById('modalCategory').textContent =
    CATEGORY_LABELS[product.category] || product.category;
  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalPrice').innerHTML =
    `${product.price} <span>AZN</span>`;
  document.getElementById('modalDesc').textContent =
    product.description || 'Məhsul haqqında ətraflı məlumat yoxdur.';

  // WhatsApp linki
  document.getElementById('modalWhatsapp').href = buildWhatsAppUrl(product.name);

  // Carousel
  renderCarousel(images, 0);

  // Overlay aç
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Focus trap
  document.getElementById('modalClose').focus();
}

function closeModal() {
  state.modal.open = false;
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCarousel(images, activeIndex) {
  const mainImg = document.getElementById('carouselMainImg');
  const thumbsContainer = document.getElementById('carouselThumbs');

  // Ana şəkil
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = images[activeIndex];
    mainImg.style.opacity = '1';
  }, 150);

  // Thumbnails
  thumbsContainer.innerHTML = '';
  if (images.length > 1) {
    images.forEach((url, i) => {
      const thumb = document.createElement('button');
      thumb.className = `carousel-thumb${i === activeIndex ? ' active' : ''}`;
      thumb.setAttribute('aria-label', `Şəkil ${i + 1}`);
      thumb.innerHTML = `<img src="${url}" alt="Şəkil ${i + 1}" loading="lazy" />`;
      thumb.addEventListener('click', () => {
        state.modal.currentImage = i;
        renderCarousel(images, i);
      });
      thumbsContainer.appendChild(thumb);
    });
    thumbsContainer.style.display = 'flex';
  } else {
    thumbsContainer.style.display = 'none';
  }

  // Arrow görünürlüyü
  document.getElementById('carouselPrev').style.display =
    images.length > 1 ? 'flex' : 'none';
  document.getElementById('carouselNext').style.display =
    images.length > 1 ? 'flex' : 'none';
}

function carouselNavigate(direction) {
  const { images, currentImage } = state.modal;
  const newIndex = (currentImage + direction + images.length) % images.length;
  state.modal.currentImage = newIndex;
  renderCarousel(images, newIndex);
}

function initModal() {
  // Close button
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Overlay click (outside panel)
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Carousel arrows
  document.getElementById('carouselPrev').addEventListener('click', () => carouselNavigate(-1));
  document.getElementById('carouselNext').addEventListener('click', () => carouselNavigate(1));

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!state.modal.open) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft')  carouselNavigate(-1);
    if (e.key === 'ArrowRight') carouselNavigate(1);
  });

  // Touch swipe
  let touchStartX = 0;
  const panel = document.getElementById('modalPanel');
  panel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  panel.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      carouselNavigate(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
}

/* ──────────────────────────────────────────
   NAVBAR SCROLL
────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ──────────────────────────────────────────
   MOBILE MENU
────────────────────────────────────────── */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileClose');
  const mobileLinks = menu.querySelectorAll('a, .mobile-link');

  const openMenu = () => {
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));
}

/* ──────────────────────────────────────────
   SCROLL REVEAL (IntersectionObserver)
────────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-stagger')
    .forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────
   WHATSAPP LINKS — nömrəni yenilə
────────────────────────────────────────── */
function updateWhatsAppLinks() {
  const generalUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('Salam, Turan Leather haqqında məlumat almaq istəyirəm.')}`;
  const navWa = document.getElementById('navWhatsapp');
  const heroWa = document.getElementById('heroWhatsapp');
  const footerWa = document.getElementById('footerWhatsapp');

  if (navWa) navWa.href = generalUrl;
  if (heroWa) heroWa.href = generalUrl;
  if (footerWa) footerWa.href = generalUrl;
}

/* ──────────────────────────────────────────
   STORAGE CHANGE LISTENER
   Admin paneldən dəyişiklik olduqda avtomatik yenilə
────────────────────────────────────────── */
function initStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG.STORAGE_KEY) {
      state.products = loadProducts();
      renderGallery(state.activeFilter);
    }
  });
}

/* ──────────────────────────────────────────
   SMOOTH SCROLL for anchor links
────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
function init() {
  // Məhsulları yüklə
  state.products = loadProducts();

  // UI komponentlərini başlat
  initNavbar();
  initMobileMenu();
  initModal();
  initFilterTabs();
  initScrollReveal();
  initStorageListener();
  initSmoothScroll();
  updateWhatsAppLinks();

  // Qalereyanı render et
  renderGallery('all');
}

// DOM hazır olduqda başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
