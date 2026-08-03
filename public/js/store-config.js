// Busca as configurações da loja (aberto/fechado, contatos, tema básico)
// direto do Supabase do painel admin (acai-ki-delicia-admin), via anon key
// público — protegido por RLS lá, só libera leitura da linha de config.
// Se a busca falhar, o site continua funcionando com os valores fixos
// já escritos no HTML: isso aqui só sobrescreve quando dá certo.
(function () {
  const ICON = {
    clock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 1.9"/></svg>',
    scooter: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="6" cy="17.5" r="2.8"/><circle cx="18.5" cy="17.5" r="2.8"/><path d="M8.8 17.5h6.9M15.7 17.5 13 6.5h-2.6M13.6 9.5h4l2.2 5.4"/></svg>',
    truck: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6.5h10.5v10H3zM13.5 10h3.8l2.7 3.1v3.4h-6.5z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    cart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.1a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.55L21 8H5.4"/></svg>',
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const SUPABASE_URL = 'https://lungknnnbddzgjvemdlp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_2sr3hUBpek8LqSOBOwLMkA_TsIheip3';
  const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

  function formatPrice(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function updateWhatsappLinks(number) {
    document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
      const query = new URL(link.href).search;
      link.href = `https://wa.me/${number}${query}`;
    });
    window.__STORE_WHATSAPP__ = number;
  }

  function updateInstagramLinks(url) {
    document.querySelectorAll('[data-instagram-link]').forEach((link) => {
      link.href = url;
    });
  }

  function updateLogo(url) {
    document.getElementById('navLogo')?.setAttribute('src', url);
    document.getElementById('footerLogo')?.setAttribute('src', url);
  }

  // Nome da loja (Configurações no painel) reflete nos lugares que dependem
  // só de texto renderizado. Título da aba, alt da logo e rodapé — todos
  // lidos por gente, não por robô. Meta tags de compartilhamento (og:*,
  // twitter:*) e o JSON-LD ficam de fora de propósito: crawler de rede
  // social e buscador leem o HTML puro, antes do JS rodar, então reescrever
  // esses valores aqui não teria efeito nenhum no link que aparece
  // compartilhado — precisaria virar HTML gerado no servidor pra valer.
  function updateStoreName(name) {
    if (!name) return;
    document.title = `${name} | Açaí premium em Perus, SP`;
    const navLogo = document.getElementById('navLogo');
    const footerLogo = document.getElementById('footerLogo');
    if (navLogo) navLogo.alt = name;
    if (footerLogo) footerLogo.alt = name;
    const footerBrandName = document.getElementById('footerBrandName');
    if (footerBrandName) footerBrandName.textContent = name;
  }

  function updateHeroVideo(url) {
    const video = document.getElementById('heroVideo');
    if (!video) return;
    video.setAttribute('src', url);
    video.load();
  }

  // Vídeo do topo apagado no painel. Só é chamado quando as configurações
  // CHEGARAM e vieram sem vídeo — sem rede a função nem roda, e o arquivo do
  // repositório continua tocando. Sem essa distinção o cliente não conseguia
  // remover o vídeo: limpar o campo devolvia o estático do HTML.
  function removeHeroVideo() {
    const video = document.getElementById('heroVideo');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    document.querySelector('.hero-grid')?.classList.add('hero-sem-midia');
  }

  function revealSocialLink(id, url) {
    if (!url) return;
    const li = document.getElementById(id);
    const link = li?.querySelector('a');
    if (!li || !link) return;
    link.href = url;
    li.hidden = false;
  }

  function updateFooterText(id, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function updateClosedBanner(isOpen, message) {
    const banner = document.getElementById('storeClosedBanner');
    if (!banner) return;
    if (isOpen !== false) {
      banner.hidden = true;
      return;
    }
    banner.textContent = message || 'Estamos fechados no momento. Voltamos já já!';
    banner.hidden = false;
  }

  function updateInfoStrip(settings, zones) {
    const strip = document.getElementById('storeInfoStrip');
    if (!strip) return;

    const parts = [];
    if (settings.hours) parts.push(`${ICON.clock} ${esc(settings.hours)}`);
    if (settings.avg_time) parts.push(`${ICON.scooter} Entrega em ${esc(settings.avg_time)}`);

    // Com zonas cadastradas não existe "a" taxa — anunciar uma só seria
    // prometer errado pra metade dos bairros. Mostra a faixa; o valor exato
    // aparece no carrinho quando o cliente escolhe o bairro.
    if (zones.length > 0) {
      const fees = zones.map((zone) => Number(zone.fee));
      const min = Math.min(...fees);
      const max = Math.max(...fees);
      parts.push(
        min === max
          ? `${ICON.truck} Taxa de entrega: ${formatPrice(min)}`
          : `${ICON.truck} Taxa de entrega: ${formatPrice(min)} a ${formatPrice(max)}`,
      );
    } else if (settings.delivery_fee !== null && settings.delivery_fee !== undefined) {
      parts.push(`${ICON.truck} Taxa de entrega: ${formatPrice(settings.delivery_fee)}`);
    }

    if (settings.min_order !== null && settings.min_order !== undefined) {
      parts.push(`${ICON.cart} Pedido mínimo: ${formatPrice(settings.min_order)}`);
    }

    if (parts.length === 0) {
      strip.hidden = true;
      return;
    }
    strip.innerHTML = parts.join('<span class="info-strip-sep">·</span>');
    strip.hidden = false;
  }

  /* Bairro deixa de ser texto livre e passa a ser escolha na lista de zonas.
     Isso é o que torna a taxa determinística: o valor vem do id escolhido, não
     de comparar a grafia que o cliente digitou.

     Troca o <input> do HTML por um <select> só quando as zonas carregam. Se a
     busca falhar, o input continua lá e o checkout volta ao texto livre com a
     taxa única — mesma lógica de fallback do resto deste arquivo. */
  function buildNeighborhoodSelect(zones) {
    const input = document.getElementById('cartNeighborhood');
    if (!input || zones.length === 0) return;
    if (input.tagName === 'SELECT') return;

    const select = document.createElement('select');
    select.id = 'cartNeighborhood';
    select.className = input.className;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Escolha o bairro';
    select.appendChild(placeholder);

    zones.forEach((zone) => {
      const option = document.createElement('option');
      option.value = zone.id;
      const fee = Number(zone.fee);
      option.textContent = `${zone.name} — ${fee > 0 ? formatPrice(fee) : 'grátis'}`;
      select.appendChild(option);
    });

    input.replaceWith(select);
    // O carrinho recalcula a taxa a cada troca de bairro.
    select.addEventListener('change', () => {
      document.dispatchEvent(new CustomEvent('cart:refresh'));
    });
  }

  async function loadDeliveryZones() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/delivery_zones?is_active=eq.true&select=id,name,fee&order=sort_order.asc,name.asc`,
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      if (!response.ok) return [];
      const zones = await response.json();
      return Array.isArray(zones) ? zones : [];
    } catch {
      return [];
    }
  }

  async function loadStoreConfig() {
    try {
      const [response, zones] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/store_settings?id=eq.${SETTINGS_ID}&select=*`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        }),
        loadDeliveryZones(),
      ]);

      // As zonas e o mínimo ficam no window porque é o script.js que calcula o
      // total do carrinho — mas os dois valores são só previsão pra o cliente
      // ver. Quem cobra é o servidor, que recalcula tudo contra o banco.
      window.__DELIVERY_ZONES__ = zones;
      buildNeighborhoodSelect(zones);

      if (!response.ok) return;

      const [settings] = await response.json();
      if (!settings) return;

      window.__MIN_ORDER__ = Number(settings.min_order ?? 0);
      window.__DELIVERY_FEE__ = Number(settings.delivery_fee ?? 0);

      updateStoreName(settings.name);
      if (settings.whatsapp) updateWhatsappLinks(settings.whatsapp);
      if (settings.instagram_url) updateInstagramLinks(settings.instagram_url);
      if (settings.logo_url) updateLogo(settings.logo_url);
      // Chegou aqui = as configurações vieram do painel. Então vídeo vazio é
      // decisão do cliente, não "ainda não configurado" — some de verdade.
      if (settings.hero_video_url) updateHeroVideo(settings.hero_video_url);
      else removeHeroVideo();
      revealSocialLink('footerFacebook', settings.facebook_url);
      revealSocialLink('footerTiktok', settings.tiktok_url);
      updateFooterText('footerAddress', settings.address);
      updateFooterText('footerHours', settings.hours);
      updateClosedBanner(settings.is_open, settings.closed_message);
      updateInfoStrip(settings, zones);
    } catch {
      // Sem conexão ou config indisponível: mantém os valores fixos do HTML.
    } finally {
      // Redesenha o carrinho com a taxa e o mínimo que acabaram de chegar.
      // No finally porque o carrinho tem que voltar ao estado coerente mesmo
      // se a config falhar no meio.
      document.dispatchEvent(new CustomEvent('cart:refresh'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStoreConfig);
  } else {
    loadStoreConfig();
  }
})();
