// Liga o cardápio da landing page ao painel admin.
//
// A LP continua sendo a LP: o HTML, o layout e as animações são os mesmos.
// Este arquivo só substitui os DADOS estáticos pelos do Supabase — preço,
// disponibilidade e adicionais passam a ser controlados pelo painel.
//
// O casamento entre o card da página e o produto do banco é feito pelo NOME
// (o importador leu os nomes deste mesmo HTML, então batem por construção).
// Se um produto não for encontrado, o card fica exatamente como está no HTML:
// a página nunca quebra por causa do banco.
(function () {
  const SUPABASE_URL = 'https://lungknnnbddzgjvemdlp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_2sr3hUBpek8LqSOBOwLMkA_TsIheip3';

  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const formatPrice = (v) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // catálogo exposto pro script.js (modal e carrinho consomem daqui)
  window.__CATALOG__ = { byName: new Map(), ready: false };

  function applyPrice(el, price) {
    // menu-item: <span class="menu-item-price"><s>..</s><strong>R$30,00</strong></span>
    const strong = el.querySelector('.menu-item-price strong');
    if (strong) {
      strong.textContent = formatPrice(price);
      return;
    }
    // product-card: <span class="product-card-price"><s>..</s>R$29,99</span>
    const wrap = el.querySelector('.product-card-price');
    if (!wrap) return;
    const last = wrap.lastChild;
    if (last && last.nodeType === Node.TEXT_NODE) last.textContent = formatPrice(price);
  }

  function applyImage(el, imageUrl) {
    // Sem foto cadastrada no painel: mantém a imagem original do HTML.
    if (!imageUrl) return;
    const img = el.querySelector('.product-card-image, .menu-item-thumb');
    if (!img) return;

    const local = img.getAttribute('src');
    if (!local || img.src === imageUrl) return;

    // Se a foto do painel não carregar (URL quebrada, storage fora do ar),
    // volta pra imagem local em vez de deixar o card no placeholder. O
    // handler de placeholder do script.js roda no mesmo evento de erro, então
    // a limpeza espera o load da imagem local pra não depender da ordem.
    img.addEventListener(
      'error',
      () => {
        img.addEventListener(
          'load',
          () => {
            img.closest('.product-card-media')?.classList.remove('is-placeholder');
            img.style.removeProperty('display');
          },
          { once: true },
        );
        img.src = local;
      },
      { once: true },
    );

    img.src = imageUrl;
  }

  function syncCard(el, product) {
    el.dataset.productId = product.id;
    el.dataset.price = product.base_price;
    el.dataset.hasComplements = product.groups.length > 0 ? '1' : '0';

    applyPrice(el, product.base_price);
    applyImage(el, product.image_url);

    // Produto desativado no painel some do site (mesma regra do cardápio novo).
    if (!product.is_active) el.hidden = true;
  }

  const CART_ICON_SVG =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.1a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.55L21 8H5.4"/></svg>';

  function buildPromoCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.price = product.base_price;
    article.dataset.productId = product.id;
    article.dataset.hasComplements = product.groups.length > 0 ? '1' : '0';

    const media = document.createElement('div');
    media.className = 'product-card-media';

    if (product.promo_badge) {
      const badge = document.createElement('span');
      badge.className = 'product-card-badge';
      badge.textContent = product.promo_badge;
      media.appendChild(badge);
    }

    if (product.image_url) {
      const img = document.createElement('img');
      img.className = 'product-card-image';
      img.src = product.image_url;
      img.alt = product.name;
      img.setAttribute('data-image-fallback', '');
      media.appendChild(img);
    }
    const placeholderText = document.createElement('span');
    placeholderText.className = 'product-card-placeholder-text';
    placeholderText.textContent = 'Foto entra aqui';
    media.appendChild(placeholderText);

    const body = document.createElement('div');
    body.className = 'product-card-body';

    const title = document.createElement('h3');
    title.className = 'product-card-title';
    title.textContent = product.name;
    body.appendChild(title);

    if (product.description) {
      const desc = document.createElement('p');
      desc.className = 'product-card-desc';
      desc.textContent = product.description;
      body.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'product-card-footer';

    const priceEl = document.createElement('span');
    priceEl.className = 'product-card-price';
    if (product.compare_at_price && product.compare_at_price > product.base_price) {
      const old = document.createElement('s');
      old.className = 'product-card-price-old';
      old.textContent = formatPrice(product.compare_at_price);
      priceEl.appendChild(old);
    }
    priceEl.appendChild(document.createTextNode(formatPrice(product.base_price)));
    footer.appendChild(priceEl);

    const button = document.createElement('button');
    button.className = 'btn-cta product-card-btn';
    button.setAttribute('data-add-to-cart', '');
    button.innerHTML = `${CART_ICON_SVG} Adicionar ao Carrinho`;
    footer.appendChild(button);

    body.appendChild(footer);
    article.appendChild(media);
    article.appendChild(body);
    return article;
  }

  // Promoção é sempre um produto real (is_promo=true em `products`), não uma
  // seção separada — o painel controla preço, foto, selo e o "de" riscado no
  // mesmo cadastro do cardápio. Sem nenhum marcado, a seção some: mostrar os
  // 3 cards fixos do HTML aqui seria anunciar desconto que já não existe.
  function syncPromocoes() {
    const grid = document.querySelector('#promocoes .product-cards');
    const section = document.getElementById('promocoes');
    if (!grid || !section) return;

    const promoProducts = [...window.__CATALOG__.byName.values()]
      .filter((p) => p.is_promo && p.is_active)
      .sort((a, b) => a.promo_sort_order - b.promo_sort_order);

    if (promoProducts.length === 0) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    grid.innerHTML = '';
    promoProducts.forEach((product) => grid.appendChild(buildPromoCard(product)));
  }

  async function loadCatalog() {
    let products;
    let categories;
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/products` +
            `?select=id,name,description,base_price,image_url,is_active,is_promo,compare_at_price,promo_badge,promo_sort_order,product_complement_links(complement_groups(id,name,is_required,min_select,max_select,complement_items(id,name,price_delta,is_active)))` +
            `&is_active=eq.true`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        ),
        // RLS pública só devolve categoria ativa — "não veio" já significa desativada.
        fetch(`${SUPABASE_URL}/rest/v1/product_categories?select=name`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        }),
      ]);
      if (!productsRes.ok || !categoriesRes.ok) return;
      products = await productsRes.json();
      categories = await categoriesRes.json();
    } catch {
      return; // sem rede: a LP segue com os preços do HTML
    }

    const activeCategoryNames = new Set(categories.map((c) => norm(c.name)));

    for (const p of products) {
      const groups = (p.product_complement_links || [])
        .flatMap((l) => (Array.isArray(l.complement_groups) ? l.complement_groups : [l.complement_groups]))
        .filter(Boolean)
        .map((g) => ({
          id: g.id,
          name: g.name,
          isRequired: g.is_required,
          minSelect: g.min_select,
          maxSelect: g.max_select,
          items: (g.complement_items || [])
            .filter((i) => i.is_active)
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map((i) => ({ id: i.id, name: i.name, price: Number(i.price_delta) })),
        }))
        .filter((g) => g.items.length > 0);

      window.__CATALOG__.byName.set(norm(p.name), {
        id: p.id,
        name: p.name,
        description: p.description,
        base_price: Number(p.base_price),
        image_url: p.image_url,
        is_active: p.is_active,
        is_promo: p.is_promo,
        compare_at_price: p.compare_at_price === null ? null : Number(p.compare_at_price),
        promo_badge: p.promo_badge,
        promo_sort_order: p.promo_sort_order,
        groups,
      });
    }

    // A RLS só entrega produto ativo pro público, então "não veio na consulta"
    // e "foi desativado no painel" chegam iguais aqui. Como o importador
    // cadastrou todos os itens desta página, tratar ausência como indisponível
    // é o que faz o painel realmente controlar a vitrine. Só vale quando a
    // consulta respondeu — sem rede a função retorna antes e nada é tocado.
    document.querySelectorAll('.product-card, .menu-item').forEach((el) => {
      const nameEl = el.querySelector('.product-card-title, .menu-item-name');
      const product = window.__CATALOG__.byName.get(norm(nameEl && nameEl.textContent));
      if (product) {
        syncCard(el, product);
      } else {
        el.hidden = true;
      }
    });

    syncPromocoes();

    // Categoria desativada no painel esconde a seção inteira. "Mais Vendidos"
    // é uma vitrine curada com produtos de várias categorias, não uma
    // categoria do banco — fica de fora dessa regra, só some pela checagem
    // de itens visíveis logo abaixo.
    document.querySelectorAll('.menu-category').forEach((cat) => {
      if (cat.dataset.category === 'mais-vendidos') return;
      const titleEl = cat.querySelector('.menu-category-title');
      const name = norm(titleEl && titleEl.textContent);
      if (name && !activeCategoryNames.has(name)) cat.hidden = true;
    });

    // Categoria que ficou sem nenhum item visível some junto, pra não deixar
    // um título de seção órfão no cardápio.
    document.querySelectorAll('.menu-category').forEach((cat) => {
      if (cat.hidden) return;
      const visible = [...cat.querySelectorAll('.product-card, .menu-item')].some((el) => !el.hidden);
      cat.hidden = !visible;
    });

    // "Monte seu Açaí": liga cada tamanho de base ao produto do painel e
    // resolve os adicionais marcados pelo nome, pra o pedido do builder
    // seguir o mesmo caminho seguro do resto do site.
    const aplicaPreco = (input, valor) => {
      input.dataset.price = valor;
      const label = input.closest('.builder-option')?.querySelector('.builder-option-price');
      if (label) label.textContent = formatPrice(valor);
    };

    document.querySelectorAll('input[name="builder-base-size"]').forEach((radio) => {
      const product = window.__CATALOG__.byName.get(norm(radio.dataset.name));
      if (!product) return;
      radio.dataset.productId = product.id;
      aplicaPreco(radio, product.base_price);
    });

    const acharAdicional = (nome) => {
      for (const product of window.__CATALOG__.byName.values()) {
        for (const group of product.groups) {
          const hit = group.items.find((i) => norm(i.name) === norm(nome));
          if (hit) return hit;
        }
      }
      return null;
    };

    window.__CATALOG__.complementIdByName = (nome) => acharAdicional(nome)?.id ?? null;

    // Preço dos adicionais do builder também sai do painel.
    document
      .querySelectorAll('input[data-builder-item]:not([name="builder-base-size"])')
      .forEach((input) => {
        const item = acharAdicional(input.dataset.name);
        if (item) aplicaPreco(input, item.price);
      });

    window.__CATALOG__.ready = true;
    document.dispatchEvent(new CustomEvent('catalog:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatalog);
  } else {
    loadCatalog();
  }
})();
