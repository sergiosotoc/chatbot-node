/* src/modules/auth/auth.controller.js */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { supabase } = require("../../config/supabase");

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });
    }

    const { data: user, error } = await supabase
      .from("operadores")
      .select("*")
      .eq("username", username)
      .eq("activo", true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.rol,
        username: user.username,
        nombre: user.nombre_completo,
        empresa_id: user.empresa_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.rol,
        empresa_id: user.empresa_id
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { login };