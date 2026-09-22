const jwt = require('jsonwebtoken');

const SECRET = 'clave_secreta_restaurante';

const autenticar = (req, res, next) => {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) return res.status(401).json({ mensaje: 'Se requiere iniciar sesión.' });

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ mensaje: 'La sesión no es válida o ya expiró.' });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Solo un administrador puede realizar esta acción.' });
  }
  next();
};

module.exports = { autenticar, soloAdmin };