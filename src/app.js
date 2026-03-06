/* src/app.js */

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const webhookRoutes  = require("./routes/webhook.routes");
const adminRoutes    = require("./admin/admin.routes");
const authRoutes     = require("./modules/auth/auth.routes");
const empresasRoutes = require("./modules/empresa/empresas.routes");
const { getConfig }  = require("./controllers/config.controller");

const app = express();

function guardarRawBody(req, res, buf) {
  if (buf?.length) {
    req.rawBody = buf;
  }
}

app.set("trust proxy", 1);

app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      // En desarrollo local (http://localhost), evitar que el navegador
      // convierta automáticamente requests a https.
      upgradeInsecureRequests: null,
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],   // ← permite onclick en HTML
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com"
      ],
      fontSrc:    ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://cdn.jsdelivr.net"
      ]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: "10mb", verify: guardarRawBody }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/config", getConfig);
app.use("/",         webhookRoutes);
app.use("/auth",     authRoutes);
app.use("/admin",    adminRoutes);
app.use("/empresas", empresasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  try {
    const { registrarError } = require("./services/error-logger.service");
    registrarError({
      nivel: "error",
      codigo: "EXPRESS_ERROR",
      mensaje: err.message || "Error interno",
      detalle: err.stack,
      contexto: { path: req.path, method: req.method },
    }).catch(() => {});
  } catch (_) {}
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
