/* src/services/whatsapp.service.js */

const axios = require("axios")

function normalizarNumero(to) {
    const limpio = String(to || "").replace(/\D/g, "")

    // Meta suele entregar MX como 521..., pero para enviar normalmente requiere 52...
    if (limpio.startsWith("521") && limpio.length >= 13) {
        return `52${limpio.slice(3)}`
    }

    return limpio
}

function logAxiosError(contexto, error, extra = {}) {
    const detalle = error.response?.data || error.message
    console.error(`WhatsApp API error (${contexto}):`, {
        ...extra,
        status: error.response?.status,
        detalle
    })
}

function getCredenciales(credenciales = {}) {
    const phoneId = credenciales.phoneId || process.env.WHATSAPP_PHONE_ID
    const token = credenciales.token || process.env.WHATSAPP_TOKEN

    if (!phoneId || !token) {
        throw new Error("Credenciales de WhatsApp incompletas: faltan phoneId o token")
    }

    return { phoneId, token }
}

async function enviarTexto(to, mensaje, credenciales = {}) {
    const destino = normalizarNumero(to)
    const { phoneId, token } = getCredenciales(credenciales)

    try {
        await axios.post(

            `https://graph.facebook.com/v19.0/${phoneId}/messages`,

            {
                messaging_product: "whatsapp",
                to: destino,
                type: "text",
                text: { body: mensaje }
            },

            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }

        )
    } catch (error) {
        logAxiosError("enviarTexto", error, {
            toOriginal: to,
            toNormalizado: destino,
            phoneId
        })
        throw error
    }
}

async function enviarDocumento(to, urlPdf, nombre, credenciales = {}) {
    const destino = normalizarNumero(to)
    const { phoneId, token } = getCredenciales(credenciales)

    try {
        await axios.post(

            `https://graph.facebook.com/v19.0/${phoneId}/messages`,

            {
                messaging_product: "whatsapp",
                to: destino,
                type: "document",
                document: {
                    link: urlPdf,
                    filename: nombre
                }
            },

            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }

        )
    } catch (error) {
        logAxiosError("enviarDocumento", error, {
            toOriginal: to,
            toNormalizado: destino,
            phoneId
        })
        throw error
    }

}

async function reenviarImagenConCaption(to, mediaId, caption, credenciales = {}) {
    const destino = normalizarNumero(to)
    const { phoneId, token } = getCredenciales(credenciales)

    try {
        await axios.post(
            `https://graph.facebook.com/v19.0/${phoneId}/messages`,
            {
                messaging_product: "whatsapp",
                to: destino,
                type: "image",
                image: {
                    id: mediaId,
                    caption: caption
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        )
    } catch (error) {
        logAxiosError("reenviarImagenConCaption", error, {
            toOriginal: to,
            toNormalizado: destino,
            mediaId,
            phoneId
        })
        throw error
    }
}

module.exports = {
    enviarTexto,
    enviarDocumento,
    reenviarImagenConCaption
}
