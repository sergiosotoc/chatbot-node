/* src/controllers/webhook.controller.js */

const { supabase } = require("../config/supabase")
const { procesarMensaje } = require("../services/flujo.service")
const { enviarTexto } = require("../services/whatsapp.service")

async function handleWebhook(req, res) {

    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    if (!message) return res.sendStatus(200)

    const telefono = message.from
    const texto = message.text?.body || ""

    let { data: cliente } = await supabase
        .from("clientes_whatsapp")
        .select("*")
        .eq("telefono", telefono)
        .single()

    if (!cliente) {

        const { data } = await supabase
            .from("clientes_whatsapp")
            .insert({ telefono })
            .select()
            .single()

        cliente = data

    }

    await supabase.from("mensajes").insert({

        cliente_id: cliente.id,
        direccion: "in",
        tipo: "text",
        contenido: texto

    })

    // 🔥 ejecutar flujo del bot
    const respuesta = await procesarMensaje(cliente.id, texto)

    if (respuesta?.tipo === "texto") {

        await enviarTexto(telefono, respuesta.mensaje)

        await supabase.from("mensajes").insert({
            cliente_id: cliente.id,
            direccion: "out",
            tipo: "text",
            contenido: respuesta.mensaje
        })

    }

    res.sendStatus(200)

}

module.exports = { handleWebhook }