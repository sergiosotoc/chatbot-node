/* src/admin/empresas.controller.js
 * Panel Admin: gestionar empresas sin ver datos bancarios ni empleados.
 * Admin puede: crear (user/pass), configurar WhatsApp, bloquear, eliminar.
 */
const bcrypt = require("bcryptjs");
const { supabase } = require("../config/supabase");

/** Lista empresas para admin: id, nombre, correo, telefono, activo, whatsapp_phone_id, count_usuarios.
 * Sin datos bancarios, sin lista de empleados. */
async function getEmpresasAdmin(req, res) {
  const { data: empresas, error: errE } = await supabase
    .from("empresas")
    .select("id, nombre, correo, telefono_whatsapp, activo, created_at, whatsapp_phone_id, whatsapp_token_encrypted")
    .order("created_at", { ascending: false });

  if (errE) return res.status(500).json({ error: errE.message });

  const withCount = [];
  for (const e of empresas || []) {
    const { count } = await supabase
      .from("operadores")
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", e.id);
    const { whatsapp_token_encrypted: _t, ...empresaSinToken } = e;
    withCount.push({
      ...empresaSinToken,
      count_usuarios: count ?? 0,
      whatsapp_configurado: !!(e.whatsapp_phone_id && e.whatsapp_token_encrypted),
    });
  }
  res.json(withCount);
}

/** Crear empresa: admin ingresa nombre, correo, telefono, username, password.
 * Opcional: whatsapp_phone_id, whatsapp_token para configurar API de WhatsApp.
 * Datos bancarios los ingresa la empresa en su perfil. */
async function crearEmpresaAdmin(req, res) {
  const { nombre, correo, telefono_whatsapp, username, password, whatsapp_phone_id, whatsapp_token } = req.body;
  if (!nombre || !username || !password) {
    return res.status(400).json({ error: "nombre, username y password son requeridos" });
  }
  const insertData = { nombre, correo, telefono_whatsapp };
  if (whatsapp_phone_id) insertData.whatsapp_phone_id = whatsapp_phone_id;
  if (whatsapp_token) insertData.whatsapp_token_encrypted = whatsapp_token;

  const { data: empresa, error: errEmpresa } = await supabase
    .from("empresas")
    .insert(insertData)
    .select()
    .single();
  if (errEmpresa) return res.status(500).json({ error: errEmpresa.message });

  const hash = await bcrypt.hash(password, 10);
  const { error: errUser } = await supabase.from("operadores").insert({
    username,
    password_hash: hash,
    rol: "empresa",
    nombre_completo: nombre,
    correo,
    empresa_id: empresa.id,
  });
  if (errUser) {
    await supabase.from("empresas").delete().eq("id", empresa.id);
    return res.status(500).json({ error: "Error creando usuario: " + errUser.message });
  }
  res.status(201).json({ success: true, empresa });
}

/** Actualizar empresa: admin puede modificar config (nombre, correo, telefono, activo, whatsapp_phone_id).
 * NO permite modificar datos bancarios (los gestiona la empresa). */
async function actualizarEmpresaAdmin(req, res) {
  const { id } = req.params;
  const { nombre, correo, telefono_whatsapp, activo, whatsapp_phone_id } = req.body;
  const update = {};
  if (nombre !== undefined) update.nombre = nombre;
  if (correo !== undefined) update.correo = correo;
  if (telefono_whatsapp !== undefined) update.telefono_whatsapp = telefono_whatsapp;
  if (activo !== undefined) update.activo = activo;
  if (whatsapp_phone_id !== undefined) update.whatsapp_phone_id = whatsapp_phone_id;

  const { error } = await supabase.from("empresas").update(update).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

/** Bloquear empresa: activo=false. Bloquea todo lo relacionado (usuarios no podrán acceder). */
async function bloquearEmpresaAdmin(req, res) {
  const { id } = req.params;
  const { error: errE } = await supabase.from("empresas").update({ activo: false }).eq("id", id);
  if (errE) return res.status(500).json({ error: errE.message });
  // Desactivar operadores de la empresa
  await supabase.from("operadores").update({ activo: false }).eq("empresa_id", id);
  res.json({ success: true });
}

/** Activar empresa (desbloquear). */
async function activarEmpresaAdmin(req, res) {
  const { id } = req.params;
  const { error: errE } = await supabase.from("empresas").update({ activo: true }).eq("id", id);
  if (errE) return res.status(500).json({ error: errE.message });
  await supabase.from("operadores").update({ activo: true }).eq("empresa_id", id);
  res.json({ success: true });
}

/** Eliminar empresa (soft delete: activo=false) o eliminación física según política. */
async function eliminarEmpresaAdmin(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("empresas").update({ activo: false }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  await supabase.from("operadores").update({ activo: false }).eq("empresa_id", id);
  res.json({ success: true });
}

/** Configurar WhatsApp API de una empresa (phone_id, token). */
async function configurarWhatsAppAdmin(req, res) {
  const { id } = req.params;
  const { whatsapp_phone_id, whatsapp_token } = req.body;
  const update = {};
  if (whatsapp_phone_id !== undefined) update.whatsapp_phone_id = whatsapp_phone_id || null;
  if (whatsapp_token !== undefined) update.whatsapp_token_encrypted = whatsapp_token;
  if (Object.keys(update).length === 0) return res.status(400).json({ error: "Datos requeridos" });
  const { error } = await supabase.from("empresas").update(update).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

module.exports = {
  getEmpresasAdmin,
  crearEmpresaAdmin,
  actualizarEmpresaAdmin,
  bloquearEmpresaAdmin,
  activarEmpresaAdmin,
  eliminarEmpresaAdmin,
  configurarWhatsAppAdmin,
};
