const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'engelinhas_secret_2017';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Token não fornecido.' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
