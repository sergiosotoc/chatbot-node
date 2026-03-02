/* src/webhook.routes.js */
const router = require("express").Router();
const crypto = require("crypto");
const { handleWebhook } = require("../controllers/webhook.controller");

function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) return false;

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.APP_SECRET)
      .update(req.rawBody)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

router.post("/webhook", (req, res) => {
  if (!verifySignature(req)) {
    return res.sendStatus(403);
  }

  handleWebhook(req, res);
});

module.exports = router;