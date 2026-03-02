/* src/config/google.js */
const { google } = require("googleapis");

function getSheetsClient() {

  if (!process.env.GOOGLE_CREDENTIALS_JSON) {
    throw new Error("GOOGLE_CREDENTIALS_JSON no está definido");
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

module.exports = { getSheetsClient };