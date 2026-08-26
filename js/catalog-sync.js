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
    if (!local) return;

    // A miniatura do cardápio é desenhada a 56x56 e a foto do card ocupa a
    // largura do cartão. Pedir a largura certa pra cada uma é o que evita
    // baixar 2 MB pra pintar 56 pixels.
    const largura = img.classList.contains('menu-item-thumb')
      ? window.__IMG__.LARGURA.miniatura
      : window.__IMG__.LARGURA.cartao;
    const remota = window.__IMG__.url(imageUrl, largura);
    if (img.src === remota) return;

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

    img.src = remota;
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

  const FLAME_SVG =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22a7 7 0 0 0 7-7c0-5-4-6-4-10 0 0-3 1.5-3 5 0 1.6-1 2.5-2 2.5S8 11 8 9c0 0-3 2.4-3 6a7 7 0 0 0 7 7Z"/></svg>';

  // `destaque` só é usado pela vitrine "Mais Vendidos", que tem selo próprio
  // (chama e texto fixo) em vez do selo de promoção do cadastro.
  function buildProductCard(product, { destaque = false } = {}) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.price = product.base_price;
    article.dataset.productId = product.id;
    article.dataset.hasComplements = product.groups.length > 0 ? '1' : '0';

    const media = document.createElement('div');
    media.className = 'product-card-media';

    if (destaque) {
      const badge = document.createElement('span');
      badge.className = 'product-card-badge';
      badge.innerHTML = `${FLAME_SVG} Mais Vendido`;
      media.appendChild(badge);
    } else if (product.promo_badge) {
      const badge = document.createElement('span');
      badge.className = 'product-card-badge';
      badge.textContent = product.promo_badge;
      media.appendChild(badge);
    }

    if (product.image_url) {
      const img = document.createElement('img');
      img.className = 'product-card-image';
      window.__IMG__.definir(img, product.image_url, window.__IMG__.LARGURA.cartao);
      img.alt = product.name;
      img.loading = 'lazy';
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

  function buildMenuItem(product) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.dataset.price = product.base_price;
    div.dataset.productId = product.id;
    div.dataset.hasComplements = product.groups.length > 0 ? '1' : '0';

    if (product.image_url) {
      const img = document.createElement('img');
      img.className = 'menu-item-thumb';
      window.__IMG__.definir(img, product.image_url, window.__IMG__.LARGURA.miniatura);
      img.alt = product.name;
      img.loading = 'lazy';
      img.setAttribute('data-image-fallback', '');
      div.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'menu-item-thumb-placeholder';
      div.appendChild(placeholder);
    }

    const name = document.createElement('span');
    name.className = 'menu-item-name';
    name.textContent = product.name;
    div.appendChild(name);

    const priceEl = document.createElement('span');
    priceEl.className = 'menu-item-price';
    if (product.compare_at_price && product.compare_at_price > product.base_price) {
      const old = document.createElement('s');
      old.className = 'menu-item-price-old';
      old.textContent = formatPrice(product.compare_at_price);
      priceEl.appendChild(old);
    }
    const strong = document.createElement('strong');
    strong.textContent = formatPrice(product.base_price);
    priceEl.appendChild(strong);
    div.appendChild(priceEl);

    const button = document.createElement('button');
    button.className = 'menu-item-add';
    button.setAttribute('data-add-to-cart', '');
    button.setAttribute('aria-label', 'Adicionar ao carrinho');
    button.textContent = '+';
    div.appendChild(button);

    return div;
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
    promoProducts.forEach((product) => grid.appendChild(buildProductCard(product)));
  }

  // Cada seção de categoria (exceto Mais Vendidos, que é vitrine curada e
  // fica estática) é montada 100% a partir do banco: produto novo cadastrado
  // no painel aparece aqui sem precisar mexer no HTML nem fazer deploy.
  //
  // Vitrine "Mais Vendidos", no topo do cardápio. Eram três cards fixos no HTML
  // casados por nome — e isso já tinha quebrado calado em produção: o HTML dizia
  // "Açaí Chocopaçoca 500ml", o painel dizia "Cremoso açaí chocopaçoca 500ml", e
  // o card ficava escondido. A vitrine rodava com 2 dos 3 produtos.
  //
  // Agora a seção sai de is_featured, igual Promoções sai de is_promo. Sem
  // nenhum produto marcado, a seção e o filtro somem — vitrine vazia com título
  // é pior que vitrine nenhuma.
  function syncFeatured() {
    const section = document.querySelector('.menu-category[data-category="mais-vendidos"]');
    const grid = section && section.querySelector('.product-cards');
    const filtro = document.querySelector('.menu-filter[data-filter="mais-vendidos"]');
    if (!section || !grid) return;

    const destaques = [...window.__CATALOG__.byName.values()]
      .filter((p) => p.is_featured && p.is_active)
      .sort((a, b) => a.featured_sort_order - b.featured_sort_order);

    if (destaques.length === 0) {
      section.hidden = true;
      if (filtro) filtro.hidden = true;
      return;
    }

    section.hidden = false;
    if (filtro) filtro.hidden = false;
    grid.innerHTML = '';
    destaques.forEach((product) => grid.appendChild(buildProductCard(product, { destaque: true })));
  }

  // As bases do "Monte seu Açaí" já são excluídas na montagem de
  // `categoryProducts` (ver loadCatalog), então não aparecem aqui.
  function syncCategories(categoryProducts) {
    document.querySelectorAll('.menu-category').forEach((cat) => {
      if (cat.dataset.category === 'mais-vendidos') return;

      const titleEl = cat.querySelector('.menu-category-title');
      const items = categoryProducts.get(norm(titleEl && titleEl.textContent)) || [];
      const usesCards = !!cat.querySelector('.product-cards');
      const container = cat.querySelector('.product-cards, .menu-list');
      if (!container) return;

      if (items.length === 0) {
        cat.hidden = true;
        return;
      }

      cat.hidden = false;
      container.innerHTML = '';
      items.forEach((product) => {
        container.appendChild(usesCards ? buildProductCard(product) : buildMenuItem(product));
      });
    });
  }

  // Categoria criada no painel sem seção fixa no HTML (uma categoria nova,
  // além das que já existiam quando o site foi montado) ganha uma seção do
  // zero aqui, no fim do cardápio, na ordem das outras categorias novas —
  // no estilo de lista compacta, o padrão da maioria das seções existentes.
  // Sem isso a categoria nova simplesmente não aparecia em lugar nenhum.
  function syncNewCategories(categories, categoryProducts) {
    const menuCategories = document.querySelector('.menu-categories');
    const menuFilters = document.getElementById('menuFilters');
    if (!menuCategories) return;

    const existingNames = new Set(
      [...document.querySelectorAll('.menu-category-title')].map((el) => norm(el.textContent)),
    );

    categories
      .filter((c) => !existingNames.has(norm(c.name)))
      .forEach((category) => {
        const slug = norm(category.name);
        const items = categoryProducts.get(slug) || [];
        if (items.length === 0) return;

        const section = document.createElement('div');
        section.className = 'menu-category';
        section.dataset.category = slug;

        const title = document.createElement('h3');
        title.className = 'menu-category-title';
        title.textContent = category.name;
        section.appendChild(title);

        const list = document.createElement('div');
        list.className = 'menu-list';
        items.forEach((product) => list.appendChild(buildMenuItem(product)));
        section.appendChild(list);

        menuCategories.appendChild(section);

        if (menuFilters) {
          const button = document.createElement('button');
          button.className = 'menu-filter';
          button.dataset.filter = slug;
          button.textContent = category.name;
          menuFilters.appendChild(button);
        }
      });
  }

  // ---- "Monte seu Açaí" montado a partir do painel ----
  //
  // Antes essa seção era uma lista fixa no HTML, casada com o painel por NOME.
  // Bastava o cliente renomear um adicional pra o preço travar no valor velho,
  // ou renomear uma base pra o pedido parar de ser registrado (sem productId o
  // checkout cai no fallback de WhatsApp, sem comanda). E adicional novo nunca
  // aparecia aqui.
  //
  // Agora as bases vêm de is_builder_base e os complementos vêm dos grupos de
  // adicionais ligados à base escolhida. Renomear, criar, desativar e mudar
  // preço passam a refletir sozinhos, sem deploy.
  function criaStep(numero, titulo, aberto) {
    const details = document.createElement('details');
    details.className = 'builder-step';
    details.open = !!aberto;

    const summary = document.createElement('summary');
    summary.className = 'builder-step-title';
    const h3 = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'builder-step-number';
    num.textContent = numero;
    h3.append(num, document.createTextNode(' ' + titulo));
    summary.appendChild(h3);

    const options = document.createElement('div');
    options.className = 'builder-options';

    details.append(summary, options);
    return details;
  }

  function criaOpcao({ tipo, nome, rotulo, preco, productId, complementId, marcado }) {
    const label = document.createElement('label');
    label.className = 'builder-option';

    const input = document.createElement('input');
    input.type = tipo;
    if (tipo === 'radio') input.name = 'builder-base-size';
    input.setAttribute('data-builder-item', '');
    input.dataset.name = nome;
    input.dataset.price = preco;
    if (productId) input.dataset.productId = productId;
    if (complementId) input.dataset.complementId = complementId;
    input.checked = !!marcado;

    const nomeEl = document.createElement('span');
    nomeEl.className = 'builder-option-name';
    nomeEl.textContent = rotulo;

    const precoEl = document.createElement('span');
    precoEl.className = 'builder-option-price';
    precoEl.textContent = formatPrice(preco);

    label.append(input, nomeEl, precoEl);
    return label;
  }

  function syncBuilder() {
    const stepsEl = document.querySelector('.builder-steps');
    const section = document.getElementById('monte-seu-acai');
    if (!stepsEl || !section) return;

    const bases = [...window.__CATALOG__.byName.values()]
      .filter((p) => p.is_builder_base && p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Nenhuma base marcada no painel (migration ainda não aplicada, ou o
    // cliente desmarcou todas): mantém o HTML fixo exatamente como está. A
    // seção continua funcionando com os preços do HTML em vez de sumir.
    if (bases.length === 0) return;

    // O que já estava marcado antes de remontar — por id quando existe, por
    // nome no primeiro render (o HTML fixo não tem id de adicional).
    const marcados = () => {
      const ids = new Set();
      const nomes = new Set();
      stepsEl
        .querySelectorAll('input[data-builder-item]:checked:not([name="builder-base-size"])')
        .forEach((input) => {
          if (input.dataset.complementId) ids.add(input.dataset.complementId);
          nomes.add(norm(input.dataset.name));
        });
      return { ids, nomes };
    };

    const baseAnterior = stepsEl.querySelector('input[name="builder-base-size"]:checked');
    const baseInicial =
      bases.find((b) => b.id === (baseAnterior && baseAnterior.dataset.productId)) ||
      bases.find((b) => norm(b.name) === norm(baseAnterior && baseAnterior.dataset.name)) ||
      bases[0];

    const renderGrupos = (base) => {
      const anteriores = marcados();
      stepsEl.querySelectorAll('.builder-step[data-builder-group]').forEach((el) => el.remove());

      base.groups
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'pt-BR'))
        .forEach((group, i) => {
          const step = criaStep(i + 2, group.name, false);
          step.dataset.builderGroup = group.id;
          const options = step.querySelector('.builder-options');

          group.items.forEach((item) => {
            options.appendChild(
              criaOpcao({
                tipo: 'checkbox',
                nome: item.name,
                rotulo: item.name,
                preco: item.price,
                complementId: item.id,
                marcado: anteriores.ids.has(item.id) || anteriores.nomes.has(norm(item.name)),
              }),
            );
          });

          stepsEl.appendChild(step);
        });
    };

    // Passo 1 (Base) é montado uma vez; os grupos são remontados a cada troca
    // de base, porque grupos de adicionais são ligados por produto no painel e
    // dois tamanhos podem ter listas diferentes.
    const baseStep = criaStep(1, 'Base', true);
    const baseOptions = baseStep.querySelector('.builder-options');
    bases.forEach((base) => {
      baseOptions.appendChild(
        criaOpcao({
          tipo: 'radio',
          nome: base.name,
          rotulo: base.builder_base_label || base.name,
          preco: base.base_price,
          productId: base.id,
          marcado: base.id === baseInicial.id,
        }),
      );
    });

    renderGrupos(baseInicial);
    stepsEl.querySelectorAll('.builder-step:not([data-builder-group])').forEach((el) => el.remove());
    stepsEl.prepend(baseStep);

    stepsEl.addEventListener('change', (event) => {
      const input = event.target;
      if (!input || input.name !== 'builder-base-size') return;
      const base = bases.find((b) => b.id === input.dataset.productId);
      if (base) renderGrupos(base);
    });
  }

  // Colunas do "Monte seu Açaí" e da vitrine "Mais Vendidos". Ficam separadas
  // porque a LP pode ir ao ar antes da migration ser aplicada à mão no SQL
  // Editor (o projeto não está linkado à CLI do Supabase). Pedir coluna
  // inexistente faz o PostgREST devolver 400 e derrubaria o cardápio INTEIRO
  // pros preços velhos do HTML — então nesse caso a consulta é refeita sem
  // elas e só essas duas seções ficam no formato antigo, até a migration rodar.
  const COLUNAS_NOVAS = ',is_builder_base,builder_base_label,is_featured,featured_sort_order';

  function productsUrl(comColunasNovas) {
    return (
      `${SUPABASE_URL}/rest/v1/products` +
      `?select=id,name,description,base_price,image_url,is_active,is_promo,compare_at_price,promo_badge,promo_sort_order,sort_order` +
      (comColunasNovas ? COLUNAS_NOVAS : '') +
      `,product_categories!products_category_id_fkey(name),product_category_links(product_categories(name)),product_complement_links(complement_groups(id,name,sort_order,is_required,min_select,max_select,complement_items(id,name,price_delta,is_active)))` +
      `&is_active=eq.true`
    );
  }

  async function loadCatalog() {
    let products;
    let categories;
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(productsUrl(true), { headers: { apikey: SUPABASE_ANON_KEY } }).then((res) =>
          res.ok ? res : fetch(productsUrl(false), { headers: { apikey: SUPABASE_ANON_KEY } }),
        ),
        // RLS pública só devolve categoria ativa — "não veio" já significa desativada.
        // order=sort_order.asc: categoria nova (sem seção fixa no HTML) entra
        // no fim do cardápio na ordem certa entre as outras categorias novas.
        fetch(`${SUPABASE_URL}/rest/v1/product_categories?select=name,sort_order&order=sort_order.asc`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        }),
      ]);
      if (!productsRes.ok || !categoriesRes.ok) return;
      products = await productsRes.json();
      categories = await categoriesRes.json();
    } catch {
      return; // sem rede: a LP segue com os preços do HTML
    }

    // A consulta cai pro formato antigo quando a migration ainda não rodou, e
    // aí essas colunas simplesmente não vêm. Detectar isso pela presença da
    // chave separa "não existe no banco" de "existe e está desmarcado" — as
    // duas situações pedem comportamentos opostos nas seções abaixo.
    const temColunasNovas = products.length > 0 && Object.hasOwn(products[0], 'is_featured');

    const activeCategoryNames = new Set(categories.map((c) => norm(c.name)));

    for (const p of products) {
      const groups = (p.product_complement_links || [])
        .flatMap((l) => (Array.isArray(l.complement_groups) ? l.complement_groups : [l.complement_groups]))
        .filter(Boolean)
        .map((g) => ({
          id: g.id,
          name: g.name,
          sortOrder: g.sort_order,
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
        sort_order: p.sort_order,
        is_builder_base: !!p.is_builder_base,
        builder_base_label: p.builder_base_label,
        is_featured: !!p.is_featured,
        featured_sort_order: p.featured_sort_order,
        category_name: p.product_categories ? p.product_categories.name : null,
        // Categorias extras (product_category_links) somam à principal — um
        // produto pode aparecer em mais de uma seção da LP (ex: um combo que
        // também é uma marmita) sem duplicar o cadastro.
        extra_category_names: (p.product_category_links || [])
          .map((link) => link.product_categories && link.product_categories.name)
          .filter(Boolean),
        groups,
      });
    }

    // RLS só embute a categoria se ela estiver ativa (mesma regra da consulta
    // em paralelo) — produto de categoria desativada ou sem categoria não
    // entra no balde dela.
    // Base do builder é produto real só pra ter preço próprio, não item de
    // cardápio — sai de todas as seções pra não duplicar o "Monte seu Açaí".
    //
    // Quando a marcação do painel ainda não existe (migration não aplicada, e
    // a consulta caiu no formato antigo), volta a identificar a base pelos
    // nomes fixos do HTML: é frágil, mas é exatamente o que a LP já fazia — o
    // que não pode é a base aparecer duplicada no cardápio enquanto isso.
    const temMarcacaoDeBase = [...window.__CATALOG__.byName.values()].some((p) => p.is_builder_base);
    const nomesDeBaseNoHtml = new Set(
      [...document.querySelectorAll('input[name="builder-base-size"]')].map((el) => norm(el.dataset.name)),
    );
    const ehBase = (product) =>
      temMarcacaoDeBase ? product.is_builder_base : nomesDeBaseNoHtml.has(norm(product.name));

    const categoryProducts = new Map();
    for (const product of window.__CATALOG__.byName.values()) {
      if (ehBase(product)) continue;
      const categoryNames = new Set(
        [product.category_name, ...product.extra_category_names].map(norm).filter(Boolean),
      );
      for (const categoryName of categoryNames) {
        if (!activeCategoryNames.has(categoryName)) continue;
        if (!categoryProducts.has(categoryName)) categoryProducts.set(categoryName, []);
        categoryProducts.get(categoryName).push(product);
      }
    }
    for (const list of categoryProducts.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }

    // "Mais Vendidos" é vitrine curada com produtos de várias categorias, não
    // uma categoria do banco. Quando a marcação do painel ainda não existe
    // (migration não aplicada), mantém o casamento por nome que havia antes,
    // pra a vitrine não sumir enquanto isso.
    //
    // A decisão é pela EXISTÊNCIA da coluna, não por algum produto estar
    // marcado: com a migration aplicada e o cliente desmarcando todos, o certo
    // é a vitrine sumir — não ressuscitar os cards fixos do HTML.
    if (temColunasNovas) {
      syncFeatured();
    } else {
      document.querySelectorAll('.menu-category[data-category="mais-vendidos"] .product-card').forEach((el) => {
        const nameEl = el.querySelector('.product-card-title, .menu-item-name');
        const product = window.__CATALOG__.byName.get(norm(nameEl && nameEl.textContent));
        if (product) {
          syncCard(el, product);
        } else {
          el.hidden = true;
        }
      });
      const maisVendidos = document.querySelector('.menu-category[data-category="mais-vendidos"]');
      if (maisVendidos) {
        const visible = [...maisVendidos.querySelectorAll('.product-card')].some((el) => !el.hidden);
        maisVendidos.hidden = !visible;
      }
    }

    syncPromocoes();
    syncCategories(categoryProducts);
    syncNewCategories(categories, categoryProducts);

    const acharAdicional = (nome) => {
      for (const product of window.__CATALOG__.byName.values()) {
        for (const group of product.groups) {
          const hit = group.items.find((i) => norm(i.name) === norm(nome));
          if (hit) return hit;
        }
      }
      return null;
    };

    // Só sobra pro caminho de fallback: quando nenhuma base está marcada no
    // painel, o builder continua sendo o HTML fixo e o carrinho precisa
    // resolver o adicional pelo nome, como antes. Com o builder montado a
    // partir do banco, cada opção já carrega o id no próprio input.
    window.__CATALOG__.complementIdByName = (nome) => acharAdicional(nome)?.id ?? null;

    syncBuilder();

    window.__CATALOG__.ready = true;
    document.dispatchEvent(new CustomEvent('catalog:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatalog);
  } else {
    loadCatalog();
  }
})();
