/* Brindes: "compre o produto A, ganhe o produto B".
 *
 * ESTE ARQUIVO É VITRINE, NÃO REGRA.
 *
 * Quem decide o brinde de verdade é o servidor, em lib/actions/checkout.ts do
 * painel, relendo a mesma tabela `gift_rules`. O motivo é concreto e vale
 * repetir: o checkout descarta todo preço que o navegador manda e recalcula
 * cada item a partir de `products.base_price`. Se o brinde fosse empurrado
 * pra dentro do carrinho como item comum, ele NÃO chegaria de graça — chegaria
 * cobrado pelo preço cheio, e o cliente pagaria justamente pelo que o site
 * prometeu de brinde.
 *
 * Por isso o brinde aqui nunca entra no array `cart`: ele é desenhado a partir
 * do carrinho, na hora de renderizar, e some do payload sozinho. Assim o
 * localStorage também não guarda brinde velho de uma promoção já encerrada.
 *
 * Se a leitura falhar, o carrinho fica sem o aviso e o pedido segue normal —
 * o servidor dá o brinde do mesmo jeito. Chato, não quebrado. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lungknnnbddzgjvemdlp.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_2sr3hUBpek8LqSOBOwLMkA_TsIheip3';

  /* trigger_product_id -> nome do brinde. Vazio até a busca voltar, e vazio
   * pra sempre se ela falhar — as duas situações fazem cartGifts() devolver
   * lista vazia, que é exatamente "não mostra nada". */
  var regras = new Map();

  /* Brindes que o carrinho atual dá.
   *
   * Deduplicado por produto de brinde: se duas regras diferentes dão a mesma
   * Coca, o cliente vê uma Coca. Bate com o servidor, que também empilha um
   * brinde por produto (o laço lá percorre os PRODUTOS de brinde, não as
   * regras).
   *
   * E é um por pedido, não por unidade: três marmitas dão uma Coca. Mesma
   * regra dos dois lados — se um dia virar proporcional, muda nos dois. */
  function cartGifts(cart) {
    if (!Array.isArray(cart) || regras.size === 0) return [];

    var nomes = new Set();
    cart.forEach(function (item) {
      var nome = item && item.productId && regras.get(item.productId);
      if (nome) nomes.add(nome);
    });

    return [...nomes];
  }

  async function carregar(aoAtualizar) {
    try {
      var resposta = await fetch(
        SUPABASE_URL +
          '/rest/v1/gift_rules?is_active=eq.true' +
          '&select=trigger_product_id,gift:products!gift_rules_gift_product_id_fkey(name,is_active)',
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      if (!resposta.ok) return;

      var linhas = await resposta.json();
      if (!Array.isArray(linhas)) return;

      linhas.forEach(function (linha) {
        // O PostgREST devolve o embed de uma FK ora como objeto, ora como
        // array de um. Aceita os dois pra não depender da versão que respondeu.
        var brinde = Array.isArray(linha.gift) ? linha.gift[0] : linha.gift;
        // Brinde desativado em Produtos é brinde que a loja não tem hoje. O
        // servidor pula essa regra, então anunciar aqui prometeria algo que
        // não vem no pedido.
        if (!brinde || !brinde.name || brinde.is_active === false) return;
        regras.set(linha.trigger_product_id, brinde.name);
      });

      // O carrinho pode já estar na tela (vem do localStorage e é desenhado
      // antes desta busca terminar). Redesenha pra o aviso aparecer sem o
      // cliente precisar mexer em nada.
      if (regras.size > 0 && typeof aoAtualizar === 'function') aoAtualizar();
    } catch {
      // Sem rede: segue sem aviso de brinde.
    }
  }

  window.__BRINDES__ = {
    doCarrinho: cartGifts,
    carregar: carregar,
  };
})();
