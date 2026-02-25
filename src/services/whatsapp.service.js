/* src/services/whatsapp.service.js */
const axios = require("axios");
const { whatsapp } = require("../config/env");

function formatearNumero(numero) {
  return numero.replace(/^521/, "52");
}

async function enviarTexto(to, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${whatsapp.phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: formatearNumero(to),
      type: "text",
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${whatsapp.token}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function enviarPlantilla(to, nombrePlantilla, parametros = []) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${whatsapp.phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: formatearNumero(to),
      type: "template",
      template: {
        name: nombrePlantilla,
        language: { code: "es_MX" },
        components: [
          {
            type: "body",
            parameters: parametros.map(p => ({
              type: "text",
              text: p
            }))
          }
        ]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${whatsapp.token}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function enviarDocumento(to, urlDocumento) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${whatsapp.phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: formatearNumero(to),
      type: "document",
      document: {
        link: urlDocumento,
        filename: "Guia_Envio.pdf"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${whatsapp.token}`,
        "Content-Type": "application/json"
      }
    }
  );
}

module.exports = { enviarTexto, enviarPlantilla, enviarDocumento };