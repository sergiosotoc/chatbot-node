/* src/modules/pedidos/pedidos.controller.js */

const { supabase } = require("../../config/supabase");
const { enviarDocumento } = require("../../services/whatsapp.service");

async function getPedidos(req, res) {

  const { data, error } = await supabase
    .from("v_pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
}

async function enviarGuia(req, res) {
  const { folio, urlPdf } = req.body;

  if (!folio || !urlPdf) {
    return res.status(400).json({ error: "folio y urlPdf son requeridos" });
  }

  const { data: pedido, error } = await supabase
    .from("v_pedidos")
    .select("*")
    .eq("folio", folio)
    .single();

  if (error || !pedido) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const telefono = pedido.telefono_cliente;

  if (!telefono) {
    return res.status(400).json({ error: "No se encontró teléfono del cliente" });
  }

  try {
    await enviarDocumento(telefono, urlPdf, "Guia_" + folio + ".pdf");
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