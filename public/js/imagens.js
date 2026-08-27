/* Imagens do Supabase redimensionadas na origem.
 *
 * As fotos de produto são enviadas pelo painel no tamanho que saiu do celular:
 * medido em 25/08/2026, as 31 imagens ativas somavam 17,5 MB, quatro delas
 * acima de 2 MB. A miniatura do cardápio é exibida a 56x56 pixels — baixar
 * 2 MB pra desenhar isso é o tipo de coisa que faz o cliente desistir antes
 * de a página abrir, ainda mais em rede móvel, que é como quase todo pedido
 * de delivery chega.
 *
 * O Storage do Supabase redimensiona na própria URL: trocar
 * /storage/v1/object/public/ por /storage/v1/render/image/public/ e passar
 * ?width= devolve a imagem já reduzida, e negocia WebP sozinho pelo cabeçalho
 * Accept do navegador. A mesma foto de 2,26 MB sai com 23 KB em width=160.
 *
 * Serve pelo mesmo domínio do Storage, então o img-src da CSP já cobre e nada
 * precisa ser liberado. */
(function () {
  'use strict';

  var ORIGINAL = '/storage/v1/object/public/';
  var REDIMENSIONADA = '/storage/v1/render/image/public/';

  /* Larguras pedidas ao Supabase. Cada uma é o dobro do tamanho que o CSS
   * desenha, pra não sair borrada em tela de densidade 2x — que é a de
   * praticamente todo celular. */
  var LARGURA = {
    miniatura: 160, // .menu-item-thumb, desenhada a 56x56
    cartao: 800, // .product-card-image e .launch-media
    modal: 900, // .product-modal-media, 200px de altura e largura do modal
    logo: 128, // .logo-img, desenhada a 44x44
  };

  /* Devolve a URL redimensionada. Aceita tanto a URL original do Storage
   * quanto uma que este mesmo utilitário já produziu — é o que permite o
   * modal pedir a versão grande a partir do src da miniatura clicada.
   *
   * Qualquer outra coisa (asset local, URL de terceiro, valor vazio) volta
   * intacta, então chamar isso em cima de qualquer src é seguro. */
  function urlDeImagem(url, largura, qualidade) {
    if (typeof url !== 'string' || !url) return url;

    var base = url.split('?')[0];
    var corte = base.indexOf(ORIGINAL);
    var marcador = ORIGINAL;

    if (corte < 0) {
      corte = base.indexOf(REDIMENSIONADA);
      marcador = REDIMENSIONADA;
    }
    if (corte < 0) return url;

    var origem = base.slice(0, corte);
    var caminho = base.slice(corte + marcador.length);

    /* `resize=contain` NÃO é opcional. Sem ele o Supabase aplica a largura
     * pedida e MANTÉM A ALTURA ORIGINAL — medido em 27/08/2026: uma foto de
     * 1080x1068 voltava 160x1068, e uma de 1024x1536 voltava 160x1536. A foto
     * chegava esmagada na horizontal (até 6,7x), e o `object-fit: cover` do
     * CSS então recortava essa tira pra preencher o quadrado, o que na tela
     * aparecia como toda foto de produto com zoom e deformada.
     *
     * Com `contain` a proporção é preservada (160x158, 160x240) e o recorte
     * volta a ser só o do CSS, que é o pretendido. De quebra o arquivo fica
     * menor: 6,7 KB contra 16,8 KB da versão esticada.
     *
     * `contain` e não `cover` porque quem decide o enquadramento é o CSS.
     * Pedir `cover` aqui exigiria mandar altura junto e fixaria o recorte na
     * URL — cada lugar que exibe a mesma foto recorta diferente. */
    return (
      origem +
      REDIMENSIONADA +
      caminho +
      '?width=' + largura + '&resize=contain&quality=' + (qualidade || 75)
    );
  }

  /* Caminho de volta: de uma URL redimensionada pro arquivo original do
   * Storage. É o que a rede de segurança precisa apontar.
   *
   * Existe porque o serviço de redimensionamento é SEPARADO do Storage e pode
   * sumir sem o arquivo sumir junto: em 27/08/2026 o painel da Supabase já
   * marcava "Storage Image Transformations: Unavailable in plan" enquanto o
   * endpoint ainda respondia. Se ele for cortado, o original continua lá — só
   * pesado.
   *
   * Sem esta função, o fallback do modal apontaria pra outra URL
   * redimensionada (o modal recebe o src da miniatura, que já é uma), ou seja
   * cairia no mesmo serviço que acabou de falhar e mostraria imagem quebrada. */
  function urlOriginal(url) {
    if (typeof url !== 'string' || !url) return url;
    var base = url.split('?')[0];
    var corte = base.indexOf(REDIMENSIONADA);
    if (corte < 0) return base;
    return base.slice(0, corte) + ORIGINAL + base.slice(corte + REDIMENSIONADA.length);
  }

  /* Aplica a imagem reduzida num <img>, com a original como rede de segurança.
   *
   * O redimensionamento é um serviço à parte do Storage: se ele ficar
   * indisponível ou passar a ser recusado, o <img> dispara erro. Sem esse
   * tratamento o cardápio ficaria sem foto nenhuma — com ele, cai na URL
   * original e o cliente vê a imagem pesada em vez de espaço vazio.
   *
   * O listener é { once: true } de propósito: se a original também falhar,
   * não tenta de novo e evita laço. */
  function definirImagem(img, url, largura, qualidade) {
    if (!img) return;
    var reduzida = urlDeImagem(url, largura, qualidade);
    var original = urlOriginal(url);

    if (reduzida !== original) {
      img.addEventListener(
        'error',
        function () {
          img.src = original;
        },
        { once: true },
      );
    }

    img.src = reduzida;
  }

  window.__IMG__ = {
    LARGURA: LARGURA,
    url: urlDeImagem,
    original: urlOriginal,
    definir: definirImagem,
  };
})();
