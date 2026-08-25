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

1. **Vercel** (canônico) — serve o domínio próprio
   `https://acaikideliciaperus.com.br`, com deploy automático a cada push em
   `master`. `vercel.json` força `framework: null` porque o repo tem
   `server.js` (só pra rodar local) que a Vercel tentaria detectar como
   servidor Node por engano. O DNS do domínio fica no painel do Registro.br
   (nameservers `auto.dns.br`), não na Vercel.
2. **GitHub Pages** (espelho) — branch `gh-pages`, publicada automaticamente
   a cada push em `master` que muda algo em `public/`
   (`.github/workflows/deploy-gh-pages.yml`). Era a URL oficial até
   25/08/2026; hoje continua no ar servindo a mesma página, com `canonical`
   apontando pro domínio próprio. **Não criar arquivo `CNAME` em `public/`:**
   isso faria o Pages reivindicar o domínio e brigar com a Vercel pelo mesmo
   nome. Antes de 01/08/2026 esse passo era manual e ficou esquecido por dias
   — checar `gh run list` se desconfiar que algo não foi ao ar.

   **Este espelho tem data pra sair.** Nele não chegam `X-Content-Type-Options`
   nem `X-Frame-Options`: o Pages não deixa definir cabeçalho, então lá só vale
   a política do `<meta>`. Enquanto ele existir, também são duas cópias do CSP
   pra manter em sincronia. Assim que o domínio próprio estiver indexado e o
   tráfego tiver migrado — dá pra confirmar na Search Console — apagar o
   `deploy-gh-pages.yml` e a branch `gh-pages`, e deixar o CSP só no
   `vercel.json`. Não fazer isso antes: até lá o Pages é a rede de segurança
   se o DNS do domínio novo falhar.
3. **Painel** (mini-loja antiga) — desativado, não usar como referência.

Antes de publicar: `robots.txt`, `sitemap.xml` e as tags `canonical`/`og:url`
no `index.html` apontam pro domínio oficial (`acaikideliciaperus.com.br`). Se
a URL oficial mudar de novo, **são oito lugares** — listados no comentário no
topo do `<head>` do `index.html`.

## Migração planejada do site pro Cloudflare

O plano Hobby da Vercel é, pelos termos dela, só pra uso não comercial —
e um site que fecha pedido é uso comercial. O Cloudflare não tem essa
cláusula no plano gratuito, então o site vai pra lá. **O painel continua
na Vercel**, porque Next.js com Server Actions roda melhor onde o
framework nasceu.

Isso também isola o estrago: o site lê catálogo, preço, horário e zonas
direto do Supabase, e o único uso do painel é registrar o pedido em
. Se o painel cair, o checkout abre o WhatsApp com o pedido
montado e a loja continua vendendo — só para de registrar no sistema.

Configuração no Cloudflare:

- Framework preset: **None**. O repo tem  (só pra rodar local)
  e a plataforma tenta detectar app Node por engano — foi o mesmo motivo
  do  no - Build command: **vazio**, não há build
- Build output directory: - Os cabeçalhos de segurança vêm do , que o Cloudflare lê
  e o  não substitui

Ordem: só migrar depois do domínio funcionando na Vercel e do checkout
testado com um pedido real. Migrar antes disso deixa duas mudanças em voo
ao mesmo tempo e ninguém sabe qual quebrou, se quebrar.

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
