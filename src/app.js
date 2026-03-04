/* src/app.js */

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")

const webhookRoutes = require("./routes/webhook.routes")
const adminRoutes = require("./admin/admin.routes")
const authRoutes = require("./modules/auth/auth.routes")
const { getConfig } = require("./controllers/config.controller")

const app = express()


app.set("trust proxy", 1)

const rateLimit = require("express-rate-limit")

app.use(rateLimit({
 windowMs: 60 * 1000,
 max: 100
}))

// -----------------------------
// SEGURIDAD (HELMET)
// -----------------------------

app.use(
helmet({
contentSecurityPolicy: {
directives: {

defaultSrc: ["'self'"],

// scripts permitidos
scriptSrc: [
"'self'",
"'unsafe-inline'",
"https://cdn.tailwindcss.com",
"https://cdn.jsdelivr.net"
],

// estilos
styleSrc: [
"'self'",
"'unsafe-inline'",
"https://cdn.jsdelivr.net",
"https://fonts.googleapis.com"
],

// fuentes
fontSrc: [
"'self'",
"https://fonts.gstatic.com",
"data:"
],

// imágenes
imgSrc: [
"'self'",
"data:",
"https:"
],

// conexiones externas
connectSrc: [
"'self'",
"https://*.supabase.co",
"wss://*.supabase.co" // realtime websockets
]

}
}
})
)


// -----------------------------
// MIDDLEWARES
// -----------------------------

app.use(cors())

app.use(express.json({ limit: "10mb" }))

app.use(express.urlencoded({ extended: true }))


// -----------------------------
// RUTAS API
// -----------------------------

app.use("/", webhookRoutes)

app.use("/auth", authRoutes)

app.use("/admin", adminRoutes)


// -----------------------------
// ARCHIVOS ESTÁTICOS
// -----------------------------

app.use(express.static("public"))


// -----------------------------
// MANEJO DE RUTAS NO EXISTENTES
// -----------------------------

app.use((req,res)=>{
res.status(404).json({
error:"Ruta no encontrada"
})
})


// -----------------------------
// MANEJO DE ERRORES GLOBAL
// -----------------------------

app.use((err,req,res,next)=>{
console.error("Error:",err)

res.status(500).json({
error:"Error interno del servidor"
})
})

app.get("/config", getConfig)


module.exports = app