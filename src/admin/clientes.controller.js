/* src/admin/clientes.controller.js */

const { supabase } = require("../config/supabase");

function getEmpresaIdScope(req) {
  if (req.user?.role === "admin") return null;
  return req.user?.empresa_id || null;
}

async function getClientes(req, res) {
  const empresaId = getEmpresaIdScope(req);

  let query = supabase
    .from("clientes_whatsapp")
    .select("*")
    .order("created_at", { ascending: false });

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data || []);
}

module.exports = { getClientes };