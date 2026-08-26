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

    return origem + REDIMENSIONADA + caminho + '?width=' + largura + '&quality=' + (qualidade || 75);
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

    if (reduzida !== url) {
      img.addEventListener(
        'error',
        function () {
          img.src = url;
        },
        { once: true },
      );
    }

    img.src = reduzida;
  }

  window.__IMG__ = {
    LARGURA: LARGURA,
    url: urlDeImagem,
    definir: definirImagem,
  };
})();
