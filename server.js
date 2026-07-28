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

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://lungknnnbddzgjvemdlp.supabase.co'],
        // adminOrigins: painel que recebe o pedido do carrinho (localhost +
        // IPs da rede local, pra demo pelo celular).
        'connect-src': [
          "'self'",
          'https://lungknnnbddzgjvemdlp.supabase.co',
          ...adminOrigins,
        ],
      },
    },
  }),
);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Açaí Ki Delícia rodando em http://localhost:${PORT}`);
  for (const ip of lanAddresses()) {
    console.log(`  na rede local:  http://${ip}:${PORT}`);
  }
});
