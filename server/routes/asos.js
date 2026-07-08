const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',     (req, res) => res.json(db.prepare('SELECT * FROM asos ORDER BY criado_em DESC').all()));
router.get('/:id',  (req, res) => { const r=db.prepare('SELECT * FROM asos WHERE id=?').get(req.params.id); r?res.json(r):res.status(404).json({erro:'Não encontrado.'}); });

router.post('/', (req, res) => {
  const { funcionario_id,nome_funcionario,matricula,tipo,resultado,medico,crm,data_emissao,validade,obs } = req.body;
  const r = db.prepare('INSERT INTO asos (funcionario_id,nome_funcionario,matricula,tipo,resultado,medico,crm,data_emissao,validade,obs) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(funcionario_id||null,nome_funcionario||'',matricula||'',tipo||'',resultado||'',medico||'',crm||'',data_emissao||'',validade||'',obs||'');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const aso = db.prepare('SELECT * FROM asos WHERE id=?').get(req.params.id);
  if (!aso) return res.status(404).json({ erro: 'Não encontrado.' });
  const { funcionario_id,nome_funcionario,matricula,tipo,resultado,medico,crm,data_emissao,validade,obs } = req.body;
  db.prepare('UPDATE asos SET funcionario_id=?,nome_funcionario=?,matricula=?,tipo=?,resultado=?,medico=?,crm=?,data_emissao=?,validade=?,obs=? WHERE id=?')
    .run(funcionario_id??aso.funcionario_id,nome_funcionario??aso.nome_funcionario,matricula??aso.matricula,tipo??aso.tipo,resultado??aso.resultado,medico??aso.medico,crm??aso.crm,data_emissao??aso.data_emissao,validade??aso.validade,obs??aso.obs,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM asos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
