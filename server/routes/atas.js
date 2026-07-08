const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',     (req, res) => res.json(db.prepare('SELECT * FROM atas ORDER BY data DESC').all()));
router.get('/:id',  (req, res) => { const r=db.prepare('SELECT * FROM atas WHERE id=?').get(req.params.id); r?res.json(r):res.status(404).json({erro:'Não encontrada.'}); });

router.post('/', (req, res) => {
  const { titulo,obra_id,obra_nome,data,participantes,pauta,deliberacoes,acoes,status } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'Título obrigatório.' });
  const r = db.prepare('INSERT INTO atas (titulo,obra_id,obra_nome,data,participantes,pauta,deliberacoes,acoes,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(titulo,obra_id||null,obra_nome||'',data||'',participantes||'',pauta||'',deliberacoes||'',acoes||'',status||'Rascunho');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const ata = db.prepare('SELECT * FROM atas WHERE id=?').get(req.params.id);
  if (!ata) return res.status(404).json({ erro: 'Não encontrada.' });
  const { titulo,obra_id,obra_nome,data,participantes,pauta,deliberacoes,acoes,status } = req.body;
  db.prepare('UPDATE atas SET titulo=?,obra_id=?,obra_nome=?,data=?,participantes=?,pauta=?,deliberacoes=?,acoes=?,status=? WHERE id=?')
    .run(titulo||ata.titulo,obra_id??ata.obra_id,obra_nome??ata.obra_nome,data||ata.data,participantes??ata.participantes,pauta??ata.pauta,deliberacoes??ata.deliberacoes,acoes??ata.acoes,status||ata.status,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM atas WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
