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

  function updateInfoStrip(settings) {
    const strip = document.getElementById('storeInfoStrip');
    if (!strip) return;

    const parts = [];
    if (settings.hours) parts.push(`${ICON.clock} ${esc(settings.hours)}`);
    if (settings.avg_time) parts.push(`${ICON.scooter} Entrega em ${esc(settings.avg_time)}`);
    if (settings.delivery_fee !== null && settings.delivery_fee !== undefined) {
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

  async function loadStoreConfig() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/store_settings?id=eq.${SETTINGS_ID}&select=*`,
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      if (!response.ok) return;

      const [settings] = await response.json();
      if (!settings) return;

      if (settings.whatsapp) updateWhatsappLinks(settings.whatsapp);
      if (settings.instagram_url) updateInstagramLinks(settings.instagram_url);
      if (settings.logo_url) updateLogo(settings.logo_url);
      revealSocialLink('footerFacebook', settings.facebook_url);
      revealSocialLink('footerTiktok', settings.tiktok_url);
      updateFooterText('footerAddress', settings.address);
      updateFooterText('footerHours', settings.hours);
      updateClosedBanner(settings.is_open, settings.closed_message);
      updateInfoStrip(settings);
    } catch {
      // Sem conexão ou config indisponível: mantém os valores fixos do HTML.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStoreConfig);
  } else {
    loadStoreConfig();
  }
})();
