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

  /**
   * Só baixa o vídeo quando ele chega perto da tela.
   *
   * Os três cards de lançamento ficam ABAIXO da dobra, mas com `src` + autoplay
   * o navegador baixava os três no carregamento da página: ~8 MB por visita, de
   * gente que muitas vezes nem rola até aqui. O plano gratuito do Supabase dá
   * 5 GB de tráfego por mês — nessa conta o site estourava a cota com menos de
   * 500 visitas, e foi o que derrubou a organização pra "exceeding usage limits".
   *
   * `preload="none"` sozinho não resolve: com `autoplay` presente o navegador
   * baixa mesmo assim. O que segura é não ter `src` até a hora.
   */
  function carregarQuandoVisivel(video) {
    const carregar = () => {
      if (video.src) return;
      video.src = video.dataset.lazySrc;
      // play() rejeita sozinho se o navegador bloquear autoplay; o vídeo fica
      // no primeiro quadro, que é o mesmo resultado de antes.
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    // Sem IntersectionObserver (navegador antigo), carrega logo: melhor gastar
    // tráfego do que deixar o card vazio.
    if (!('IntersectionObserver' in window)) return carregar();

    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          carregar();
          obs.disconnect();
        });
      },
      // Começa a baixar um pouco antes de aparecer, pra não entrar na tela preto.
      { rootMargin: '300px' },
    );
    obs.observe(video);
  }

  function buildMedia(launch) {
    const media = document.createElement('div');
    media.className = 'launch-card-media';

    if (launch.video_url) {
      const video = document.createElement('video');
      video.className = 'launch-media';
      video.preload = 'none';
      video.dataset.lazySrc = launch.video_url;
      video.loop = true;
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', launch.title);
      media.appendChild(video);
      carregarQuandoVisivel(video);
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

  function buildCard(launch, featured) {
    const card = document.createElement('article');
    card.className = featured ? 'launch-card launch-card-featured' : 'launch-card';
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

  function buildEmptyCard(featured) {
    const card = document.createElement('div');
    card.className = featured ? 'launch-card launch-card-empty launch-card-featured' : 'launch-card launch-card-empty';
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

      // O cliente pediu o layout: principal maior no meio, os outros dois
      // menores nas laterais. sort_order mais baixo = maior prioridade, então
      // o primeiro da lista vira o card do meio; o 2º vai pra esquerda e o
      // 3º pra direita.
      const [main, left, right] = launches.slice(0, MAX_CARDS);

      grid.innerHTML = '';
      grid.appendChild(left ? buildCard(left, false) : buildEmptyCard(false));
      grid.appendChild(main ? buildCard(main, true) : buildEmptyCard(true));
      grid.appendChild(right ? buildCard(right, false) : buildEmptyCard(false));
    } catch {
      // Sem rede ou config indisponível: mantém o card fixo do HTML.
    }
  }

  /** O card fixo do HTML também vem com data-lazy-src (ver index.html). Ele é
   *  substituído assim que o painel responde, mas até lá precisa do mesmo
   *  tratamento — senão volta a baixar no carregamento da página.
   *
   *  Restrito à seção de lançamentos de propósito: o vídeo do topo também usa
   *  data-lazy-src, mas quem manda nele é o store-config.js (o arquivo local é
   *  fallback pra quando as configurações não chegam). Sem esse escopo, o
   *  observador daqui via o hero visível na abertura e baixava o arquivo local
   *  junto com o vídeo cadastrado no painel — os dois na mesma visita. */
  function ligarLazyDoHtml() {
    document
      .querySelectorAll('#lancamento video[data-lazy-src]')
      .forEach(carregarQuandoVisivel);
  }

  function iniciar() {
    ligarLazyDoHtml();
    loadLaunches();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
