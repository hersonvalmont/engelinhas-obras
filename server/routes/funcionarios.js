const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const lista = db.prepare('SELECT * FROM funcionarios ORDER BY nome').all();
  // Parse JSON fields
  res.json(lista.map(f => ({
    ...f,
    nrs_exigidas: JSON.parse(f.nrs_exigidas || '[]'),
    nrs_detalhes: JSON.parse(f.nrs_detalhes || '{}')
  })));
});

router.get('/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ erro: 'Não encontrado.' });
  res.json({ ...f, nrs_exigidas: JSON.parse(f.nrs_exigidas||'[]'), nrs_detalhes: JSON.parse(f.nrs_detalhes||'{}') });
});

router.post('/', (req, res) => {
  const { matricula,nome,cargo,empresa,obra_id,status,admissao,telefone,email,nrs_exigidas,nrs_detalhes } = req.body;
  if (!nome || !matricula) return res.status(400).json({ erro: 'Nome e matrícula obrigatórios.' });
  const existe = db.prepare('SELECT id FROM funcionarios WHERE matricula=?').get(matricula);
  if (existe) return res.status(409).json({ erro: 'Matrícula já cadastrada.' });
  const r = db.prepare('INSERT INTO funcionarios (matricula,nome,cargo,empresa,obra_id,status,admissao,telefone,email,nrs_exigidas,nrs_detalhes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(matricula,nome,cargo||'',empresa||'',obra_id||null,status||'Ativo',admissao||'',telefone||'',email||'',JSON.stringify(nrs_exigidas||[]),JSON.stringify(nrs_detalhes||{}));
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ erro: 'Não encontrado.' });
  const { matricula,nome,cargo,empresa,obra_id,status,admissao,telefone,email,nrs_exigidas,nrs_detalhes } = req.body;
  db.prepare('UPDATE funcionarios SET matricula=?,nome=?,cargo=?,empresa=?,obra_id=?,status=?,admissao=?,telefone=?,email=?,nrs_exigidas=?,nrs_detalhes=? WHERE id=?')
    .run(matricula||f.matricula,nome||f.nome,cargo??f.cargo,empresa??f.empresa,obra_id??f.obra_id,status||f.status,admissao??f.admissao,telefone??f.telefone,email??f.email,
      JSON.stringify(nrs_exigidas||JSON.parse(f.nrs_exigidas||'[]')),
      JSON.stringify(nrs_detalhes||JSON.parse(f.nrs_detalhes||'{}')),
      req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM funcionarios WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
