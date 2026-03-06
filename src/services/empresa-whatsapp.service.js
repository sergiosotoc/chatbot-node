/* src/services/empresa-whatsapp.service.js
 * Obtiene credenciales de WhatsApp por empresa desde la BD.
 */
const { supabase } = require("../config/supabase");

/**
 * Obtiene las credenciales de WhatsApp de una empresa.
 * @param {string} empresaId - UUID de la empresa
 * @returns {{ phoneId: string|null, token: string|null } | null}
 */
async function obtenerCredencialesWhatsApp(empresaId) {
  if (!empresaId) return null;
  const { data, error } = await supabase
    .from("empresas")
    .select("whatsapp_phone_id, whatsapp_token_encrypted")
    .eq("id", empresaId)
    .eq("activo", true)
    .single();
  if (error || !data) return null;
  const phoneId = data.whatsapp_phone_id || null;
  const token = data.whatsapp_token_encrypted || null;
  if (!phoneId || !token) return null;
  return { phoneId, token };
}

/**
 * Verifica si una empresa tiene WhatsApp configurado.
 */
async function tieneWhatsAppConfigurado(empresaId) {
  const creds = await obtenerCredencialesWhatsApp(empresaId);
  return !!(creds?.phoneId && creds?.token);
}

module.exports = {
  obtenerCredencialesWhatsApp,
  tieneWhatsAppConfigurado,
};
