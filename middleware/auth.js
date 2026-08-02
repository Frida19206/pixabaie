const jwt = require('jsonwebtoken');

// Bloque l'accès si aucun token valide n'est fourni
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_dev', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Session invalide ou expirée, veuillez vous reconnecter.' });
    }
    req.user = user;
    next();
  });
}

// Attache l'utilisateur si un token valide est présent, mais ne bloque jamais
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET || 'secret_dev', (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

module.exports = { authMiddleware, optionalAuth };
