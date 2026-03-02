/* src/admin/admin.controller.js */
const { getSheetsClient } = require("../config/google");
const { google: googleConfig } = require("../config/env");

async function getDashboard(req, res) {
    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: googleConfig.spreadsheetId,
            range: "Pedidos!A2:T" 
        });

        const filas = response.data.values || [];
        
        const pedidos = filas.map(f => ({
            folio: f[0] || "S/F",
            fecha: f[1] || "",
            cliente: f[2] || "S/C",
            servicio: f[18] || "No especificado",
            estatus: f[19] || "Pendiente"
        })).reverse().slice(0, 10);

        const hoy = new Date().toLocaleDateString("es-MX");
        
        return res.json({
            user: req.user || { username: "Admin" },
            stats: {
                totalHoy: filas.filter(f => f[1] && f[1].includes(hoy)).length,
                pendientes: filas.filter(f => f[19] === "Pendiente").length
            },
            pedidos: pedidos,
            health: { status: "ok", uptime: process.uptime() }
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR 500:", error);
        res.status(500).json({ error: "Error en el servidor de datos" });
    }
}

module.exports = { getDashboard };