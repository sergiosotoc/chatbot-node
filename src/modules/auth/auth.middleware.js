/* src/modules/auth/auth.middleware.js */

const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol admin." });
  }
  next();
}

function requireEmpresa(req, res, next) {
  if (!["admin", "empresa"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol empresa o admin." });
  }
  next();
}

function requireUsuario(req, res, next) {
  if (!["admin", "empresa", "usuario"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Acceso denegado." });
  }
  next();
}

module.exports = { verifyJWT, requireAdmin, requireEmpresa, requireUsuario };