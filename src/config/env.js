/* src/config/env.js */
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_ID,
    verifyToken: process.env.VERIFY_TOKEN
  },
  google: {
    spreadsheetId: process.env.SPREADSHEET_ID
  }
};