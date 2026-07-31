// Cards de lançamento (seção "lancamento") controlados pelo painel admin.
//
// Mesmo espírito do store-config.js: só troca o conteúdo fixo do HTML quando
// a busca no Supabase dá certo e devolve pelo menos um lançamento ativo. Sem
// rede ou sem nenhum cadastro ainda, o card fixo do HTML continua no lugar.
(function () {
  const SUPABASE_URL = 'https://lungknnnbddzgjvemdlp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_2sr3hUBpek8LqSOBOwLMkA_TsIheip3';
  const WHATSAPP_FALLBACK = '5511993996423';
  const MAX_CARDS = 3;

  function buildWhatsappHref(message) {
    // window.__STORE_WHATSAPP__ vem do store-config.js quando ele já rodou.
    // Se este script terminar primeiro, usa o número fixo — que é o mesmo
    // cadastrado hoje, então na prática não muda o link.
    const number = window.__STORE_WHATSAPP__ || WHATSAPP_FALLBACK;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function buildMedia(launch) {
    const media = document.createElement('div');
    media.className = 'launch-card-media';

    if (launch.video_url) {
      const video = document.createElement('video');
      video.className = 'launch-media';
      video.src = launch.video_url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', launch.title);
      media.appendChild(video);
    } else if (launch.image_url) {
      const img = document.createElement('img');
      img.className = 'launch-media';
      img.src = launch.image_url;
      img.alt = launch.title;
      media.appendChild(img);
    } else {
      media.classList.add('is-placeholder');
      const placeholder = document.createElement('div');
      placeholder.className = 'launch-card-placeholder';
      placeholder.innerHTML = '<span>Foto ou vídeo entra aqui</span>';
      media.appendChild(placeholder);
    }

    return media;
  }

  function buildCard(launch) {
    const card = document.createElement('article');
    card.className = 'launch-card';
    card.appendChild(buildMedia(launch));

    const body = document.createElement('div');
    body.className = 'launch-card-body';

    const title = document.createElement('h3');
    title.className = 'launch-card-title';
    title.textContent = launch.title;
    body.appendChild(title);

    if (launch.description) {
      const desc = document.createElement('p');
      desc.className = 'launch-card-desc';
      desc.textContent = launch.description;
      body.appendChild(desc);
    }

    const cta = document.createElement('a');
    cta.className = 'btn-cta launch-card-cta';
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.setAttribute('data-whatsapp-link', '');
    cta.href = buildWhatsappHref(launch.whatsapp_message || `Oi! Quero pedir o ${launch.title}`);
    cta.textContent = 'Pedir agora';
    body.appendChild(cta);

    card.appendChild(body);
    return card;
  }

  function buildEmptyCard() {
    const card = document.createElement('div');
    card.className = 'launch-card launch-card-empty';
    const media = document.createElement('div');
    media.className = 'launch-card-media-empty';
    media.textContent = 'Em breve';
    card.appendChild(media);
    return card;
  }

  async function loadLaunches() {
    const grid = document.getElementById('launchesGrid');
    if (!grid) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/launches?is_active=eq.true&select=title,description,image_url,video_url,whatsapp_message&order=sort_order.asc`,
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      if (!response.ok) return;

      const launches = await response.json();
      if (!Array.isArray(launches) || launches.length === 0) return;

      grid.innerHTML = '';
      launches.slice(0, MAX_CARDS).forEach((launch) => grid.appendChild(buildCard(launch)));
      for (let i = launches.length; i < MAX_CARDS; i += 1) {
        grid.appendChild(buildEmptyCard());
      }
    } catch {
      // Sem rede ou config indisponível: mantém o card fixo do HTML.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLaunches);
  } else {
    loadLaunches();
  }
})();
