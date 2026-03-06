/**
 * Servicio de registro de errores para soporte.
 * Los errores se guardan con información específica para que el admin pueda dar soporte.
 * También mantiene un buffer en memoria para errores recientes (sin BD).
 */
const { supabase } = require("../config/supabase");

const BUFFER_MAX = 100;
const bufferEnMemoria = [];

async function registrarError(opts) {
  const {
    nivel = "error",
    codigo,
    mensaje,
    detalle,
    contexto = {},
  } = typeof opts === "string" ? { mensaje: opts } : opts;

  const entry = {
    nivel,
    codigo: codigo || null,
    mensaje: mensaje || "Error desconocido",
    detalle: detalle || null,
    contexto,
    created_at: new Date().toISOString(),
  };

  bufferEnMemoria.unshift(entry);
  if (bufferEnMemoria.length > BUFFER_MAX) bufferEnMemoria.pop();

  try {
    const { error } = await supabase.from("errores_sistema").insert({
      nivel: entry.nivel,
      codigo: entry.codigo,
      mensaje: entry.mensaje,
      detalle: entry.detalle,
      contexto: entry.contexto,
    });
    if (error) console.error("Error guardando en BD:", error.message);
  } catch (e) {
    console.error("Error en error-logger:", e.message);
  }

  return entry;
}

function getErroresRecientes() {
  return [...bufferEnMemoria];
}

async function getErroresDesdeBD(limite = 50, desde = null) {
  try {
    let query = supabase
      .from("errores_sistema")
      .select("id, nivel, codigo, mensaje, detalle, contexto, created_at")
      .order("created_at", { ascending: false })
      .limit(limite);
    if (desde) query = query.lte("created_at", desde);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch (_) {
    return [];
  }
}

module.exports = {
  registrarError,
  getErroresRecientes,
  getErroresDesdeBD,
};
