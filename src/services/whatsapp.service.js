/* src/services/whatsapp.service.js
 * Envía mensajes por WhatsApp usando credenciales por empresa.
 * Si se pasan credenciales (phoneId, token), se usan; si no, se usan las globales de .env.
 */
const axios = require("axios");

function getCredenciales(credenciales = {}) {
  const phoneId = credenciales.phoneId || process.env.WHATSAPP_PHONE_ID;
  const token = credenciales.token || process.env.WHATSAPP_TOKEN;
  return { phoneId, token };
}

async function enviarTexto(to, mensaje, credenciales = {}) {
  const { phoneId, token } = getCredenciales(credenciales);
  if (!phoneId || !token) {
    throw new Error("Credenciales de WhatsApp no configuradas (Phone ID y Token requeridos)");
  }
  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: mensaje },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function enviarDocumento(to, urlPdf, nombre, credenciales = {}) {
  const { phoneId, token } = getCredenciales(credenciales);
  if (!phoneId || !token) {
    throw new Error("Credenciales de WhatsApp no configuradas (Phone ID y Token requeridos)");
  }
  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "document",
      document: {
        link: urlPdf,
        filename: nombre,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function reenviarImagenConCaption(to, mediaId, caption, credenciales = {}) {
  const { phoneId, token } = getCredenciales(credenciales);
  if (!phoneId || !token) {
    throw new Error("Credenciales de WhatsApp no configuradas (Phone ID y Token requeridos)");
  }
  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "image",
      image: {
        id: mediaId,
        caption: caption,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = {
  enviarTexto,
  enviarDocumento,
  reenviarImagenConCaption,
  getCredenciales,
};
