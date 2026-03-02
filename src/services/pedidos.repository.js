/* src/services/pedidos.repository.js */
const { getSheetsClient } = require("../config/google");
const { google: config } = require("../config/env");

async function guardarPedidoConfirmado(clienteId, d) {
    const sheets = await getSheetsClient();
    const folio = `PED-${Date.now().toString().slice(-6)}`;
    const facturaTxt = d.conFactura ? "CON FACTURA" : "SIN FACTURA";

    const row = [
        folio, new Date().toLocaleString("es-MX"), clienteId,
        d.origen.nombre, d.origen.calle, d.origen.colonia, d.origen.ciudad, d.origen.cp, d.origen.cel,
        d.destino.nombre, d.destino.calle, d.destino.colonia, d.destino.ciudad, d.destino.cp, d.destino.cel,
        d.paquete.medidas, d.paquete.peso, d.paquete.contenido,
        `${d.servicio} ($${d.costo}) - ${facturaTxt}`, // Columna S
        "Pendiente", // T: Estatus
        "", "",      // U y V
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: "Pedidos!A:V",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] }
    });
    return folio;
}

async function obtenerPedidosPorCliente(clienteId) {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId, range: "Pedidos!A2:T"
    });
    const filas = res.data.values || [];
    return filas.filter(f => f[2] === clienteId).map(f => ({ folio: f[0], estatus: f[19] })).slice(-5);
}

module.exports = { guardarPedidoConfirmado, obtenerPedidosPorCliente };