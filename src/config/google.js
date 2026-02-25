/* src/config/google.js */
const { google } = require("googleapis");
const fs = require("fs");

function getSheetsClient() {

  let credentials;

  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    credentials = JSON.parse(fs.readFileSync("./credentials.json", "utf8"));
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

module.exports = { getSheetsClient };