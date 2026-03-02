/* src/services/cotizador.service.js */
const { getSheetsClient } = require("../config/google");
const { google: config } = require("../config/env");

let cacheTarifas = null;
let ultimaCarga = 0;
const CACHE_TIEMPO = 10 * 60 * 1000;

function limpiarNumero(valor) {
    if (!valor) return 0;
    const limpio = valor.toString().replace(/[$\s]/g, "").replace(",", ".");
    return Number(limpio) || 0;
}

async function cargarTarifas() {
    const ahora = Date.now();
    if (cacheTarifas && (ahora - ultimaCarga < CACHE_TIEMPO)) return cacheTarifas;

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: "Tarifas!A2:G100" 
    });

    const filas = response.data.values || [];
    cacheTarifas = filas.map(f => ({
        pesoMax: limpiarNumero(f[0]),
        estafetaExpress:   { sin: limpiarNumero(f[1]), con: limpiarNumero(f[2]) },
        estafetaTerrestre: { sin: limpiarNumero(f[3]), con: limpiarNumero(f[4]) },
        fedexTerrestre:    { sin: limpiarNumero(f[5]), con: limpiarNumero(f[6]) }
    })).filter(f => f.pesoMax > 0);

    ultimaCarga = ahora;
    return cacheTarifas;
}

async function cotizar({ largo, ancho, alto, pesoReal, conFactura = false }) {
    const L = limpiarNumero(largo);
    const A = limpiarNumero(ancho);
    const H = limpiarNumero(alto);
    const P = limpiarNumero(pesoReal);

    const pesoVol = (L * A * H) / 5000;
    const pesoFacturable = Math.ceil(Math.max(P, pesoVol));
    
    // Regla de negocio: +175 si algún lado mide más de 1m (100cm)
    const CARGO_EXCEDENTE = (L > 100 || A > 100 || H > 100) ? 175 : 0;
    
    const tarifas = await cargarTarifas();
    const t = tarifas.find(t => pesoFacturable <= t.pesoMax) || tarifas[tarifas.length - 1];
    const modo = conFactura ? 'con' : 'sin';

    return {
        pesoFacturable,
        cargoExcedente: CARGO_EXCEDENTE,
        conFactura,
        estafetaExpress: t.estafetaExpress[modo] + CARGO_EXCEDENTE,
        estafetaTerrestre: t.estafetaTerrestre[modo] + CARGO_EXCEDENTE,
        fedexTerrestre: t.fedexTerrestre[modo] + CARGO_EXCEDENTE
    };
}

module.exports = { cotizar };