const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/documentos?tipo=contrato-tecnico
router.get('/', (req, res) => {
  const { tipo } = req.query;
  const lista = tipo
    ? db.prepare('SELECT * FROM documentos WHERE tipo=? ORDER BY criado_em DESC').all(tipo)
    : db.prepare('SELECT * FROM documentos ORDER BY criado_em DESC').all();
  res.json(lista);
});

router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM documentos WHERE id=?').get(req.params.id);
  r ? res.json(r) : res.status(404).json({ erro: 'Não encontrado.' });
});

router.post('/', (req, res) => {
  const { tipo,titulo,subtipo,obra_id,obra_nome,responsavel,data,status,obs,matricula,nome_func,ca } = req.body;
  if (!tipo || !titulo) return res.status(400).json({ erro: 'Tipo e título obrigatórios.' });
  const r = db.prepare('INSERT INTO documentos (tipo,titulo,subtipo,obra_id,obra_nome,responsavel,data,status,obs,matricula,nome_func,ca) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(tipo,titulo,subtipo||'',obra_id||null,obra_nome||'',responsavel||'',data||'',status||'Vigente',obs||'',matricula||'',nome_func||'',ca||'');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documentos WHERE id=?').get(req.params.id);
  if (!doc) return res.status(404).json({ erro: 'Não encontrado.' });
  const { titulo,subtipo,obra_id,obra_nome,responsavel,data,status,obs,matricula,nome_func,ca } = req.body;
  db.prepare('UPDATE documentos SET titulo=?,subtipo=?,obra_id=?,obra_nome=?,responsavel=?,data=?,status=?,obs=?,matricula=?,nome_func=?,ca=? WHERE id=?')
    .run(titulo||doc.titulo,subtipo??doc.subtipo,obra_id??doc.obra_id,obra_nome??doc.obra_nome,responsavel??doc.responsavel,data||doc.data,status||doc.status,obs??doc.obs,matricula??doc.matricula,nome_func??doc.nome_func,ca??doc.ca,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM documentos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
