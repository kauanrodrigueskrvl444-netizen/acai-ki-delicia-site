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
  navToggle.classList.toggle('is-active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('no-scroll', isOpen);
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  });
});

document.querySelectorAll('video[data-video-fallback]').forEach((video) => {
  const showPlaceholderIfBroken = () => {
    if (video.error) {
      video.closest('.hero-image-frame, .launch-card-media, .feature-card-media, .launch-feature-frame')?.classList.add('is-placeholder');
    }
  };
  video.addEventListener('error', showPlaceholderIfBroken);
  showPlaceholderIfBroken();
});

document.querySelectorAll('img[data-image-fallback]').forEach((img) => {
  const showPlaceholderIfBroken = () => {
    if (img.complete && img.naturalWidth === 0) {
      const mediaBox = img.closest('.product-card-media');
      if (mediaBox) {
        mediaBox.classList.add('is-placeholder');
      } else {
        img.style.display = 'none';
      }
    }
  };
  img.addEventListener('error', showPlaceholderIfBroken);
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

function addToCart(name, price, quantity = 1, meta = {}) {
  const existing = cart.find((item) => item.name === name);
  if (existing) {
    existing.quantity += quantity;
  } else {
    // productId e complementIds viajam junto pro checkout conseguir revalidar
    // preço e adicionais no servidor. O preço aqui é só o que aparece na tela.
    cart.push({
      name,
      price,
      quantity,
      productId: meta.productId || null,
      complementIds: meta.complementIds || [],
    });
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
  document.getElementById('cartForm')?.classList.toggle('is-hidden', cart.length === 0);

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
  const container = event.target.closest('.product-card, .menu-item');
  if (!container || !container.dataset.price) return;

  // Produto sem adicionais no painel (refrigerante, água, KitKat) vai direto
  // pro carrinho — não faz sentido abrir um modal de adicionais vazio.
  if (container.dataset.hasComplements === '0') {
    const nameEl = container.querySelector('.product-card-title, .menu-item-name');
    addToCart(nameEl.textContent.trim(), parseFloat(container.dataset.price), 1, {
      productId: container.dataset.productId,
      complementIds: [],
    });
    return;
  }

  openProductModal(container);
});

// ---- Finalizar pedido: registra no painel e abre o WhatsApp ----
// Endereco do painel, em ordem de prioridade:
//   1. window.__ADMIN_API__ (js/config.js) — obrigatorio em producao, onde o
//      site e o painel ficam em dominios diferentes;
//   2. mesmo host na porta 3000 — cobre localhost e o IP da rede local, que e
//      como a demo roda na maquina e no celular;
//   3. null — publicado sem configurar. Melhor cair no WhatsApp do que tentar
//      um endereco inventado e deixar o cliente sem resposta.
function resolveAdminApi() {
  if (window.__ADMIN_API__) return String(window.__ADMIN_API__).replace(/\/+$/, '');
  const host = location.hostname;
  const ehLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  return ehLocal ? `${location.protocol}//${host}:3000` : null;
}

const ADMIN_API = resolveAdminApi();

const cartFulfillment = document.getElementById('cartFulfillment');
const cartAddressBox = document.getElementById('cartAddress');
const cartErrorEl = document.getElementById('cartError');

function toggleAddressFields() {
  const isDelivery = !cartFulfillment || cartFulfillment.value === 'entrega';
  cartAddressBox?.classList.toggle('is-hidden', !isDelivery);
}
cartFulfillment?.addEventListener('change', toggleAddressFields);
toggleAddressFields();

function showCartError(message) {
  if (!cartErrorEl) return;
  cartErrorEl.textContent = message;
  cartErrorEl.hidden = !message;
}

function whatsappFallback() {
  const lines = cart.map(
    (item) => `- ${item.quantity}x ${item.name}: ${formatPrice(item.price * item.quantity)}`
  );
  const message = `Olá! Gostaria de fazer o seguinte pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(cartTotal())}`;
  return `https://wa.me/${window.__STORE_WHATSAPP__ || WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

cartCheckoutBtn?.addEventListener('click', async () => {
  if (cart.length === 0) return;
  showCartError('');

  const value = (id) => (document.getElementById(id)?.value || '').trim();
  const fulfillmentType = cartFulfillment?.value === 'retirada' ? 'retirada' : 'entrega';

  if (!value('cartName')) return showCartError('Informe seu nome.');
  if (value('cartPhone').replace(/\D/g, '').length < 8) return showCartError('Informe um WhatsApp válido.');
  if (fulfillmentType === 'entrega') {
    if (!value('cartStreet')) return showCartError('Informe o endereço da entrega.');
    if (!value('cartNumber')) return showCartError('Informe o número.');
    if (!value('cartNeighborhood')) return showCartError('Informe o bairro.');
  }

  // Sem productId não dá pra revalidar no servidor (produto fora do painel),
  // e sem endereço do painel não dá pra registrar o pedido: nos dois casos
  // mantém o comportamento antigo, só WhatsApp.
  if (!ADMIN_API || cart.some((item) => !item.productId)) {
    window.open(whatsappFallback(), '_blank', 'noopener');
    return;
  }

  const original = cartCheckoutBtn.textContent;
  cartCheckoutBtn.disabled = true;
  cartCheckoutBtn.textContent = 'Enviando pedido...';

  try {
    const response = await fetch(`${ADMIN_API}/api/pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: value('cartName'),
        customerPhone: value('cartPhone'),
        fulfillmentType,
        address: value('cartStreet'),
        addressNumber: value('cartNumber'),
        neighborhood: value('cartNeighborhood'),
        referencePoint: value('cartReference'),
        paymentMethod: document.getElementById('cartPayment')?.value || 'pix',
        needsChange: false,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          complementIds: item.complementIds || [],
        })),
      }),
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      showCartError(result.error || 'Não foi possível enviar o pedido. Tente de novo.');
      return;
    }

    cart = [];
    saveCart();
    renderCart();
    closeCart();
    // Mesma coisa de sempre pro cliente: abre o WhatsApp com o pedido.
    window.open(result.whatsappUrl, '_blank', 'noopener');
  } catch {
    // Painel fora do ar: não deixa o cliente na mão, cai no fluxo antigo.
    window.open(whatsappFallback(), '_blank', 'noopener');
  } finally {
    cartCheckoutBtn.disabled = false;
    cartCheckoutBtn.textContent = original;
  }
});

renderCart();

// ---- Modal do produto ----
const COMPLEMENTS = [
  {
    category: 'Frutas',
    items: [
      { name: 'Banana', price: 2.50 },
      { name: 'Uva', price: 2.50 },
      { name: 'Morango', price: 4.00 },
      { name: 'Kiwi', price: 3.00 },
      { name: 'Manga', price: 3.50 },
    ],
  },
  {
    category: 'Secos',
    items: [
      { name: 'Amendoim', price: 3.00 },
      { name: 'Paçoca Santa Helena', price: 3.00 },
    ],
  },
  {
    category: 'Cremes',
    items: [
      { name: 'Nutella', price: 14.00 },
      { name: 'Creme de Avelã', price: 8.00 },
      { name: 'Creme de Ninho', price: 8.00 },
      { name: 'Creme de Ovomaltine', price: 10.00 },
      { name: 'Creme Bueno', price: 7.00 },
      { name: 'Creme de Cookies', price: 7.00 },
      { name: 'Cupuaçu', price: 4.50 },
      { name: 'Leite ninho em pó Nestle', price: 3.50 },
      { name: 'Leite Condensado', price: 2.00 },
      { name: 'Leite em Pó', price: 2.00 },
    ],
  },
  {
    category: 'Chocolates',
    items: [
      { name: 'Bis Branco', price: 3.00 },
      { name: 'Bis Preto', price: 3.00 },
      { name: 'KitKat', price: 7.00 },
      { name: 'Trento Bites', price: 7.00 },
      { name: 'Ovomaltine', price: 3.00 },
      { name: 'Gotas de Chocolate', price: 3.00 },
      { name: 'Ouro Branco', price: 3.00 },
      { name: 'Sonho de Valsa', price: 3.00 },
      { name: 'Twix', price: 3.00 },
      { name: 'Sucrilhos', price: 2.50 },
      { name: 'Chocoball', price: 3.00 },
    ],
  },
];

const productModal = document.getElementById('productModal');
const productModalOverlay = document.getElementById('productModalOverlay');
const productModalClose = document.getElementById('productModalClose');
const productModalMedia = document.getElementById('productModalMedia');
const productModalImage = document.getElementById('productModalImage');
const productModalTitle = document.getElementById('productModalTitle');
const productModalDesc = document.getElementById('productModalDesc');
const productModalBasePrice = document.getElementById('productModalBasePrice');
const productModalComplements = document.getElementById('productModalComplements');
const productModalQtyMinus = document.getElementById('productModalQtyMinus');
const productModalQtyPlus = document.getElementById('productModalQtyPlus');
const productModalQtyValue = document.getElementById('productModalQtyValue');
const productModalAdd = document.getElementById('productModalAdd');
const productModalTotal = document.getElementById('productModalTotal');

let modalProduct = null;
let modalQty = 1;

function renderComplementsList() {
  if (!productModalComplements) return;
  productModalComplements.innerHTML = '';

  // Adicionais vêm do painel (grupos reutilizáveis). A lista fixa do COMPLEMENTS
  // fica como reserva caso o banco não responda — o modal nunca abre vazio.
  const source =
    modalProduct && modalProduct.groups && modalProduct.groups.length
      ? modalProduct.groups.map((g) => ({ category: g.name, items: g.items }))
      : COMPLEMENTS;

  source.forEach((group) => {
    const section = document.createElement('div');
    section.className = 'product-modal-complement-group';

    const title = document.createElement('h4');
    title.className = 'product-modal-complement-title';
    title.textContent = group.category;
    section.appendChild(title);

    group.items.forEach((item) => {
      const label = document.createElement('label');
      label.className = 'builder-option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.complementName = item.name;
      input.dataset.complementPrice = String(item.price);
      if (item.id) input.dataset.complementId = item.id;
      input.addEventListener('change', updateModalTotal);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'builder-option-name';
      nameSpan.textContent = item.name;

      const priceSpan = document.createElement('span');
      priceSpan.className = 'builder-option-price';
      priceSpan.textContent = formatPrice(item.price);

      label.append(input, nameSpan, priceSpan);
      section.appendChild(label);
    });

    productModalComplements.appendChild(section);
  });
}

function getSelectedComplements() {
  if (!productModalComplements) return [];
  return Array.from(productModalComplements.querySelectorAll('input[type="checkbox"]:checked')).map(
    (input) => ({
      id: input.dataset.complementId || null,
      name: input.dataset.complementName,
      price: parseFloat(input.dataset.complementPrice),
    })
  );
}

function updateModalTotal() {
  if (!modalProduct) return;
  const complements = getSelectedComplements();
  const unitPrice = modalProduct.price + complements.reduce((sum, c) => sum + c.price, 0);
  if (productModalTotal) productModalTotal.textContent = formatPrice(unitPrice * modalQty);
}

function openProductModal(container) {
  const nameEl = container.querySelector('.menu-item-name, .product-card-title');
  const name = nameEl?.textContent.trim();
  const price = parseFloat(container.dataset.price);
  if (!name || Number.isNaN(price)) return;

  const descEl = container.querySelector('.product-card-desc');
  const desc = descEl?.textContent.trim() || '';

  const imgEl = container.querySelector('.product-card-image, .menu-item-thumb');
  const imgSrc = imgEl?.getAttribute('src') || '';

  const catalogEntry =
    window.__CATALOG__ && window.__CATALOG__.byName
      ? window.__CATALOG__.byName.get(
          name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''),
        )
      : null;

  modalProduct = {
    name,
    price,
    productId: container.dataset.productId || (catalogEntry && catalogEntry.id) || null,
    groups: catalogEntry ? catalogEntry.groups : [],
  };
  modalQty = 1;

  if (productModalTitle) productModalTitle.textContent = name;
  if (productModalDesc) {
    productModalDesc.textContent = desc;
    productModalDesc.classList.toggle('is-hidden', !desc);
  }
  if (productModalBasePrice) productModalBasePrice.textContent = `Preço base: ${formatPrice(price)}`;
  if (productModalQtyValue) productModalQtyValue.textContent = String(modalQty);

  if (imgSrc && productModalImage) {
    productModalImage.src = imgSrc;
    productModalImage.alt = name;
    productModalMedia?.classList.remove('is-hidden');
  } else {
    productModalMedia?.classList.add('is-hidden');
  }

  renderComplementsList();
  updateModalTotal();

  productModal?.classList.add('is-open');
  productModalOverlay?.classList.add('is-open');
  document.body.classList.add('no-scroll');
}

function closeProductModal() {
  productModal?.classList.remove('is-open');
  productModalOverlay?.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  modalProduct = null;
}

productModalClose?.addEventListener('click', closeProductModal);
productModalOverlay?.addEventListener('click', closeProductModal);

productModalQtyMinus?.addEventListener('click', () => {
  if (modalQty <= 1) return;
  modalQty -= 1;
  if (productModalQtyValue) productModalQtyValue.textContent = String(modalQty);
  updateModalTotal();
});

productModalQtyPlus?.addEventListener('click', () => {
  modalQty += 1;
  if (productModalQtyValue) productModalQtyValue.textContent = String(modalQty);
  updateModalTotal();
});

productModalAdd?.addEventListener('click', () => {
  if (!modalProduct) return;
  const complements = getSelectedComplements();
  const unitPrice = modalProduct.price + complements.reduce((sum, c) => sum + c.price, 0);
  const finalName = complements.length
    ? `${modalProduct.name} (+ ${complements.map((c) => c.name).join(', ')})`
    : modalProduct.name;

  addToCart(finalName, unitPrice, modalQty, {
    productId: modalProduct.productId,
    complementIds: complements.map((c) => c.id).filter(Boolean),
  });
  closeProductModal();
});

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

  // O açaí montado entra como UM item: a base é o produto e o que foi marcado
  // vira adicional. Assim o pedido carrega productId e o servidor consegue
  // revalidar o preço — igual ao resto do cardápio.
  const base = selected.find((c) => c.name === 'builder-base-size');
  const extras = selected.filter((c) => c !== base);
  const catalogo = window.__CATALOG__;

  if (base && base.dataset.productId && catalogo?.complementIdByName) {
    const ids = extras.map((c) => catalogo.complementIdByName(c.dataset.name)).filter(Boolean);
    const preco = selected.reduce((soma, c) => soma + parseFloat(c.dataset.price), 0);
    const nome = extras.length
      ? `${base.dataset.name} (+ ${extras.map((c) => c.dataset.name).join(', ')})`
      : base.dataset.name;

    addToCart(nome, preco, 1, { productId: base.dataset.productId, complementIds: ids });
  } else {
    // Catálogo indisponível: mantém o comportamento antigo, item por item.
    selected.forEach((checkbox) => {
      addToCart(checkbox.dataset.name, parseFloat(checkbox.dataset.price));
    });
  }

  builderCheckboxes.forEach((checkbox) => {
    if (!checkbox.disabled && checkbox.type !== 'radio') checkbox.checked = false;
  });
  renderBuilderSummary();
});

renderBuilderSummary();
// Os preços do builder chegam do painel depois do primeiro render: refaz o
// resumo pra o total não ficar com o valor antigo do HTML.
document.addEventListener('catalog:ready', renderBuilderSummary);
