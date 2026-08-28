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

> ⚠️ **`resize=contain` na URL não é opcional.** Passando só `?width=`, o
> Supabase aplica a largura e **mantém a altura original**: uma foto de
> 1080x1068 voltava 160x1068 e uma de 1024x1536 voltava 160x1536. A foto
> chegava esmagada na horizontal (até 6,7x), e o `object-fit: cover` do CSS
> recortava essa tira pra preencher o quadro — na tela, toda foto de produto
> aparecia com zoom e deformada. Bug ativo de 26/08 a 27/08/2026. Com
> `contain` a proporção volta (160x158, 160x240) e o arquivo ainda fica menor
> (6,7 KB contra 16,8 KB).

As imagens em `public/assets/` são só a reserva mostrada antes do
`catalog-sync` terminar e pra quem está sem JavaScript. Elas foram
redimensionadas pelo uso real em 25/08/2026 (18 MB para 1 MB) — ao trocar
alguma, redimensionar antes de commitar em vez de subir o arquivo do celular.

## Vídeos e cache

Os vídeos (topo e lançamentos) vêm do Storage do Supabase e **não passam pelo
redimensionamento do `imagens.js`** — aquilo é serviço de imagem, não serve
vídeo. Eles chegam do jeito que foram enviados pelo painel.

Medido em 27/08/2026: o vídeo do topo tinha 2,7 MB e os três de lançamento
8,5 MB somados, todos servidos com `Cache-Control: no-cache`. Isso significa
rebaixar tudo em **toda visita, inclusive num F5** — e o vídeo do topo, que
começa a baixar assim que as configurações chegam, disputa banda com fonte,
CSS e foto, o que fazia a página inteira parecer lenta e não só o vídeo.

A causa era o `upload()` do painel (`src/lib/upload-browser.ts`) não passar
`cacheControl`. Corrigido lá, com um ano — o nome do arquivo já leva timestamp,
então trocar a mídia gera caminho novo e aparece na hora.

**A correção só vale pra upload novo.** Mídia que já estava no bucket continua
em `no-cache` até ser **reenviada pelo painel**.

Continua pendente: comprimir os vídeos (2,7 MB é muito pra um loop mudo; com
H.264 720p sem áudio dá pra ficar abaixo de 500 KB) e dar um `poster` ao vídeo
do topo — sem ele o espaço fica **vazio** enquanto baixa, que é a demora que o
cliente enxerga.

### Como comprimir vídeo e gerar o poster

Preset usado em 27/08/2026 (540px de largura, 24fps, sem áudio, `faststart`
pra o vídeo começar antes de terminar de baixar). Reduziu os quatro vídeos do
Supabase de 11,2 MB para 3,3 MB, sem diferença visível no tamanho de
exibição:

```
ffmpeg -i entrada.mp4 -an -r 24 -vf "scale=540:-2" \
  -c:v libx264 -profile:v high -preset slow -crf 32 \
  -pix_fmt yuv420p -movflags +faststart saida.mp4
```

O `poster` do vídeo do topo (`public/assets/hero-poster.jpg`, 38 KB) é o
quadro de 1 segundo do vídeo cadastrado no painel:

```
ffmpeg -ss 1 -i hero.mp4 -frames:v 1 -vf "scale=540:-2" -q:v 5 \
  public/assets/hero-poster.jpg
```

**Trocou o vídeo do topo no painel? Gere o poster de novo E bumpe o `?v=`
do `poster=` no `index.html`.** O nome do arquivo é fixo e `/assets/*` tem cache
de um dia: sem o bump o cliente segue vendo o quadro do vídeo antigo por até 24h,
como aconteceu em 28/08/2026. Ele é um retrato
do vídeo de hoje; desatualizado, mostra por um instante o quadro do vídeo
antigo antes de o novo começar. O `store-config.js` remove o poster sozinho
quando o vídeo é apagado no painel — o caso a cuidar é a troca, não a
remoção.

### Cache dos arquivos do próprio site

O padrão do Cloudflare Workers pra assets é `public, max-age=0,
must-revalidate`: todo arquivo vai ao servidor a cada visita. As regras estão
no `public/_headers` — um ano pra `/css/*` e `/js/*`, um dia pra `/assets/*`.

⚠️ `/css/*` e `/js/*` vão com `immutable`, ou seja o navegador **não revalida
dentro do ano**. Quem já visitou fica preso na versão velha se o `?v=` do
`index.html` não for bumpado. **Bumpar o `?v=` ao alterar CSS ou JS deixou de
ser boa prática e passou a ser obrigatório.** O HTML fica fora do cache de
propósito: é ele que aponta pros `?v=` novos.

## Brindes

"Compre o produto A, ganhe o produto B", cadastrado em **Brindes** no painel
(tabela `gift_rules`).

Quem decide o brinde é o **servidor**, no `createPublicOrder` do painel. O
`public/js/brindes.js` é só vitrine: desenha a linha no carrinho a partir das
regras, e o brinde **nunca entra no array `cart`**. O motivo é que o checkout
descarta todo preço que o navegador manda e recalcula item por item a partir de
`products.base_price` — brinde enviado como item comum não chegaria de graça,
chegaria cobrado pelo preço cheio.

Vale um brinde por regra por pedido, não por unidade: três marmitas dão uma
Coca, não três. A regra é a mesma nos dois lados — se virar proporcional, muda
nos dois.

Se a leitura falhar (sem rede, tabela ainda não migrada), o carrinho fica sem o
aviso e o pedido segue normal — o servidor dá o brinde do mesmo jeito.

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
    brindes.js           # regras de brinde (vitrine; quem decide é o servidor)
    script.js            # carrinho, modal de produto, monte-seu-açaí, checkout
  assets/               # imagens e vídeos de produto
  robots.txt, sitemap.xml
server.js                # só pra rodar local (Express + Helmet) — não entra em produção
```
