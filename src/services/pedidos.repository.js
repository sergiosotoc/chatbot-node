/* src/services/pedidos.repository.js */
const { getSheetsClient } = require("../config/google");
const { google: config } = require("../config/env");

function generarNumeroPedido() {
  const fecha = new Date();
  const timestamp = Date.now().toString().slice(-6);
  return `PED-${fecha.getFullYear()}${fecha.getMonth() + 1}${fecha.getDate()}-${timestamp}`;
}

async function guardarPedidoConfirmado({
  cliente,
  largo,
  ancho,
  alto,
  pesoReal,
  pesoFacturable,
  servicio,
  costo
}) {
  const sheets = await getSheetsClient();
  const numeroPedido = generarNumeroPedido();

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: "Pedidos!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        numeroPedido,
        new Date().toLocaleString(),
        cliente,
        largo,
        ancho,
        alto,
        pesoReal,
        pesoFacturable,
        servicio,
        costo,
        "Pendiente"
      ]]
    }
  });

  return numeroPedido;
}

async function obtenerPedidosPorCliente(clienteId) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: "Pedidos!A2:K"
  });

  const filas = response.data.values || [];

  return filas
    .filter(fila => fila[2] === clienteId)
    .slice(-5);
}

module.exports = {
  guardarPedidoConfirmado,
  obtenerPedidosPorCliente
};