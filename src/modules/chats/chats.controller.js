/* src/modules/chats/chats.controller.js */

const { supabase } = require("../../config/supabase")
const { enviarTexto } = require("../../services/whatsapp.service")

async function getConversaciones(req, res) {

    const { data, error } = await supabase
        .from("clientes_whatsapp")
        .select("id,telefono")
        .order("created_at", { ascending: false })

    if (error) return res.status(500).json(error)

    res.json(data)

}

async function getConversacion(req, res) {

    const id = req.params.id

    const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: true })

    if (error) return res.status(500).json(error)

    res.json(data)

}

async function responder(req, res) {

    const { cliente_id, mensaje } = req.body

    const { data: cliente } = await supabase
        .from("clientes_whatsapp")
        .select("telefono")
        .eq("id", cliente_id)
        .single()

    if (!cliente) {
        return res.status(404).json({
            error: "Cliente no encontrado"
        })
    }

    await supabase.from("mensajes").insert({
        cliente_id,
        direccion: "out",
        tipo: "text",
        contenido: mensaje
    })

    await enviarTexto(cliente.telefono, mensaje)

    res.json({ success: true })

}

module.exports = {
    getConversaciones,
    getConversacion,
    responder
}