# Açaí Kidelicia — Landing page

Loja pública da Açaí Kidelicia (açaiteria em Perus, São Paulo/SP). HTML/CSS/JS
estático, sem build step. Lê cardápio, preço e disponibilidade direto do
Supabase do painel administrativo ([`acai-ki-delicia-admin`](https://github.com/kauanrodrigueskrvl444-netizen/acai-ki-delicia-admin))
e cria pedido de verdade via `POST /api/pedido` nesse mesmo painel.

## Projeto

Site de página única (`public/index.html`) com carrinho, "monte seu açaí" e
checkout que finaliza direto no WhatsApp do cliente após criar o pedido no
painel. Se o painel estiver fora do ar, o checkout cai automaticamente no
fluxo antigo (link direto pro WhatsApp, sem passar pelo pedido no sistema) —
o cliente nunca fica sem conseguir comprar.

## Tecnologias

- HTML/CSS/JS puro, sem framework nem bundler
- [Express](https://expressjs.com/) + [Helmet](https://helmetjs.github.io/) só pra servir os arquivos localmente com os mesmos headers de segurança da produção
- Publicado como site estático (GitHub Pages e Vercel)

## Como rodar

```bash
npm install
PORT=3001 npm start   # ou: npm run dev (reinicia sozinho a cada mudança)
```

Abre em `http://localhost:3001`. Pra testar o fluxo de pedido completo, o
painel (`acai-ki-delicia-admin`) precisa estar rodando também, em
`http://localhost:3000` — ver o `README.md` de lá.

## Variáveis

Não usa `.env` — as chaves do Supabase (URL + chave anônima) ficam
hardcoded em `public/js/catalog-sync.js` e `public/js/store-config.js`
porque são públicas por natureza (é a mesma chave que qualquer visitante já
recebe no HTML da página; a proteção de dado sensível é feita por RLS no
banco, não por esconder essa chave).

O único endereço configurável é o do painel, em `public/js/config.js`
(`ADMIN_API`) — aponta pra origem do painel em produção.

## Como publicar

Três destinos publicados hoje, todos a partir do mesmo `public/`:

1. **GitHub Pages** (canônico) — branch `gh-pages`, publicada automaticamente
   a cada push em `master` que muda algo em `public/`
   (`.github/workflows/deploy-gh-pages.yml`). É a URL oficial enquanto não
   houver domínio próprio. Antes de 01/08/2026 esse passo era manual e ficou
   esquecido por dias — checar `gh run list` se desconfiar que algo não foi
   ao ar.
2. **Vercel** — projeto próprio (`acai-ki-delicia-site.vercel.app`), deploy
   automático a cada push em `master`. `vercel.json` força `framework: null`
   porque o repo tem `server.js` (só pra rodar local) que a Vercel tentaria
   detectar como servidor Node por engano.
3. **Painel** (mini-loja antiga) — desativado, não usar como referência.

Antes de publicar: `robots.txt`, `sitemap.xml` e as tags `canonical`/`og:url`
no `index.html` apontam pro domínio oficial atual (GitHub Pages). **Quando
existir domínio próprio, atualizar os cinco lugares** listados no comentário
no topo do `<head>` do `index.html`.

## Estrutura

```
public/
  index.html          # página inteira — hero, cardápio, monte-seu-açaí, checkout
  css/style.css
  js/
    config.js          # endereço do painel (ADMIN_API)
    store-config.js     # lê configurações da loja (horário, taxa, status aberto/fechado)
    catalog-sync.js      # sincroniza preço/disponibilidade/adicionais com o Supabase do painel
    script.js            # carrinho, modal de produto, monte-seu-açaí, checkout
  assets/               # imagens e vídeos de produto
  robots.txt, sitemap.xml
server.js                # só pra rodar local (Express + Helmet) — não entra em produção
```
