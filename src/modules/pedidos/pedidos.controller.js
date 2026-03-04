/* src/admin/pedidos.controller.js */

const { supabase } = require("../../config/supabase")
const { enviarDocumento } = require("../../services/whatsapp.service")

async function getPedidos(req, res) {

    const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) return res.status(500).json(error)

    res.json(data)

}

async function enviarGuia(req, res) {

    const { folio, urlPdf } = req.body

    const { data } = await supabase
        .from("pedidos")
        .select("*")
        .eq("folio", folio)
        .single()

    await enviarDocumento(data.cliente_id, urlPdf, "Guia_" + folio + ".pdf")

    await supabase
        .from("pedidos")
        .update({
            guia_url: urlPdf,
            estatus: "guia_enviada"
        })
        .eq("folio", folio)

    res.json({ success: true })

}

module.exports = {
    getPedidos,
    enviarGuia
}