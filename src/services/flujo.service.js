/* src/services/flujo.service.js */

const { cotizar } = require("./cotizador.service");
const { guardarPedidoConfirmado, obtenerPedidosPorCliente } = require("../modules/pedidos/pedidos.repository");
const { enviarTexto, reenviarImagenConCaption } = require("./whatsapp.service");
const { obtenerCredencialesWhatsApp } = require("./empresa-whatsapp.service");

const VEINTICUATRO_HORAS = 24 * 60 * 60 * 1000;
const sesiones = new Map();

/**
 * 🔐 Cleanup expired sessions every hour
 */
setInterval(() => {
  const ahora = Date.now();
  for (const [key, value] of sesiones.entries()) {
    if (!value?.ultimaInteraccion) continue;

    if (ahora - value.ultimaInteraccion > VEINTICUATRO_HORAS) {
      sesiones.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Procesar mensaje principal
 * @param {string} clienteId
 * @param {string} mensaje
 * @param {string} tipoMensaje
 * @param {string|null} mediaId
 * @param {string|null} empresaId - Para usar credenciales WhatsApp de la empresa
 */
async function procesarMensaje(clienteId, mensaje, tipoMensaje = "text", mediaId = null, empresaId = null) {

  try {

    mensaje = mensaje?.trim?.() || "";
    const ahora = Date.now();

    let sesion = sesiones.get(clienteId);

    // ===============================
    // CREAR SESIÓN SI NO EXISTE
    // ===============================
    if (!sesion) {
      sesion = {
        estado: "MENU",
        ultimaInteraccion: ahora
      };
      sesiones.set(clienteId, sesion);

      return {
        tipo: "texto",
        mensaje:
          `👋 Hola, bienvenido a *AHSE Paquetería*.

Estoy listo para ayudarte con tu envío.

Selecciona una opción:

1️⃣ Cotizar envío
2️⃣ Rastrear guía
3️⃣ Hablar con asesor`
      };
    }

    const fueraDeVentana = (ahora - sesion.ultimaInteraccion) > VEINTICUATRO_HORAS;
    sesion.ultimaInteraccion = ahora;

    if (fueraDeVentana) {
      sesion.estado = "MENU";
      return { tipo: "plantilla", nombre: "menu_atencion_cliente" };
    }

    if (["hola", "menu", "inicio"].includes(mensaje.toLowerCase())) {
      sesion.estado = "MENU";
      return responderMenu();
    }

    // ===============================
    // ESPERANDO COMPROBANTE
    // ===============================
    if (sesion.estado === "ESPERANDO_COMPROBANTE") {

      if (tipoMensaje === "image" && mediaId) {
        const numOperador = process.env.NUMERO_OPERADOR.replace(/^521/, '52');
        const d = sesion.datosTemporales; // Aquí están los datos que extrajimos del formato

        // Construimos el mensaje detallado para el operador
        const mensajeParaOperador = `📸 *COMPROBANTE RECIBIDO*
    
*FOLIO:* ${sesion.folioPendiente}
*SERVICIO:* ${sesion.servicioElegido || 'No especificado'}

*ORIGEN*
*Nombre:* ${d.origen.nombre}
*Calle:* ${d.origen.calle}
*Colonia:* ${d.origen.colonia}
*Ciudad:* ${d.origen.ciudad}
*CP:* ${d.origen.cp}
*Cel:* ${d.origen.cel}

*DESTINO*
*Nombre:* ${d.destino.nombre}
*Calle:* ${d.destino.calle}
*Colonia:* ${d.destino.colonia}
*Ciudad:* ${d.destino.ciudad}
*CP:* ${d.destino.cp}
*Cel:* ${d.destino.cel}

*PAQUETE*
*Medidas:* ${d.paquete.medidas}
*Peso:* ${d.paquete.peso} kg
*Contenido:* ${d.paquete.contenido}

Adjunto comprobante enviado por el cliente (${clienteId}):`;

        try {
          const creds = empresaId ? await obtenerCredencialesWhatsApp(empresaId) : null;
          const opts = creds ? { phoneId: creds.phoneId, token: creds.token } : {};
          await enviarTexto(numOperador, mensajeParaOperador, opts);
          await reenviarImagenConCaption(
            numOperador,
            mediaId,
            `Comprobante Folio: ${sesion.folioPendiente}`,
            opts
          );
        } catch (error) {
          console.error("Error notificando al operador:", error.message);
        }

        sesiones.delete(clienteId);
        return {
          tipo: "texto",
          mensaje: "✅ Hemos recibido tu comprobante. En breve validaremos el pago y generaremos tu guía."
        };
      }

      return {
        tipo: "texto",
        mensaje:
          `⚠️ Estamos esperando tu comprobante de pago.

Por favor envía la imagen del comprobante para continuar.`
      };
    }

    // ===============================
    // MENU
    // ===============================
    if (sesion.estado === "MENU") {

      if (mensaje.includes("1") || mensaje.toLowerCase().includes("cotizar")) {
        sesion.estado = "ESPERANDO_FORMATO";

        return {
          tipo: "texto",
          mensaje:
            `📦 *FORMATO DE DATOS*
Copia y rellena este mensaje:

*ORIGEN*
Nombre Origen:
Calle y Número Origen:
Colonia Origen:
Ciudad y Estado Origen:
CP Origen:
Cel Origen:

*DESTINO*
Nombre Destino:
Calle y Número Destino:
Colonia Destino:
Ciudad y Estado Destino:
CP Destino:
Cel Destino:

*PAQUETE*
Medidas (LxAxA):
Peso (kg):
Contenido:`
        };
      }

      if (mensaje.includes("2") || mensaje.toLowerCase().includes("rastrear")) {
        const pedidos = await obtenerPedidosPorCliente(clienteId);

        if (!pedidos?.length) {
          return { tipo: "texto", mensaje: "No tienes pedidos recientes." };
        }

        let txt = "🔎 *Tus últimos pedidos:*";
        pedidos.forEach(p => {
          txt += `\n\nFolio: *${p.folio}*\nEstatus: ${p.estatus}`;
        });

        return { tipo: "texto", mensaje: txt };
      }

      if (mensaje.includes("3") || mensaje.toLowerCase().includes("asesor")) {
        return { tipo: "texto", mensaje: "📞 Un asesor te atenderá pronto." };
      }

      return responderMenu();
    }

    // ===============================
    // ESPERANDO FORMATO
    // ===============================
    if (sesion.estado === "ESPERANDO_FORMATO") {

      const datos = extraerDatos(mensaje);

      if (!/^\d{5}$/.test(datos.origen.cp) ||
        !/^\d{5}$/.test(datos.destino.cp)) {
        return { tipo: "texto", mensaje: "❌ El CP debe tener 5 dígitos." };
      }

      if (!/^\d{10}$/.test(datos.origen.cel) ||
        !/^\d{10}$/.test(datos.destino.cel)) {
        return { tipo: "texto", mensaje: "❌ El celular debe tener 10 dígitos." };
      }

      sesion.datosTemporales = datos;
      sesion.estado = "PREGUNTANDO_FACTURA";

      return {
        tipo: "texto",
        mensaje:
          `¿Tu envío requiere factura? 🧾

1️⃣ Sí
2️⃣ No`
      };
    }

    // ===============================
    // PREGUNTANDO FACTURA
    // ===============================
    if (sesion.estado === "PREGUNTANDO_FACTURA") {

      const respuesta = mensaje.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const esSi = ["1", "si"].includes(respuesta);
      const esNo = ["2", "no"].includes(respuesta);

      if (!esSi && !esNo) {
        return { tipo: "texto", mensaje: "Responde con 1, 2, si o no." };
      }

      const d = sesion.datosTemporales;

      const medidas = d.paquete.medidas?.match(/(\d+)\s*[x*]\s*(\d+)\s*[x*]\s*(\d+)/i);
      const peso = d.paquete.peso?.match(/(\d+)/);

      if (!medidas || !peso) {
        return {
          tipo: "texto",
          mensaje: "❌ Formato inválido. Usa ejemplo: 30x20x10 y peso 5"
        };
      }

      const resultado = await cotizar({
        largo: medidas[1],
        ancho: medidas[2],
        alto: medidas[3],
        pesoReal: peso[1],
        conFactura: esSi
      });

      sesion.cotizacion = resultado;
      sesion.estado = "CONFIRMANDO_PEDIDO";

      return {
        tipo: "texto",
        mensaje:
          `💰 *COTIZACIÓN*

1️⃣ Estafeta Express: $${resultado.estafetaExpress}
2️⃣ Estafeta Terrestre: $${resultado.estafetaTerrestre}
3️⃣ FedEx Terrestre: $${resultado.fedexTerrestre}

Elige 1, 2 o 3 para confirmar.`
      };
    }

    // ===============================
    // CONFIRMAR PEDIDO
    // ===============================
    if (sesion.estado === "CONFIRMANDO_PEDIDO") {

      const opciones = {
        "1": { nombre: "Estafeta Express", costo: sesion.cotizacion?.estafetaExpress },
        "2": { nombre: "Estafeta Terrestre", costo: sesion.cotizacion?.estafetaTerrestre },
        "3": { nombre: "FedEx Terrestre", costo: sesion.cotizacion?.fedexTerrestre }
      };

      if (!opciones[mensaje]) {
        return { tipo: "texto", mensaje: "Elige 1, 2 o 3." };
      }

      const pedidoFinal = {
        ...sesion.datosTemporales,
        servicio: opciones[mensaje].nombre,
        costo: opciones[mensaje].costo
      };

      sesion.servicioElegido = opciones[mensaje].nombre;

      const folio = await guardarPedidoConfirmado(clienteId, pedidoFinal);

      sesion.estado = "ESPERANDO_COMPROBANTE";
      sesion.folioPendiente = folio;

      return {
        tipo: "texto",
        mensaje:
          `✅ *PEDIDO REGISTRADO: ${folio}*

💳 Para generar tu guía realiza la transferencia por *$${pedidoFinal.costo}*.

🏦 *Datos bancarios*
Banco: ${process.env.BANCO}
Cuenta: ${process.env.CUENTA}
CLABE: ${process.env.CLABE}
Titular: ${process.env.TITULAR}

📸 Envía tu comprobante por este medio.`
      };
    }

    return responderMenu();

  } catch (error) {
    console.error("Flow error:", error.message);

    return {
      tipo: "texto",
      mensaje: "⚠️ Ocurrió un error interno. Intenta nuevamente."
    };
  }
}

function responderMenu() {
  return {
    tipo: "texto",
    mensaje:
      `Selecciona una opción:

1️⃣ Cotizar envío
2️⃣ Rastrear guía
3️⃣ Hablar con asesor`
  };
}

function extraerDatos(msg) {
  const limpio = msg.replace(/\r/g, "");

  const safe = (value) => value?.trim?.().substring(0, 200) || "";

  const buscar = (re) => {
    const m = limpio.match(re);
    return safe(m ? m[1] : "");
  };

  return {
    origen: {
      nombre: buscar(/Nombre Origen\s*:\s*(.*)/i),
      calle: buscar(/Calle y Número Origen\s*:\s*(.*)/i),
      colonia: buscar(/Colonia Origen\s*:\s*(.*)/i),
      ciudad: buscar(/Ciudad y Estado Origen\s*:\s*(.*)/i),
      cp: buscar(/CP Origen\s*:\s*(\d{5})/i),
      cel: buscar(/Cel Origen\s*:\s*(\d{10})/i)
    },
    destino: {
      nombre: buscar(/Nombre Destino\s*:\s*(.*)/i),
      calle: buscar(/Calle y Número Destino\s*:\s*(.*)/i),
      colonia: buscar(/Colonia Destino\s*:\s*(.*)/i),
      ciudad: buscar(/Ciudad y Estado Destino\s*:\s*(.*)/i),
      cp: buscar(/CP Destino\s*:\s*(\d{5})/i),
      cel: buscar(/Cel Destino\s*:\s*(\d{10})/i)
    },
    paquete: {
      medidas: buscar(/Medidas\s*\(LxAxA\)\s*:\s*(.*)/i),
      peso: buscar(/Peso\s*\(kg\)\s*:\s*(.*)/i),
      contenido: buscar(/Contenido\s*:\s*(.*)/i)
    }
  };
}

module.exports = { procesarMensaje };