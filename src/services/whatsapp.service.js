/* src/services/whatsapp.service.js */

const axios = require("axios")

async function enviarTexto(to, mensaje) {

    await axios.post(

        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,

        {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: mensaje }
        },

        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        }

    )

}

async function enviarDocumento(to, urlPdf, nombre) {

    await axios.post(

        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,

        {
            messaging_product: "whatsapp",
            to,
            type: "document",
            document: {
                link: urlPdf,
                filename: nombre
            }
        },

        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        }

    )

}

module.exports = {
    enviarTexto,
    enviarDocumento
}