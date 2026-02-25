/* src/services/flujo.service.js */
const { cotizar } = require("./cotizador.service");
const { guardarPedidoConfirmado, obtenerPedidosPorCliente } = require("./pedidos.repository");

const sesiones = new Map();
const TIEMPO_EXPIRACION = 60 * 60 * 1000;

const palabrasClaveSaludo = [
    "hola", "hi", "hello", "hey",
    "buen día", "buenos días",
    "buenas tardes", "buenas noches",
    "qué tal", "que tal",
    "cómo estás", "como estas",
    "saludos", "qué onda", "que onda",
    "buen dia", "buenos dias",
    "¿qué tal?", "¿que tal?",
    "¿cómo estás?", "¿como estas?"
];

const palabrasClaveIntencion = [
    "cotizar", "cotización", "precio", "cuánto cuesta",
    "cuanto cuesta", "envío", "envios", "paquetería",
    "paqueteria", "guía", "guia", "costo"
];

function esSaludo(texto) {
    return palabrasClaveSaludo.some(p => texto.includes(p));
}

function esIntencionCotizar(texto) {
    return palabrasClaveIntencion.some(p => texto.includes(p));
}

function iniciarSesion(clienteId) {
    sesiones.set(clienteId, {
        step: "LARGO",
        data: {},
        lastActivity: Date.now()
    });
}

function obtenerSesion(clienteId) {
    const sesion = sesiones.get(clienteId);
    if (!sesion) return null;

    if (Date.now() - sesion.lastActivity > TIEMPO_EXPIRACION) {
        sesiones.delete(clienteId);
        return "EXPIRADA";
    }

    return sesion;
}

function actualizarActividad(clienteId) {
    const sesion = sesiones.get(clienteId);
    if (sesion) sesion.lastActivity = Date.now();
}

function eliminarSesion(clienteId) {
    sesiones.delete(clienteId);
}

function validarNumero(valor) {
    const n = parseFloat(valor);
    return !isNaN(n) && n > 0 ? n : null;
}

async function procesarMensaje(clienteId, mensaje) {

    mensaje = mensaje.trim().toLowerCase();

    if (mensaje === "cancelar") {
        eliminarSesion(clienteId);
        return "❌ Proceso cancelado.\nEscribe un saludo para iniciar nuevamente.";
    }

    if (mensaje === "mis pedidos") {
        const pedidos = await obtenerPedidosPorCliente(clienteId);

        if (!pedidos.length) {
            return "No tienes pedidos registrados.";
        }

        let respuesta = "📦 *Tus últimos pedidos:*\n\n";

        pedidos.forEach((p, i) => {
            respuesta +=
                `#${i + 1}\n` +
                `🧾 ${p[0]}\n` +
                `📅 ${p[1]}\n` +
                `🚚 ${p[8]}\n` +
                `💰 $${p[9]}\n` +
                `📌 Estado: ${p[10]}\n\n`;
        });

        return respuesta;
    }

    if (esSaludo(mensaje) || esIntencionCotizar(mensaje)) {
        eliminarSesion(clienteId);
        iniciarSesion(clienteId);
        return `👋 Hola, soy el asistente de cotizaciones.

Estoy aquí para ayudarte a calcular el costo de tu envío de forma rápida y segura.

📏 Para comenzar, ingresa el LARGO del paquete (cm):`;
    }

    if (!sesiones.has(clienteId)) {
        return "Si deseas cotizar, escribe un saludo o algo como 'quiero cotizar un envío'.";
    }

    const sesion = obtenerSesion(clienteId);

    if (sesion === "EXPIRADA") {
        return "⏳ Tu sesión expiró por inactividad.\nEscribe un saludo para comenzar nuevamente.";
    }

    if (!sesion) {
        return "Escribe un saludo para iniciar.";
    }

    actualizarActividad(clienteId);

    switch (sesion.step) {

        case "LARGO": {
            const largo = validarNumero(mensaje);
            if (!largo) {
                return "⚠️ Valor inválido.\nDebes ingresar el LARGO en centímetros (solo números).";
            }
            sesion.data.largo = largo;
            sesion.step = "ANCHO";
            return "📦 Ingresa el ANCHO (cm):";
        }

        case "ANCHO": {
            const ancho = validarNumero(mensaje);
            if (!ancho) {
                return "⚠️ Valor inválido.\nDebes ingresar el ANCHO en centímetros (solo números).";
            }
            sesion.data.ancho = ancho;
            sesion.step = "ALTO";
            return "📦 Ingresa el ALTO (cm):";
        }

        case "ALTO": {
            const alto = validarNumero(mensaje);
            if (!alto) {
                return "⚠️ Valor inválido.\nDebes ingresar el ALTO en centímetros (solo números).";
            }
            sesion.data.alto = alto;
            sesion.step = "PESO";
            return "⚖️ Ingresa el PESO real (kg):";
        }

        case "PESO": {
            const peso = validarNumero(mensaje);
            if (!peso) {
                return "⚠️ Valor inválido.\nDebes ingresar el PESO en kilogramos (solo números).";
            }

            sesion.data.pesoReal = peso;

            const resultado = await cotizar(sesion.data);

            sesion.data.cotizacion = resultado;
            sesion.step = "SERVICIO";

            return (
                `📦 *Tu cotización:*\n\n` +
                `⚖️ Peso facturable: ${resultado.pesoFacturable} kg\n\n` +
                `1️⃣ Estafeta Express: $${resultado.estafetaExpress}\n` +
                `2️⃣ Estafeta Terrestre: $${resultado.estafetaTerrestre}\n` +
                `3️⃣ FedEx Terrestre: $${resultado.fedexTerrestre}\n\n` +
                `Escribe 1, 2 o 3 para elegir servicio.`
            );
        }

        case "SERVICIO": {

            if (!["1", "2", "3"].includes(mensaje)) {
                return "⚠️ Opción no válida.\nDebes escribir 1, 2 o 3.";
            }

            const mapaServicios = {
                "1": "Estafeta Express",
                "2": "Estafeta Terrestre",
                "3": "FedEx Terrestre"
            };

            const mapaCostos = {
                "1": sesion.data.cotizacion.estafetaExpress,
                "2": sesion.data.cotizacion.estafetaTerrestre,
                "3": sesion.data.cotizacion.fedexTerrestre
            };

            sesion.data.servicio = mapaServicios[mensaje];
            sesion.data.costo = mapaCostos[mensaje];
            sesion.step = "CONFIRMAR";

            return (
                `Confirmar pedido:\n\n` +
                `Servicio: ${sesion.data.servicio}\n` +
                `Costo: $${sesion.data.costo}\n\n` +
                `Escribe SI para confirmar o NO para cancelar.`
            );
        }

        case "CONFIRMAR": {

            if (["si", "sí", "s"].includes(mensaje)) {

                const numeroPedido = await guardarPedidoConfirmado({
                    cliente: clienteId,
                    largo: sesion.data.largo,
                    ancho: sesion.data.ancho,
                    alto: sesion.data.alto,
                    pesoReal: sesion.data.pesoReal,
                    pesoFacturable: sesion.data.cotizacion.pesoFacturable,
                    servicio: sesion.data.servicio,
                    costo: sesion.data.costo
                });

                eliminarSesion(clienteId);

                return `✅ Pedido confirmado.

🧾 Número: ${numeroPedido}

Escribe "mis pedidos" para consultar tu historial.`;
            }

            if (["no", "n"].includes(mensaje)) {
                eliminarSesion(clienteId);
                return "❌ Pedido cancelado.\nEscribe un saludo para iniciar nuevamente.";
            }

            return "⚠️ Respuesta inválida.\nEscribe SI para confirmar o NO para cancelar.";
        }

        default:
            eliminarSesion(clienteId);
            return "Error interno. Escribe un saludo para comenzar nuevamente.";
    }
}

module.exports = { procesarMensaje };