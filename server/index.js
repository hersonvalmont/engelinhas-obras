const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const path        = require('path');
const rateLimit   = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Segurança e middlewares ──────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limit geral
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false }));
// Rate limit mais apertado no login
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20, message: { erro: 'Muitas tentativas. Aguarde 15 minutos.' } }));

// ── Rotas da API ──────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/usuarios',    require('./routes/usuarios'));
app.use('/api/obras',       require('./routes/obras'));
app.use('/api/funcionarios',require('./routes/funcionarios'));
app.use('/api/asos',        require('./routes/asos'));
app.use('/api/atas',        require('./routes/atas'));
app.use('/api/documentos',  require('./routes/documentos'));
app.use('/api/arquivos',    require('./routes/arquivos'));

// ── Arquivos enviados (downloads protegidos via rota /api/arquivos/:id/download) ──
// Pasta de uploads NÃO exposta diretamente por segurança

// ── Serve o frontend (index.html) ────────────────
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '../public');
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Health check ──────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Inicializar banco antes de ouvir ─────────────
require('./database'); // cria tabelas + seed admin

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Engelinhas API rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
