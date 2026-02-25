/* src/service/estadoWatcher.service.js */
const { getSheetsClient } = require("../config/google");
const { google: config } = require("../config/env");
const { enviarPlantilla, enviarDocumento } = require("./whatsapp.service");

let cacheEstados = new Map();
let inicializado = false;

async function revisarEstados() {
  try {

    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: "Pedidos!A2:N"
    });

    const filas = response.data.values || [];

    for (const fila of filas) {

      if (!fila || fila.length < 11) continue;

      const numeroPedido = fila[0];
      const cliente = fila[2];
      const estado = (fila[10] || "").toString().trim();
      const numeroGuia = fila[11];
      const urlPdf = fila[12];

      if (!numeroPedido || !cliente) continue;

      const estadoNormalizado = estado.toLowerCase();

      if (!inicializado) {
        cacheEstados.set(numeroPedido, estadoNormalizado);
        continue;
      }

      const estadoAnterior = cacheEstados.get(numeroPedido);

      if (estadoAnterior !== estadoNormalizado) {

        if (estadoNormalizado === "guía generada" || estadoNormalizado === "guia generada") {

          if (numeroGuia) {
            await enviarPlantilla(
              cliente,
              "guia_generada",
              [numeroPedido, numeroGuia]
            );
          }

          if (urlPdf) {
            await enviarDocumento(cliente, urlPdf);
          }
        }

        cacheEstados.set(numeroPedido, estadoNormalizado);
      }
    }

    inicializado = true;

  } catch (error) {
    console.error("Error revisando estados:", error.message);
  }
}

function iniciarWatcher() {

  console.log("👀 Watcher de estados activo...");

  revisarEstados(); 

  setInterval(revisarEstados, 15000); 
}

module.exports = { iniciarWatcher };