/* src/controllers/webhook.controller.js */

const { supabase } = require("../config/supabase");
const { procesarMensaje } = require("../services/flujo.service");
const { enviarTexto } = require("../services/whatsapp.service");
const { obtenerCredencialesWhatsApp } = require("../services/empresa-whatsapp.service");

async function resolverEmpresaId(phoneNumberId) {
    if (phoneNumberId) {
        const { data: empresa } = await supabase
            .from("empresas")
            .select("id")
            .eq("whatsapp_phone_id", phoneNumberId)
            .eq("activo", true)
            .single()
        if (empresa) return empresa.id
    }
    return process.env.DEFAULT_EMPRESA_ID || null
}

async function handleWebhook(req, res) {
    try {
        const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        if (!message) {
            return res.sendStatus(200)
        }

        const telefono = message.from
        const phoneNumberId = req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id
        const empresaId = await resolverEmpresaId(phoneNumberId)

        let query = supabase
            .from("clientes_whatsapp")
            .select("*")
            .eq("telefono", telefono)

        if (empresaId) {
            query = query.eq("empresa_id", empresaId)
        } else {
            query = query.is("empresa_id", null)
        }

        let { data: cliente } = await query.single()

        if (!cliente) {
            const { data } = await supabase
                .from("clientes_whatsapp")
                .insert({ telefono, empresa_id: empresaId })
                .select()
                .single()
            cliente = data
        } else if (empresaId && !cliente.empresa_id) {
            await supabase
                .from("clientes_whatsapp")
                .update({ empresa_id: empresaId })
                .eq("id", cliente.id)
            cliente = { ...cliente, empresa_id: empresaId }
        }


        const tipoMensaje = message.type || "text"
        const mediaId = message.image?.id || null
        const texto = message.text?.body || message.image?.caption || ""

        await supabase.from("mensajes").insert({
            cliente_id: cliente.id,
            direccion: "in",
            tipo: tipoMensaje,
            contenido: texto || "[imagen]"
        })
        const respuesta = await procesarMensaje(cliente.id, texto, tipoMensaje, mediaId, empresaId);

        if (respuesta?.tipo === "texto") {
          const creds = empresaId ? await obtenerCredencialesWhatsApp(empresaId) : null;
          const opts = creds ? { phoneId: creds.phoneId, token: creds.token } : {};
          await enviarTexto(telefono, respuesta.mensaje, opts);

          await supabase.from("mensajes").insert({
                cliente_id: cliente.id,
                direccion: "out",
                tipo: "text",
                contenido: respuesta.mensaje
            })

        }

        return res.sendStatus(200)

    } catch (error) {
        console.error("Webhook error:", error.message)
        return res.sendStatus(200)
    }
}

module.exports = { handleWebhook }
