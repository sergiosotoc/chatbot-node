/* src/services/cotizador.service.js */
const { getSheetsClient } = require("../config/google");
const { google: config } = require("../config/env");

let cacheTarifas = null;
let ultimaCarga = 0;
const CACHE_TIEMPO = 5 * 60 * 1000;
const FACTOR_VOLUMETRICO = 5000;

function limpiarNumero(valor) {
  if (!valor) return 0;
  return Number(valor.toString().replace(",", ".")) || 0;
}

function calcularPesoVolumetrico(largo, ancho, alto) {
  return (largo * ancho * alto) / FACTOR_VOLUMETRICO;
}

function obtenerPesoFacturable(pesoReal, pesoVol) {
  return Math.max(pesoReal, pesoVol);
}

async function cargarTarifas() {

  const ahora = Date.now();

  if (cacheTarifas && (ahora - ultimaCarga < CACHE_TIEMPO)) {
    return cacheTarifas;
  }

  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: "Tarifas!A2:G100"
  });

  const filas = response.data.values || [];

  cacheTarifas = filas.map(fila => ({
    peso: limpiarNumero(fila[0]),
    estafetaExpress: limpiarNumero(fila[2]),
    estafetaTerrestre: limpiarNumero(fila[4]),
    fedexTerrestre: limpiarNumero(fila[6])
  })).filter(f => f.peso > 0);

  ultimaCarga = ahora;

  return cacheTarifas;
}

function buscarTarifa(tarifas, pesoFacturable) {
  const tarifa = tarifas.find(t => pesoFacturable <= t.peso);
  return tarifa || tarifas[tarifas.length - 1];
}

async function cotizar({ largo, ancho, alto, pesoReal }) {

  const pesoVol = calcularPesoVolumetrico(largo, ancho, alto);
  const pesoFacturable = obtenerPesoFacturable(pesoReal, pesoVol);

  const tarifas = await cargarTarifas();
  const tarifa = buscarTarifa(tarifas, pesoFacturable);

  return {
    pesoVolumetrico: pesoVol.toFixed(2),
    pesoFacturable: pesoFacturable.toFixed(2),
    estafetaExpress: Math.round(tarifa?.estafetaExpress || 0),
    estafetaTerrestre: Math.round(tarifa?.estafetaTerrestre || 0),
    fedexTerrestre: Math.round(tarifa?.fedexTerrestre || 0)
  };
}

module.exports = { cotizar };