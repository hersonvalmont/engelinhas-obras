const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function toFrontend(a) {
  return {
    id:             a.id,
    matricula:      a.matricula || '',
    nomeFuncionario:a.nome_funcionario || '',
    tipo:           a.tipo || '',
    resultado:      a.resultado || '',
    medico:         a.medico || '',
    crm:            a.crm || '',
    dataEmissao:    a.data_emissao || '',
    validade:       a.validade || '',
    obs:            a.obs || '',
    criadoEm:       a.criado_em
  };
}

router.get('/',    (req, res) => res.json(db.prepare('SELECT * FROM asos ORDER BY criado_em DESC').all().map(toFrontend)));
router.get('/:id', (req, res) => { const r=db.prepare('SELECT * FROM asos WHERE id=?').get(req.params.id); r?res.json(toFrontend(r)):res.status(404).json({erro:'Não encontrado.'}); });

router.post('/', (req, res) => {
  const { matricula, nomeFuncionario, tipo, resultado, medico, crm, dataEmissao, validade, obs } = req.body;
  const r = db.prepare(`INSERT INTO asos (nome_funcionario,matricula,tipo,resultado,medico,crm,data_emissao,validade,obs)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(nomeFuncionario||'', matricula||'', tipo||'', resultado||'', medico||'', crm||'', dataEmissao||'', validade||'', obs||'');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const aso = db.prepare('SELECT * FROM asos WHERE id=?').get(req.params.id);
  if (!aso) return res.status(404).json({ erro: 'Não encontrado.' });
  const { matricula, nomeFuncionario, tipo, resultado, medico, crm, dataEmissao, validade, obs } = req.body;
  db.prepare(`UPDATE asos SET nome_funcionario=?,matricula=?,tipo=?,resultado=?,medico=?,crm=?,data_emissao=?,validade=?,obs=? WHERE id=?`)
    .run(nomeFuncionario??aso.nome_funcionario, matricula??aso.matricula, tipo??aso.tipo,
         resultado??aso.resultado, medico??aso.medico, crm??aso.crm,
         dataEmissao??aso.data_emissao, validade??aso.validade, obs??aso.obs, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM asos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
