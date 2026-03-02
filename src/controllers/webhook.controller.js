/* src/controllers/webhook.controller.js */

const { enviarTexto, enviarPlantilla } = require("../services/whatsapp.service");
const { procesarMensaje } = require("../services/flujo.service");

let mensajesProcesados = [];

async function handleWebhook(req, res) {

    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const messageId = message.id;
    if (mensajesProcesados.includes(messageId)) return res.sendStatus(200);

    mensajesProcesados.push(messageId);
    if (mensajesProcesados.length > 50) mensajesProcesados.shift();

    const from = message.from;

    let texto = "";
    let tipoMensaje = message.type;
    let mediaId = null;

    if (message.type === "text") {
        texto = message.text.body;
    }

    if (message.type === "button") {
        texto = message.button.text;
    }

    if (message.type === "image") {
        texto = "__IMAGEN__";
        mediaId = message.image.id;
    }

    res.sendStatus(200);

    try {
        const respuesta = await procesarMensaje(from, texto, tipoMensaje, mediaId);

        if (!respuesta) return;

        if (respuesta.tipo === "plantilla") {
            await enviarPlantilla(from, respuesta.nombre, respuesta.parametros || []);
            return;
        }

        if (respuesta.tipo === "texto") {
            await enviarTexto(from, respuesta.mensaje);
            return;
        }

    } catch (e) {
        console.error("Error procesando:", e);
    }
}

module.exports = { handleWebhook };