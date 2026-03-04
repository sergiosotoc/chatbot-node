/* src/admin/admin.routes.js */

const router = require("express").Router()

const { verifyJWT, requireAdmin } = require("../modules/auth/auth.middleware")

const dashboard = require("./dashboard.controller")
const chats = require("../modules/chats/chats.controller")
const pedidos = require("../modules/pedidos/pedidos.controller")
const empresa = require("../modules/empresa/empresa.controller")
const operadores = require("../modules/operadores.controller")

// todas las rutas admin requieren login
router.use(verifyJWT)


// ----------------------
// DASHBOARD
// ----------------------

router.get("/dashboard", requireAdmin, dashboard.getDashboard)


// ----------------------
// CHATS
// ----------------------

router.get("/conversaciones", requireAdmin, chats.getConversaciones)

router.get("/conversacion/:id", requireAdmin, chats.getConversacion)

router.post("/responder", requireAdmin, chats.responder)


// ----------------------
// PEDIDOS
// ----------------------

router.get("/pedidos", requireAdmin, pedidos.getPedidos)

router.post("/enviar-guia", requireAdmin, pedidos.enviarGuia)


// ----------------------
// EMPRESA
// ----------------------

router.get("/empresa", requireAdmin, empresa.getEmpresa)

router.put("/empresa", requireAdmin, empresa.updateEmpresa)


// ----------------------
// OPERADORES
// ----------------------

router.get("/operadores", requireAdmin, operadores.getOperadores)

router.post("/operadores", requireAdmin, operadores.crearOperador)


module.exports = router