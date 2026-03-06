/* src/admin/admin.routes.js */

const router = require("express").Router();

const {
  verifyJWT,
  requireAdmin,
  requireEmpresa,
  requireUsuario,
  requireEmpresaPanel
} = require("../modules/auth/auth.middleware");

const empresasAdmin = require("./empresas.controller");
const erroresAdmin = require("./errores.controller");

// Controladores â€” rutas exactas segÃºn tu estructura real
const adminCtrl  = require("./admin.controller");                         // src/admin/
const clientes   = require("./clientes.controller");                      // src/admin/
const tarifas    = require("./tarifas.controller");                       // src/admin/
const operadores = require("../modules/operadores.controller");            // src/modules/
const chats      = require("../modules/chats/chats.controller");           // src/modules/chats/
const empresa    = require("../modules/empresa/empresa.controller");       // src/modules/empresa/ â†’ getEmpresa, updateEmpresa
const pedidos    = require("../modules/pedidos/pedidos.controller");       // src/modules/pedidos/

router.use(verifyJWT);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DASHBOARD â€” solo admin
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/dashboard", requireAdmin, adminCtrl.getDashboard);
router.get("/empresas", requireAdmin, empresasAdmin.getEmpresasAdmin);
router.post("/empresas", requireAdmin, empresasAdmin.crearEmpresaAdmin);
router.put("/empresas/:id", requireAdmin, empresasAdmin.actualizarEmpresaAdmin);
router.post("/empresas/:id/bloquear", requireAdmin, empresasAdmin.bloquearEmpresaAdmin);
router.post("/empresas/:id/activar", requireAdmin, empresasAdmin.activarEmpresaAdmin);
router.delete("/empresas/:id", requireAdmin, empresasAdmin.eliminarEmpresaAdmin);
router.put("/empresas/:id/whatsapp", requireAdmin, empresasAdmin.configurarWhatsAppAdmin);
router.get("/errores", requireAdmin, erroresAdmin.getErrores);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CHATS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/conversaciones",   requireEmpresaPanel, chats.getConversaciones);
router.get("/conversacion/:id", requireEmpresaPanel, chats.getConversacion);
router.post("/responder",       requireEmpresaPanel, chats.responder);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PEDIDOS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/pedidos",          requireEmpresaPanel, pedidos.getPedidos);
router.post("/enviar-guia",     requireEmpresaPanel, pedidos.enviarGuia);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CLIENTES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/clientes",         requireEmpresaPanel, clientes.getClientes);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EMPRESA â€” configuraciÃ³n (empresa.controller)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/empresa",          requireEmpresaPanel, empresa.getEmpresa);
router.put("/empresa",          requireAdmin,   empresa.updateEmpresa);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// OPERADORES â€” solo admin
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/operadores",       requireAdmin,   operadores.getOperadores);
router.post("/operadores",      requireAdmin,   operadores.crearOperador);


// TARIFAS - solo admin
router.get("/tarifas",        requireAdmin, tarifas.getTarifas);
router.post("/tarifas",       requireAdmin, tarifas.crearTarifa);
router.put("/tarifas/:id",    requireAdmin, tarifas.actualizarTarifa);
router.delete("/tarifas/:id", requireAdmin, tarifas.eliminarTarifa);
module.exports = router;
