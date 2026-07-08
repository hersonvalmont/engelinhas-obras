const router = require('express').Router();
const db     = require('../database');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/usuarios
router.get('/', (req, res) => {
  const lista = db.prepare('SELECT id,nome,email,perfil,empresa,ativo,criado_em FROM usuarios ORDER BY nome').all();
  res.json(lista);
});

// POST /api/usuarios
router.post('/', (req, res) => {
  if (req.usuario.perfil !== 'Admin') return res.status(403).json({ erro: 'Sem permissão.' });
  const { nome, email, senha, perfil, empresa } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  if (senha.length < 4) return res.status(400).json({ erro: 'Senha mínima de 4 caracteres.' });
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.trim().toLowerCase());
  if (existe) return res.status(409).json({ erro: 'Já existe um usuário com este e-mail.' });
  const hash = bcrypt.hashSync(senha, 10);
  const result = db.prepare('INSERT INTO usuarios (nome,email,senha_hash,perfil,empresa) VALUES (?,?,?,?,?)').run(
    nome.trim(), email.trim().toLowerCase(), hash, perfil || 'Fiscal', empresa || 'Engelinhas'
  );
  res.status(201).json({ id: result.lastInsertRowid, nome, email, perfil, empresa });
});

// PUT /api/usuarios/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (req.usuario.perfil !== 'Admin' && req.usuario.id !== id) return res.status(403).json({ erro: 'Sem permissão.' });
  const { nome, perfil, empresa, senha } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  const novoNome    = nome    || user.nome;
  const novoPerfil  = perfil  || user.perfil;
  const novaEmpresa = empresa || user.empresa;
  if (senha) {
    const hash = bcrypt.hashSync(senha, 10);
    db.prepare('UPDATE usuarios SET nome=?,perfil=?,empresa=?,senha_hash=? WHERE id=?').run(novoNome,novoPerfil,novaEmpresa,hash,id);
  } else {
    db.prepare('UPDATE usuarios SET nome=?,perfil=?,empresa=? WHERE id=?').run(novoNome,novoPerfil,novaEmpresa,id);
  }
  res.json({ ok: true });
});

// DELETE /api/usuarios/:id
router.delete('/:id', (req, res) => {
  if (req.usuario.perfil !== 'Admin') return res.status(403).json({ erro: 'Sem permissão.' });
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (user.email === 'guilherme@engelinhas.com.br') return res.status(403).json({ erro: 'Não é possível excluir o administrador padrão.' });
  db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').run(id);
  res.json({ ok: true });
});

// PATCH /api/usuarios/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  if (req.usuario.perfil !== 'Admin') return res.status(403).json({ erro: 'Sem permissão.' });
  const id   = Number(req.params.id);
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (user.email === 'guilherme@engelinhas.com.br' && user.ativo === 1) return res.status(403).json({ erro: 'Não é possível desativar o administrador padrão.' });
  db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(user.ativo ? 0 : 1, id);
  res.json({ ok: true, ativo: !user.ativo });
});

module.exports = router;
