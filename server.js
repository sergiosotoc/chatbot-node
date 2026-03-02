/* server.js */

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const required = [
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_ID",
  "VERIFY_TOKEN",
  "SPREADSHEET_ID",
  "APP_SECRET"
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Variable de entorno ${key} es requerida pero no está definida`);
  }
});

const app = require("./src/app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});