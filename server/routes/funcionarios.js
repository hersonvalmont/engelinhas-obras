const router = require('express').Router();
const db     = require('../database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Mapeamento de campos: frontend → DB
// frontend: funcao, obraId, regime, nrsExigidas, nrsStatus, nrsDetalhes, ativo, docs
// DB:       funcao, obra_id, regime, nrs_exigidas, nrs_status, nrs_detalhes, ativo, docs

function toFrontend(f) {
  return {
    id:           f.id,
    matricula:    f.matricula,
    nome:         f.nome,
    cpf:          f.cpf || '',
    funcao:       f.funcao || '',
    obraId:       f.obra_id ? String(f.obra_id) : '',
    regime:       f.regime || 'CLT',
    admissao:     f.admissao || '',
    docs:         f.docs || 'Pendente',
    ativo:        f.ativo === 1 || f.ativo === true,
    nrsExigidas:  JSON.parse(f.nrs_exigidas || '[]'),
    nrsStatus:    JSON.parse(f.nrs_status   || '{}'),
    nrsDetalhes:  JSON.parse(f.nrs_detalhes || '{}'),
    criadoEm:     f.criado_em
  };
}

router.get('/', (req, res) => {
  const lista = db.prepare('SELECT * FROM funcionarios ORDER BY nome').all();
  res.json(lista.map(toFrontend));
});

router.get('/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ erro: 'Não encontrado.' });
  res.json(toFrontend(f));
});

router.post('/', (req, res) => {
  const { matricula, nome, cpf, funcao, obraId, regime, admissao, docs, ativo,
          nrsExigidas, nrsStatus, nrsDetalhes } = req.body;

  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });

  // Gerar matrícula automática se não vier no body
  let mat = matricula;
  if (!mat) {
    const prefixos = { engenheiro:'ENG', montador:'MON', topograf:'TOP', acesso:'ACE',
                       motorista:'TRA', elétric:'ELE', eletric:'ELE', técnic:'TEC',
                       analista:'ADM', negociador:'ADM' };
    let pref = 'FUN';
    const fl = (funcao||'').toLowerCase();
    for (const [k,v] of Object.entries(prefixos)) { if(fl.includes(k)){ pref=v; break; } }
    const last = db.prepare("SELECT matricula FROM funcionarios WHERE matricula LIKE ? ORDER BY id DESC LIMIT 1")
                   .get(pref+'-%');
    const seq = last ? (parseInt(last.matricula.split('-')[1])||0)+1 : 1;
    mat = pref+'-'+String(seq).padStart(3,'0');
  }

  // Verificar duplicata de matrícula
  const existe = db.prepare('SELECT id FROM funcionarios WHERE matricula=?').get(mat);
  if (existe) return res.status(409).json({ erro: 'Matrícula já cadastrada.' });

  const r = db.prepare(`INSERT INTO funcionarios
      (matricula,nome,cpf,funcao,obra_id,regime,admissao,docs,ativo,nrs_exigidas,nrs_status,nrs_detalhes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(mat, nome, cpf||'', funcao||'', obraId||null, regime||'CLT',
         admissao||'', docs||'Pendente', ativo!==false?1:0,
         JSON.stringify(nrsExigidas||[]),
         JSON.stringify(nrsStatus||{}),
         JSON.stringify(nrsDetalhes||{}));

  res.status(201).json({ id: r.lastInsertRowid, matricula: mat });
});

router.put('/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM funcionarios WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ erro: 'Não encontrado.' });

  const { nome, cpf, funcao, obraId, regime, admissao, docs, ativo,
          nrsExigidas, nrsStatus, nrsDetalhes } = req.body;

  db.prepare(`UPDATE funcionarios SET nome=?,cpf=?,funcao=?,obra_id=?,regime=?,admissao=?,docs=?,ativo=?,
              nrs_exigidas=?,nrs_status=?,nrs_detalhes=? WHERE id=?`)
    .run(
      nome       ?? f.nome,
      cpf        ?? f.cpf,
      funcao     ?? f.funcao,
      obraId     !== undefined ? (obraId||null) : f.obra_id,
      regime     ?? f.regime,
      admissao   ?? f.admissao,
      docs       ?? f.docs,
      ativo      !== undefined ? (ativo?1:0) : f.ativo,
      JSON.stringify(nrsExigidas  || JSON.parse(f.nrs_exigidas||'[]')),
      JSON.stringify(nrsStatus    || JSON.parse(f.nrs_status  ||'{}')),
      JSON.stringify(nrsDetalhes  || JSON.parse(f.nrs_detalhes||'{}')),
      req.params.id
    );
  res.json({ ok: true });
});

// Toggle ativo
router.patch('/:id/toggle', (req, res) => {
  const f = db.prepare('SELECT id, ativo FROM funcionarios WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ erro: 'Não encontrado.' });
  db.prepare('UPDATE funcionarios SET ativo=? WHERE id=?').run(f.ativo ? 0 : 1, req.params.id);
  res.json({ ok: true, ativo: !f.ativo });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM funcionarios WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
