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

**Cloudflare Workers** serve o site em `https://acaikideliciaperus.com.br`.
O deploy sai a cada push em `master`: o build roda `npx wrangler deploy`, e o
`wrangler.jsonc` diz que o conteúdo é a pasta `public/` — sem esse arquivo o
comando executa, o build fica verde e nada vai ao ar.

Não existe código de Worker: os arquivos são servidos direto da borda, e por
isso requisição de página não conta como invocação no plano gratuito.

Os cabeçalhos de segurança vêm do `public/_headers`, que o Cloudflare lê de
dentro da pasta de assets. **Ele é cópia da mesma política que está no
`vercel.json` e, reduzida, na tag `<meta>` do `index.html`** — as três mudam
juntas. Quando duas origens mandam CSP, o navegador aplica a interseção, então
uma esquecida bloqueia calada o que a outra libera.

O DNS do domínio é gerenciado pelo Cloudflare (nameservers `audrey` e
`augustus.ns.cloudflare.com`), com o registro em si ainda no Registro.br.

### Outros destinos

- **GitHub Pages** — aposentado em 25/08/2026. A branch `gh-pages` não serve
  mais o site: serve só um redirecionamento pro domínio próprio, pra quem tem
  o endereço antigo salvo e pro Google transferir o que já indexou. O workflow
  que republicava foi removido. Não recriar: duas cópias do site publicadas
  dividem o SEO, e no Pages não chegam `X-Content-Type-Options` nem
  `X-Frame-Options`, porque ele não permite responder cabeçalho HTTP.
- **Vercel** — o projeto do site ficou pra trás (o deploy parou de sair em
  25/08/2026) e deve ser desligado. O `vercel.json` continua no repo por
  enquanto. O **painel** (`acai-ki-delicia-admin`) segue na Vercel e não tem
  relação com isso.

O site não depende do painel pra funcionar: catálogo, preço, horário e zonas
vêm direto do Supabase. O painel só recebe o registro do pedido — se ele cair,
o checkout volta pro fluxo antigo de WhatsApp e a loja continua vendendo.

Antes de publicar: `robots.txt`, `sitemap.xml` e as tags `canonical`/`og:url`
no `index.html` apontam pro domínio oficial (`acaikideliciaperus.com.br`). Se
a URL oficial mudar de novo, **são oito lugares** — listados no comentário no
topo do `<head>` do `index.html`.

## Imagens

As fotos de produto ficam no Storage do Supabase, enviadas pelo painel no
tamanho que saiu do celular. O `public/js/imagens.js` pede ao Supabase a
versão redimensionada na própria URL (`/render/image/public/` com `?width=`),
que também negocia WebP — uma foto de 2,26 MB sai com 23 KB na largura da
miniatura. Cada lugar pede a largura do seu uso real; as medidas estão em
`LARGURA`, no topo do arquivo.

As imagens em `public/assets/` são só a reserva mostrada antes do
`catalog-sync` terminar e pra quem está sem JavaScript. Elas foram
redimensionadas pelo uso real em 25/08/2026 (18 MB para 1 MB) — ao trocar
alguma, redimensionar antes de commitar em vez de subir o arquivo do celular.

## Histórico da migração pro Cloudflare

O plano Hobby da Vercel é, pelos termos dela, só pra uso não comercial —
e um site que fecha pedido é uso comercial. O Cloudflare não tem essa
cláusula no plano gratuito, então o site vai pra lá. **O painel continua
na Vercel**, porque Next.js com Server Actions roda melhor onde o
framework nasceu.

Isso também isola o estrago: o site lê catálogo, preço, horário e zonas
direto do Supabase, e o único uso do painel é registrar o pedido em
`/api/pedido`. Se o painel cair, o checkout abre o WhatsApp com o pedido
montado e a loja continua vendendo — só para de registrar no sistema.

Configuração no Cloudflare:

- Framework preset: **None**. O repo tem `server.js` (só pra rodar local)
  e a plataforma tenta detectar app Node por engano — é o mesmo motivo do
  `framework: null` no `vercel.json`
- Build command: **vazio**, não há build
- Build output directory: `public`
- Os cabeçalhos de segurança vêm do `public/_headers`, que o Cloudflare lê
  e que o `vercel.json` não substitui

Concluída em 25/08/2026, com um pedido de verdade fechado pelo endereço novo
antes de o DNS ser apontado.

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
