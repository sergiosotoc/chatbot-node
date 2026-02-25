/* src/controllers/webhook.controller.js */
const { enviarTexto } = require("../services/whatsapp.service");
const { procesarMensaje } = require("../services/flujo.service");

const mensajesProcesados = new Set();

async function handleWebhook(req, res) {
  try {
    const payload = req.body;
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const messageId = message.id;

    if (mensajesProcesados.has(messageId)) {
      console.log("Mensaje duplicado ignorado:", messageId);
      return res.sendStatus(200);
    }

    mensajesProcesados.add(messageId);

    const from = message.from;
    const body = message.text?.body;

    if (!body) return res.sendStatus(200);

    console.log("Mensaje recibido:", body);

    res.sendStatus(200);

    const respuesta = await procesarMensaje(from, body);
    await enviarTexto(from, respuesta);

  } catch (error) {
    console.error("ERROR WEBHOOK:", error);
    res.sendStatus(200);
  }
}

module.exports = { handleWebhook };