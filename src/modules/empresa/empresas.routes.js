/* src/modules/empresa/empresas.routes.js */

const router = require("express").Router();
const { verifyJWT, requireAdmin, requireEmpresa } = require("../auth/auth.middleware");
const ctrl = require("./empresa.controller");

router.use(verifyJWT);

router.get("/",               requireAdmin,   ctrl.getEmpresas);
router.get("/:id",            requireAdmin,   ctrl.getEmpresa);
router.post("/",              requireAdmin,   ctrl.crearEmpresa);
router.put("/:id",            requireAdmin,   ctrl.actualizarEmpresa);
router.delete("/:id",         requireAdmin,   ctrl.eliminarEmpresa);

router.get("/:id/usuarios",                requireEmpresa, ctrl.getUsuariosDeEmpresa);
router.post("/:id/usuarios",               requireEmpresa, ctrl.crearUsuarioEnEmpresa);
router.put("/:id/usuarios/:usuario_id",    requireEmpresa, ctrl.actualizarUsuario);
router.delete("/:id/usuarios/:usuario_id", requireEmpresa, ctrl.eliminarUsuario);

module.exports = router;