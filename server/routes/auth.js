const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios.' });

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').get(email.trim().toLowerCase());
  if (!user) return res.status(401).json({ erro: 'Credenciais inválidas.' });

  const ok = bcrypt.compareSync(senha, user.senha_hash);
  if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas.' });

  const token = jwt.sign(
    { id: user.id, email: user.email, nome: user.nome, perfil: user.perfil, empresa: user.empresa },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, empresa: user.empresa } });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id,nome,email,perfil,empresa,criado_em FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(user);
});

module.exports = router;
