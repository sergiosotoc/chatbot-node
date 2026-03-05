/* src/modules/empresa/empresa.controller.js */

const bcrypt = require("bcryptjs");
const { supabase } = require("../../config/supabase");

// Configuracion - usado desde /admin/empresa
async function getEmpresa(req, res) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function updateEmpresa(req, res) {
  const { id, nombre, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular } = req.body;
  if (!id) return res.status(400).json({ error: "id es requerido" });
  const { error } = await supabase
    .from("empresas")
    .update({ nombre, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular })
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// CRUD empresas - usado desde /empresas
async function getEmpresas(req, res) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function crearEmpresa(req, res) {
  try {
    const { nombre, correo, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular, username, password } = req.body;
    if (!nombre || !username || !password) {
      return res.status(400).json({ error: "nombre, username y password son requeridos" });
    }
    const { data: empresa, error: errEmpresa } = await supabase
      .from("empresas")
      .insert({ nombre, correo, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular })
      .select()
      .single();
    if (errEmpresa) return res.status(500).json({ error: errEmpresa.message });
    const hash = await bcrypt.hash(password, 10);
    const { error: errUser } = await supabase
      .from("operadores")
      .insert({ username, password_hash: hash, rol: "empresa", nombre_completo: nombre, correo, empresa_id: empresa.id });
    if (errUser) {
      await supabase.from("empresas").delete().eq("id", empresa.id);
      return res.status(500).json({ error: "Error creando usuario: " + errUser.message });
    }
    res.status(201).json({ success: true, empresa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
}

async function actualizarEmpresa(req, res) {
  const { id } = req.params;
  const { nombre, correo, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular, activo } = req.body;
  const { error } = await supabase
    .from("empresas")
    .update({ nombre, correo, telefono_whatsapp, numero_operador, banco, cuenta, clabe, titular, activo })
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

async function eliminarEmpresa(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("empresas").update({ activo: false }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// Usuarios de empresa
async function getUsuariosDeEmpresa(req, res) {
  const { id } = req.params;
  if (req.user.role === "empresa" && req.user.empresa_id !== id) {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  const { data, error } = await supabase
    .from("operadores")
    .select("id, username, nombre_completo, correo, telefono, rol, activo, created_at")
    .eq("empresa_id", id)
    .eq("rol", "usuario")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function crearUsuarioEnEmpresa(req, res) {
  try {
    const { id: empresa_id } = req.params;
    if (req.user.role === "empresa" && req.user.empresa_id !== empresa_id) {
      return res.status(403).json({ error: "No puedes crear usuarios en otra empresa" });
    }
    const { username, password, nombre_completo, correo, telefono } = req.body;
    if (!username || !password || !nombre_completo) {
      return res.status(400).json({ error: "username, password y nombre_completo son requeridos" });
    }
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("operadores")
      .insert({ username, password_hash: hash, rol: "usuario", nombre_completo, correo, telefono, empresa_id })
      .select("id, username, nombre_completo, correo, rol, created_at")
      .single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Ese username ya existe" });
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ success: true, usuario: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
}

async function actualizarUsuario(req, res) {
  const { usuario_id } = req.params;
  const { nombre_completo, correo, telefono, activo, password } = req.body;
  const update = { nombre_completo, correo, telefono, activo };
  if (password) update.password_hash = await bcrypt.hash(password, 10);
  if (req.user.role === "empresa") {
    const { data } = await supabase.from("operadores").select("empresa_id").eq("id", usuario_id).single();
    if (!data || data.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
  }
  const { error } = await supabase.from("operadores").update(update).eq("id", usuario_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

async function eliminarUsuario(req, res) {
  const { usuario_id } = req.params;
  if (req.user.role === "empresa") {
    const { data } = await supabase.from("operadores").select("empresa_id").eq("id", usuario_id).single();
    if (!data || data.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
  }
  const { error } = await supabase.from("operadores").update({ activo: false }).eq("id", usuario_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

module.exports = {
  getEmpresa,
  updateEmpresa,
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  getUsuariosDeEmpresa,
  crearUsuarioEnEmpresa,
  actualizarUsuario,
  eliminarUsuario
};