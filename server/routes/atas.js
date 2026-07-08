const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function toFrontend(a) {
  return {
    id:            a.id,
    titulo:        a.titulo,
    obraId:        a.obra_id ? String(a.obra_id) : '',
    obraNome:      a.obra_nome || '',
    data:          a.data || '',
    participantes: a.participantes || '',
    pauta:         a.pauta || '',
    decisoes:      a.deliberacoes || '',   // frontend chama 'decisoes', DB chama 'deliberacoes'
    acoes:         a.acoes || '',
    status:        a.status || 'rascunho',
    criadoEm:      a.criado_em
  };
}

router.get('/',    (req, res) => res.json(db.prepare('SELECT * FROM atas ORDER BY data DESC').all().map(toFrontend)));
router.get('/:id', (req, res) => { const r=db.prepare('SELECT * FROM atas WHERE id=?').get(req.params.id); r?res.json(toFrontend(r)):res.status(404).json({erro:'Não encontrada.'}); });

router.post('/', (req, res) => {
  // frontend envia: titulo, obraId, obraNome, data, participantes, pauta, decisoes, acoes, status
  const { titulo, obraId, obraNome, data, participantes, pauta, decisoes, acoes, status } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'Título obrigatório.' });
  const r = db.prepare(`INSERT INTO atas (titulo,obra_id,obra_nome,data,participantes,pauta,deliberacoes,acoes,status)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(titulo, obraId||null, obraNome||'', data||'', participantes||'', pauta||'', decisoes||'', acoes||'', status||'rascunho');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const ata = db.prepare('SELECT * FROM atas WHERE id=?').get(req.params.id);
  if (!ata) return res.status(404).json({ erro: 'Não encontrada.' });
  const { titulo, obraId, obraNome, data, participantes, pauta, decisoes, acoes, status } = req.body;
  db.prepare(`UPDATE atas SET titulo=?,obra_id=?,obra_nome=?,data=?,participantes=?,pauta=?,deliberacoes=?,acoes=?,status=? WHERE id=?`)
    .run(titulo||ata.titulo, obraId??ata.obra_id, obraNome??ata.obra_nome, data||ata.data,
         participantes??ata.participantes, pauta??ata.pauta, decisoes??ata.deliberacoes,
         acoes??ata.acoes, status||ata.status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM atas WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
