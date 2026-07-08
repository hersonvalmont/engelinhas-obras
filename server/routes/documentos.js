const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function toFrontend(d) {
  return {
    id:           d.id,
    tipo:         d.tipo,           // 'rh-epi' | 'rh-anexos' | 'contrato-tecnico' | etc.
    titulo:       d.titulo,
    tipo_doc:     d.subtipo || '',  // subtipo do documento (ex: "Aditivo")
    obraId:       d.obra_id ? String(d.obra_id) : '',
    obraNome:     d.obra_nome || '',
    responsavel:  d.responsavel || '',
    data:         d.data || '',
    status:       d.status || 'Vigente',
    obs:          d.obs || '',
    matricula:    d.matricula || '',
    nomeFuncionario: d.nome_func || '',
    ca:           d.ca || '',
    criadoEm:     d.criado_em
  };
}

// GET /api/documentos?tipo=contrato-tecnico
router.get('/', (req, res) => {
  const { tipo } = req.query;
  const lista = tipo
    ? db.prepare('SELECT * FROM documentos WHERE tipo=? ORDER BY criado_em DESC').all(tipo)
    : db.prepare('SELECT * FROM documentos ORDER BY criado_em DESC').all();
  res.json(lista.map(toFrontend));
});

router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM documentos WHERE id=?').get(req.params.id);
  r ? res.json(toFrontend(r)) : res.status(404).json({ erro: 'Não encontrado.' });
});

router.post('/', (req, res) => {
  // frontend envia: tipo_doc (tipo do repo), titulo, tipo (subtipo), obraId, obraNome,
  //                 responsavel, data, status, obs, matricula, nomeFuncionario, ca
  const { tipo_doc, titulo, tipo, obraId, obraNome, responsavel, data,
          status, obs, matricula, nomeFuncionario, ca } = req.body;

  const tipoPrincipal = tipo_doc || tipo || '';
  if (!tipoPrincipal || !titulo) return res.status(400).json({ erro: 'Tipo e título obrigatórios.' });

  const r = db.prepare(`INSERT INTO documentos
      (tipo,titulo,subtipo,obra_id,obra_nome,responsavel,data,status,obs,matricula,nome_func,ca)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(tipoPrincipal, titulo, tipo||'', obraId||null, obraNome||'',
         responsavel||'', data||'', status||'Vigente', obs||'',
         matricula||'', nomeFuncionario||'', ca||'');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documentos WHERE id=?').get(req.params.id);
  if (!doc) return res.status(404).json({ erro: 'Não encontrado.' });
  const { titulo, tipo, obraId, obraNome, responsavel, data,
          status, obs, matricula, nomeFuncionario, ca } = req.body;
  db.prepare(`UPDATE documentos SET titulo=?,subtipo=?,obra_id=?,obra_nome=?,responsavel=?,data=?,status=?,obs=?,matricula=?,nome_func=?,ca=? WHERE id=?`)
    .run(titulo||doc.titulo, tipo??doc.subtipo, obraId??doc.obra_id, obraNome??doc.obra_nome,
         responsavel??doc.responsavel, data||doc.data, status||doc.status, obs??doc.obs,
         matricula??doc.matricula, nomeFuncionario??doc.nome_func, ca??doc.ca, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM documentos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
