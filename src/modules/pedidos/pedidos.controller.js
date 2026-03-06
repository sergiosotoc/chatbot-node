/* src/modules/pedidos/pedidos.controller.js */

const { supabase } = require("../../config/supabase");
const { enviarDocumento } = require("../../services/whatsapp.service");
const { obtenerCredencialesWhatsApp } = require("../../services/empresa-whatsapp.service");

function getEmpresaIdScope(req) {
  if (req.user?.role === "admin") return null;
  return req.user?.empresa_id || null;
}

async function getPedidos(req, res) {
  const empresaId = getEmpresaIdScope(req);

  let query = supabase
    .from("v_pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json(data || []);
}

async function enviarGuia(req, res) {
  const { folio, urlPdf } = req.body;
  const empresaId = getEmpresaIdScope(req);

  if (!folio || !urlPdf) {
    return res.status(400).json({ error: "folio y urlPdf son requeridos" });
  }

  let query = supabase
    .from("v_pedidos")
    .select("*")
    .eq("folio", folio);

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data: pedido, error } = await query.single();

  if (error || !pedido) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const telefono = pedido.telefono_cliente;

  if (!telefono) {
    return res.status(400).json({ error: "No se encontró teléfono del cliente" });
  }

  try {
    const creds = pedido.empresa_id ? await obtenerCredencialesWhatsApp(pedido.empresa_id) : null;
    const opts = creds ? { phoneId: creds.phoneId, token: creds.token } : {};
    await enviarDocumento(telefono, urlPdf, "Guia_" + folio + ".pdf", opts);
  } catch (err) {
    return res.status(500).json({ error: "Error enviando documento por WhatsApp: " + err.message });
  }

  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ guia_url: urlPdf, estatus: "guia_enviada" })
    .eq("folio", folio);

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ success: true });
}

module.exports = { getPedidos, enviarGuia };