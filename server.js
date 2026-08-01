const express = require('express');
const helmet = require('helmet');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/** IPs IPv4 desta máquina na rede local. Servem pra liberar no CSP o painel
 * acessado pelo IP (demo no celular), sem afrouxar a política pra internet. */
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((nic) => nic && nic.family === 'IPv4' && !nic.internal)
    .map((nic) => nic.address);
}

const ADMIN_PORT = process.env.ADMIN_PORT || 3000;
const adminOrigins = [
  process.env.ADMIN_ORIGIN || `http://localhost:${ADMIN_PORT}`,
  ...lanAddresses().map((ip) => `http://${ip}:${ADMIN_PORT}`),
];

const cspDirectives = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'img-src': ["'self'", 'data:', 'https://lungknnnbddzgjvemdlp.supabase.co'],
  // Vídeo de lançamento e do hero, quando cadastrados pelo painel, ficam
  // no mesmo bucket público do Supabase — sem isso, media-src cai no
  // default-src ('self') e o navegador bloqueia o <video src>.
  'media-src': ["'self'", 'https://lungknnnbddzgjvemdlp.supabase.co'],
  // adminOrigins: painel que recebe o pedido do carrinho (localhost +
  // IPs da rede local, pra demo pelo celular).
  'connect-src': [
    "'self'",
    'https://lungknnnbddzgjvemdlp.supabase.co',
    ...adminOrigins,
  ],
};

// O padrão do Helmet inclui upgrade-insecure-requests, que manda o navegador
// trocar todo http:// por https:// sozinho — inclusive CSS, JS e fetch pro
// painel. Esse servidor (server.js) só roda local/rede local, sempre em
// HTTP puro, sem certificado: com a diretiva presente, o celular tenta https
// numa porta que só fala http, a busca falha e sobra só o HTML sem estilo
// nem funcionalidade. Em produção o site é publicado como arquivo estático
// (Vercel/GitHub Pages, headers próprios em vercel.json) — este servidor
// nunca serve a versão pública, então não há mixed content real pra proteger
// aqui.
//
// `delete` não basta: com useDefaults (ligado por padrão), o Helmet
// remescla as próprias diretivas padrão por cima das que a gente passa, e a
// diretiva reaparece. Precisa marcar explicitamente como `null` pra sinalizar
// "remover", não só omitir a chave.
cspDirectives['upgrade-insecure-requests'] = null;

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
  }),
);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Açaí Kidelicia rodando em http://localhost:${PORT}`);
  for (const ip of lanAddresses()) {
    console.log(`  na rede local:  http://${ip}:${PORT}`);
  }
});
