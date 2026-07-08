const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',     (req, res) => res.json(db.prepare('SELECT * FROM obras ORDER BY nome').all()));
router.get('/:id',  (req, res) => { const r=db.prepare('SELECT * FROM obras WHERE id=?').get(req.params.id); r?res.json(r):res.status(404).json({erro:'Não encontrada.'}); });

router.post('/', (req, res) => {
  const { nome,uf,fase,criticidade,fiscal,prazo,progresso,status,obs } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  const r = db.prepare('INSERT INTO obras (nome,uf,fase,criticidade,fiscal,prazo,progresso,status,obs) VALUES (?,?,?,?,?,?,?,?,?)').run(nome,uf||'',fase||'',criticidade||'',fiscal||'',prazo||'',progresso||0,status||'Ativa',obs||'');
  res.status(201).json({ id: r.lastInsertRowid, ...req.body });
});

router.put('/:id', (req, res) => {
  const { nome,uf,fase,criticidade,fiscal,prazo,progresso,status,obs } = req.body;
  const obra = db.prepare('SELECT * FROM obras WHERE id=?').get(req.params.id);
  if (!obra) return res.status(404).json({ erro: 'Não encontrada.' });
  db.prepare('UPDATE obras SET nome=?,uf=?,fase=?,criticidade=?,fiscal=?,prazo=?,progresso=?,status=?,obs=? WHERE id=?')
    .run(nome||obra.nome,uf||obra.uf,fase||obra.fase,criticidade||obra.criticidade,fiscal||obra.fiscal,prazo||obra.prazo,progresso??obra.progresso,status||obra.status,obs??obra.obs,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM obras WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
