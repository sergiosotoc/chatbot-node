/* src/webhook.routes.js */
const router = require("express").Router();
const { handleWebhook } = require("../controllers/webhook.controller");
const { whatsapp } = require("../config/env");

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === whatsapp.verifyToken) {
    console.log("Webhook verificado correctamente");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

router.post("/webhook", handleWebhook);

module.exports = router;