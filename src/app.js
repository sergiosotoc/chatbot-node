/* src/app.js */
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const routes = require("./routes/webhook.routes");
const authRoutes = require("./auth/auth.routes");
const adminRoutes = require("./admin/admin.routes");
const { admin } = require("googleapis/build/src/apis/admin");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        "font-src": ["'self'", "https://cdnjs.cloudflare.com"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
      },
    },
  })
);

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || false
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
}));

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use("/", routes);

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use(express.static("public"));

module.exports = app;