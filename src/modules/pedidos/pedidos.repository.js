/* src/modules/pedidos/pedidos.repository.js */

const { supabase } = require("../../config/supabase");

async function guardarPedidoConfirmado(clienteId, d) {

  const folio = `PED-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      folio,
      cliente_id:        clienteId,    
      servicio:          d.servicio,
      precio:            d.costo,
      estatus:           "pendiente_pago",
      datos_envio: {
        origen:  d.origen,
        destino: d.destino,
        paquete: d.paquete
      }
    })
    .select()
    .single();

  if (error) {
    console.error("Error guardando pedido:", error.message);
    throw error;
  }

  return data.folio;
}

async function obtenerPedidosPorCliente(clienteId) {

  const { data, error } = await supabase
    .from("pedidos")
    .select("folio, estatus, servicio, precio, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error obteniendo pedidos:", error.message);
    return [];
  }

  return data || [];
}

module.exports = {
  guardarPedidoConfirmado,
  obtenerPedidosPorCliente
};