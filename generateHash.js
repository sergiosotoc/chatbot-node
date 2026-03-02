const bcrypt = require("bcryptjs");

const password = "M@ster2026mx"; // aquí pones tu contraseña real
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log("Hash generado:", hash);
});
