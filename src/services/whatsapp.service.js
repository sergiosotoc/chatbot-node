/* src/services/whatsapp.service.js */

const axios = require("axios");

const API_VERSION = "v25.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Enviar mensaje de texto
 */
async function enviarTexto(to, mensaje) {
    try {
        await axios.post(
            `${BASE_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: {
                    body: mensaje
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (error) {
        console.error("❌ ERROR WHATSAPP API (texto):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Enviar plantilla
 */
async function enviarPlantilla(to, nombrePlantilla, parametros = []) {
    try {
        const components = [];

        if (parametros.length > 0) {
            components.push({
                type: "body",
                parameters: parametros.map(p => ({
                    type: "text",
                    text: p
                }))
            });
        }

        await axios.post(
            `${BASE_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: {
                    name: nombrePlantilla,
                    language: {
                        code: "es_MX"
                    },
                    components
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (error) {
        console.error("❌ ERROR WHATSAPP API (plantilla):", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Reenviar imagen con caption al operador
 */
async function reenviarImagenConCaption(to, mediaId, caption) {
    try {

        // 1️⃣ Obtener URL temporal del media
        const mediaResponse = await axios.get(
            `${BASE_URL}/${mediaId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
                }
            }
        );

        const mediaUrl = mediaResponse.data.url;

        // 2️⃣ Enviar imagen con caption
        await axios.post(
            `${BASE_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "image",
                image: {
                    link: mediaUrl,
                    caption: caption
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        console.error("❌ ERROR WHATSAPP API (imagen):", error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    enviarTexto,
    enviarPlantilla,
    reenviarImagenConCaption
};