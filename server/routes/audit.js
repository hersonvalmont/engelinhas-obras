const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/audit — registrar evento
router.post('/', (req, res) => {
  const { entidade, entidade_id, acao, detalhe } = req.body;
  if (!entidade || !acao) return res.status(400).json({ erro: 'entidade e acao são obrigatórios.' });
  const usuario_nome  = req.usuario?.nome  || 'Sistema';
  const usuario_email = req.usuario?.email || '';
  db.prepare(`
    INSERT INTO audit_log (entidade, entidade_id, acao, detalhe, usuario_nome, usuario_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(entidade, entidade_id || null, acao, detalhe || null, usuario_nome, usuario_email);
  res.json({ ok: true });
});

// GET /api/audit?entidade=asos&entidade_id=5 — listar histórico
router.get('/', (req, res) => {
  const { entidade, entidade_id } = req.query;
  let sql  = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];
  if (entidade)    { sql += ' AND entidade = ?';    params.push(entidade); }
  if (entidade_id) { sql += ' AND entidade_id = ?'; params.push(Number(entidade_id)); }
  sql += ' ORDER BY criado_em DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

module.exports = router;
