/* src/modules/chats/chats.controller.js */

const { supabase } = require("../../config/supabase");
const { enviarTexto } = require("../../services/whatsapp.service");
const { obtenerCredencialesWhatsApp } = require("../../services/empresa-whatsapp.service");

function getEmpresaIdScope(req) {
  if (req.user?.role === "admin") return null
  return req.user?.empresa_id || null
}

async function getConversaciones(req, res) {
    const empresaId = getEmpresaIdScope(req)

    let query = supabase
        .from("clientes_whatsapp")
        .select("id, telefono, nombre")
        .order("created_at", { ascending: false })

    if (empresaId) {
        query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query

    if (error) return res.status(500).json(error)

    res.json(data || [])
}

async function getConversacion(req, res) {
    const id = req.params.id
    const empresaId = getEmpresaIdScope(req)

    const { data: cliente } = await supabase
        .from("clientes_whatsapp")
        .select("id, empresa_id")
        .eq("id", id)
        .single()

    if (!cliente) {
        return res.status(404).json({ error: "Conversación no encontrada" })
    }

    if (empresaId && cliente.empresa_id !== empresaId) {
        return res.status(403).json({ error: "Acceso denegado a esta conversación" })
    }

    const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: true })

    if (error) return res.status(500).json(error)

    res.json(data || [])
}

async function responder(req, res) {
    const { cliente_id, mensaje } = req.body
    const empresaId = getEmpresaIdScope(req)

    const { data: cliente } = await supabase
        .from("clientes_whatsapp")
        .select("id, telefono, empresa_id")
        .eq("id", cliente_id)
        .single()

    if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" })
    }

    if (empresaId && cliente.empresa_id !== empresaId) {
        return res.status(403).json({ error: "Acceso denegado a este chat" })
    }

    await supabase.from("mensajes").insert({
      cliente_id,
      direccion: "out",
      tipo: "text",
      contenido: mensaje,
    });

    const creds = cliente.empresa_id ? await obtenerCredencialesWhatsApp(cliente.empresa_id) : null;
    const opts = creds ? { phoneId: creds.phoneId, token: creds.token } : {};
    await enviarTexto(cliente.telefono, mensaje, opts);

    res.json({ success: true });

}

module.exports = {
    getConversaciones,
    getConversacion,
    responder
}