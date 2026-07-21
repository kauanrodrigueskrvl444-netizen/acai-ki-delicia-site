const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Açaí Ki Delícia rodando em http://localhost:${PORT}`);
});
