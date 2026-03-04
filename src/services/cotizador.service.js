/* src/services/cotizador.service.js */
const { supabase } = require("../config/supabase");

async function cotizar({ largo, ancho, alto, pesoReal, conFactura = false }) {
    const L = Number(largo);
    const A = Number(ancho);
    const H = Number(alto);
    const P = Number(pesoReal);

    const pesoVol = (L * A * H) / 5000;
    const pesoFacturable = Math.ceil(Math.max(P, pesoVol));
    
    const CARGO_EXCEDENTE = (L > 100 || A > 100 || H > 100) ? 175 : 0;
    
    // Consultamos la tabla de tarifas en Supabase
    const { data: tarifas, error } = await supabase
        .from("tarifas")
        .select("*")
        .gte("peso_max", pesoFacturable)
        .order("peso_max", { ascending: true })
        .limit(1);

    if (error || !tarifas.length) throw new Error("No hay tarifa para este peso");

    const t = tarifas[0];
    const sufijo = conFactura ? '_con' : '_sin';

    return {
        pesoFacturable,
        cargoExcedente: CARGO_EXCEDENTE,
        conFactura,
        estafetaExpress: t[`estafeta_express${sufijo}`] + CARGO_EXCEDENTE,
        estafetaTerrestre: t[`estafeta_terrestre${sufijo}`] + CARGO_EXCEDENTE,
        fedexTerrestre: t[`fedex_terrestre${sufijo}`] + CARGO_EXCEDENTE
    };
}