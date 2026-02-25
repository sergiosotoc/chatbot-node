/* src/controllers/webhook.controller.js */
const { enviarTexto } = require("../services/whatsapp.service");
const { procesarMensaje } = require("../services/flujo.service");

async function handleWebhook(req, res) {
  try {
    const payload = req.body;
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const body = message.text?.body;

    if (!body) return res.sendStatus(200);

    console.log("Mensaje recibido:", body);

    const respuesta = await procesarMensaje(from, body);

    await enviarTexto(from, respuesta);

    res.sendStatus(200);

  } catch (error) {
    console.error("ERROR WEBHOOK:", error);
    res.sendStatus(200);
  }
}

module.exports = { handleWebhook };