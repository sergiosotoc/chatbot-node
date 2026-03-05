/* src/admin/tarifas.controller.js */

const { supabase } = require("../config/supabase");

async function getTarifas(req, res) {
  const { data, error } = await supabase
    .from("tarifas")
    .select("*")
    .order("peso_max", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function crearTarifa(req, res) {
  const payload = normalizarPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const { data, error } = await supabase
    .from("tarifas")
    .insert(payload.value)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

async function actualizarTarifa(req, res) {
  const { id } = req.params;
  const payload = normalizarPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const { data, error } = await supabase
    .from("tarifas")
    .update(payload.value)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function eliminarTarifa(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("tarifas")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

function normalizarPayload(body = {}) {
  const value = {
    peso_max: Number(body.peso_max),
    estafeta_express_sin: Number(body.estafeta_express_sin || 0),
    estafeta_express_con: Number(body.estafeta_express_con || 0),
    estafeta_terrestre_sin: Number(body.estafeta_terrestre_sin || 0),
    estafeta_terrestre_con: Number(body.estafeta_terrestre_con || 0),
    fedex_terrestre_sin: Number(body.fedex_terrestre_sin || 0),
    fedex_terrestre_con: Number(body.fedex_terrestre_con || 0)
  };

  if (!Number.isFinite(value.peso_max) || value.peso_max <= 0) {
    return { ok: false, error: "peso_max debe ser un número mayor a 0" };
  }

  const keys = Object.keys(value);
  for (const key of keys) {
    if (!Number.isFinite(value[key])) {
      return { ok: false, error: `Valor inválido en ${key}` };
    }
  }

  return { ok: true, value };
}

module.exports = {
  getTarifas,
  crearTarifa,
  actualizarTarifa,
  eliminarTarifa
};
