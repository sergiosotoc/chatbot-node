/* src/admin/admin.routes.js */

const router = require("express").Router();
const { verifyJWT, requireAdmin } = require("../auth/auth.middleware");
const { getDashboard } = require("./admin.controller");

router.use(verifyJWT);

router.get("/dashboard", requireAdmin, getDashboard);

module.exports = router;