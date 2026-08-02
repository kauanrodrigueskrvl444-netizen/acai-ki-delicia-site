// Endereço do painel que recebe os pedidos do carrinho.
//
// Deixe VAZIO pra rodar local ou na rede (localhost e IP da máquina são
// descobertos sozinhos, na porta 3000).
//
// Em PRODUÇÃO, cole aqui a URL do painel publicado — sem barra no final.
// Exemplo: window.__ADMIN_API__ = 'https://acai-ki-delicia-admin.vercel.app';
//
// Publicado, o site e o painel ficam em domínios diferentes, então esse
// endereço não tem como ser adivinhado: precisa ser preenchido aqui.
//
// ⚠️ Pra testar local ou pela rede, COMENTE a linha abaixo em vez de apagar
// o valor — e lembre de descomentar antes de publicar de novo. Já aconteceu
// de ficar esquecido preenchido durante teste local: o checkout tentava
// mandar pro painel publicado de verdade, o CSP bloqueava a conexão (só
// libera localhost/IP da rede) e o pedido caía calado no fallback de
// WhatsApp, sem registrar nada em lugar nenhum.
window.__ADMIN_API__ = 'https://acai-ki-delicia-admin.vercel.app';
