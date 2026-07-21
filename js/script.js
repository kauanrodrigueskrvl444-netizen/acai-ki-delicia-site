const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeaderScroll = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  updateHeaderScroll();
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
}

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
      video.closest('.hero-image-frame, .launch-card-media, .feature-card-media')?.classList.add('is-placeholder');
    }
  };
  video.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
});

const menuFilters = document.getElementById('menuFilters');
if (menuFilters) {
  const categories = document.querySelectorAll('.menu-category');

  menuFilters.addEventListener('click', (event) => {
    const button = event.target.closest('.menu-filter');
    if (!button) return;

    menuFilters.querySelectorAll('.menu-filter').forEach((btn) => {
      btn.classList.toggle('is-active', btn === button);
    });

    const filter = button.dataset.filter;
    categories.forEach((category) => {
      const matches = filter === 'todos' || category.dataset.category === filter;
      category.classList.toggle('is-hidden', !matches);
    });
  });
}

// ---- Carrinho ----
const CART_STORAGE_KEY = 'acai-ki-delicia-cart';
const WHATSAPP_NUMBER = '5511993996423';

const cartToggle = document.getElementById('cartToggle');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartClose = document.getElementById('cartClose');
const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartFooterEl = document.getElementById('cartFooter');
const cartTotalEl = document.getElementById('cartTotal');
const cartCheckoutBtn = document.getElementById('cartCheckout');

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateQuantity(name, delta) {
  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.name !== name);
  }
  saveCart();
  renderCart();
}

function addToCart(name, price) {
  const existing = cart.find((item) => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function renderCart() {
  if (cartCountEl) {
    const count = cartCount();
    cartCountEl.textContent = String(count);
    cartCountEl.classList.toggle('is-visible', count > 0);
  }

  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = '';
  cartEmptyEl?.classList.toggle('is-hidden', cart.length > 0);
  cartFooterEl?.classList.toggle('is-hidden', cart.length === 0);

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const nameEl = document.createElement('span');
    nameEl.className = 'cart-item-name';
    nameEl.textContent = item.name;
    const priceEl = document.createElement('span');
    priceEl.className = 'cart-item-price';
    priceEl.textContent = formatPrice(item.price);
    info.append(nameEl, priceEl);

    const qty = document.createElement('div');
    qty.className = 'cart-item-qty';
    const decreaseBtn = document.createElement('button');
    decreaseBtn.className = 'cart-qty-btn';
    decreaseBtn.setAttribute('aria-label', 'Diminuir quantidade');
    decreaseBtn.textContent = '−';
    decreaseBtn.addEventListener('click', () => updateQuantity(item.name, -1));
    const qtyValue = document.createElement('span');
    qtyValue.textContent = String(item.quantity);
    const increaseBtn = document.createElement('button');
    increaseBtn.className = 'cart-qty-btn';
    increaseBtn.setAttribute('aria-label', 'Aumentar quantidade');
    increaseBtn.textContent = '+';
    increaseBtn.addEventListener('click', () => updateQuantity(item.name, 1));
    qty.append(decreaseBtn, qtyValue, increaseBtn);

    row.append(info, qty);
    cartItemsEl.appendChild(row);
  });

  if (cartTotalEl) cartTotalEl.textContent = formatPrice(cartTotal());
}

function openCart() {
  cartDrawer?.classList.add('is-open');
  cartOverlay?.classList.add('is-open');
}

function closeCart() {
  cartDrawer?.classList.remove('is-open');
  cartOverlay?.classList.remove('is-open');
}

let cart = loadCart();

cartToggle?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-to-cart]');
  if (!button) return;

  const container = button.closest('[data-price]');
  if (!container) return;

  const nameEl = container.querySelector('.menu-item-name, .product-card-title');
  const name = nameEl?.textContent.trim();
  const price = parseFloat(container.dataset.price);

  if (!name || Number.isNaN(price)) return;
  addToCart(name, price);
});

cartCheckoutBtn?.addEventListener('click', () => {
  if (cart.length === 0) return;

  const lines = cart.map(
    (item) => `- ${item.quantity}x ${item.name} — ${formatPrice(item.price * item.quantity)}`
  );
  const message = `Olá! Gostaria de fazer o seguinte pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(cartTotal())}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
});

renderCart();

// ---- Monte seu Açaí — builder ----
const builderCheckboxes = document.querySelectorAll('[data-builder-item]');
const builderSummaryList = document.getElementById('builderSummaryList');
const builderSummaryEmpty = document.getElementById('builderSummaryEmpty');
const builderSummaryTotal = document.getElementById('builderSummaryTotal');
const builderAddAllBtn = document.getElementById('builderAddAll');

function getBuilderSelection() {
  return Array.from(builderCheckboxes).filter((checkbox) => checkbox.checked);
}

function renderBuilderSummary() {
  if (!builderSummaryList) return;

  const selected = getBuilderSelection();
  builderSummaryList.querySelectorAll('.builder-summary-row').forEach((row) => row.remove());
  builderSummaryEmpty?.classList.toggle('is-hidden', selected.length > 0);

  let total = 0;
  selected.forEach((checkbox) => {
    const price = parseFloat(checkbox.dataset.price);
    total += price;

    const row = document.createElement('div');
    row.className = 'builder-summary-row';
    const name = document.createElement('span');
    name.textContent = checkbox.dataset.name;
    const priceEl = document.createElement('span');
    priceEl.textContent = formatPrice(price);
    row.append(name, priceEl);
    builderSummaryList.appendChild(row);
  });

  if (builderSummaryTotal) builderSummaryTotal.textContent = formatPrice(total);
}

builderCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', renderBuilderSummary);
});

builderAddAllBtn?.addEventListener('click', () => {
  const selected = getBuilderSelection();
  if (selected.length === 0) return;

  selected.forEach((checkbox) => {
    addToCart(checkbox.dataset.name, parseFloat(checkbox.dataset.price));
  });

  builderCheckboxes.forEach((checkbox) => {
    if (!checkbox.disabled) checkbox.checked = false;
  });
  renderBuilderSummary();
});

renderBuilderSummary();
