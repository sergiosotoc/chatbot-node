/* src/admin/errores.controller.js - Errores del sistema para soporte (solo admin) */
const { getErroresRecientes, getErroresDesdeBD } = require("../services/error-logger.service");

async function getErrores(req, res) {
  try {
    let errores = getErroresRecientes();
    const desdeBD = await getErroresDesdeBD(100);
    if (desdeBD.length > 0) {
      const seen = new Set(errores.map((e) => e.created_at + e.mensaje));
      for (const e of desdeBD) {
        const key = e.created_at + e.mensaje;
        if (!seen.has(key)) {
          errores.push(e);
          seen.add(key);
        }
      }
      errores = errores.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);
    }
    res.json(errores);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo errores" });
  }
}

module.exports = { getErrores };
