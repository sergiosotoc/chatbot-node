/* src/modules/operadores.controller.js */

const { supabase } = require("../config/supabase");
const bcrypt = require("bcryptjs");

async function getOperadores(req, res) {

  const { data, error } = await supabase
    .from("v_operadores")
    .select("id, username, nombre_completo, correo, rol, activo, created_at, empresa_nombre")
    .order("created_at", { ascending: false });

  if (error) {
    const { data: fallback, error: err2 } = await supabase
      .from("operadores")
      .select("id, username, nombre_completo, correo, rol, activo, created_at, empresa_id")
      .order("created_at", { ascending: false });

    if (err2) return res.status(500).json({ error: err2.message });
    return res.json(fallback);
  }

  res.json(data);
}

async function crearOperador(req, res) {

  const { username, password, rol, nombre_completo, correo, empresa_id } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username y password son requeridos" });
  }

  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("operadores")
    .insert({
      username,
      password_hash: hash,
      rol:            rol || "agente",
      nombre_completo,
      correo,
      empresa_id:     empresa_id || null
    })
    .select("id, username, rol, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ese username ya existe" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ success: true, operador: data });
}

module.exports = { getOperadores, crearOperador };