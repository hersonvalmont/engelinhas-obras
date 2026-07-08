const router  = require('express').Router();
const db      = require('../database');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authMiddleware } = require('../middleware/auth');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const nome = Date.now() + '_' + Math.random().toString(36).slice(2) + ext;
    cb(null, nome);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.use(authMiddleware);

// POST /api/arquivos/upload  — multipart, campos: entidade, entidade_id, file(s)
router.post('/upload', upload.array('files', 20), (req, res) => {
  const { entidade, entidade_id } = req.body;
  if (!entidade || !entidade_id) return res.status(400).json({ erro: 'entidade e entidade_id obrigatórios.' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

  const inseridos = [];
  const stmt = db.prepare('INSERT INTO arquivos (entidade,entidade_id,nome_orig,nome_salvo,mime,tamanho) VALUES (?,?,?,?,?,?)');
  for (const f of req.files) {
    const r = stmt.run(entidade, Number(entidade_id), f.originalname, f.filename, f.mimetype, f.size);
    inseridos.push({ id: r.lastInsertRowid, nome_orig: f.originalname, nome_salvo: f.filename, mime: f.mimetype, tamanho: f.size });
  }
  res.status(201).json(inseridos);
});

// GET /api/arquivos?entidade=asos&entidade_id=5
router.get('/', (req, res) => {
  const { entidade, entidade_id } = req.query;
  if (!entidade || !entidade_id) return res.status(400).json({ erro: 'Parâmetros obrigatórios.' });
  const lista = db.prepare('SELECT * FROM arquivos WHERE entidade=? AND entidade_id=? ORDER BY criado_em').all(entidade, Number(entidade_id));
  res.json(lista);
});

// GET /api/arquivos/:id/download
router.get('/:id/download', (req, res) => {
  const arq = db.prepare('SELECT * FROM arquivos WHERE id=?').get(req.params.id);
  if (!arq) return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  const filePath = path.join(UPLOADS_DIR, arq.nome_salvo);
  if (!fs.existsSync(filePath)) return res.status(404).json({ erro: 'Arquivo físico não encontrado.' });
  res.download(filePath, arq.nome_orig);
});

// DELETE /api/arquivos/:id
router.delete('/:id', (req, res) => {
  const arq = db.prepare('SELECT * FROM arquivos WHERE id=?').get(req.params.id);
  if (!arq) return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  const filePath = path.join(UPLOADS_DIR, arq.nome_salvo);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM arquivos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
