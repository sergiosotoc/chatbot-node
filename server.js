/* server.js */
require("dotenv").config();

const app = require("./src/app");
const { iniciarWatcher } = require("./src/services/estadoWatcher.service");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  iniciarWatcher();
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});