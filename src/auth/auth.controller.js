/* src/auth/auth.controller.js */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Usuario y contraseña son requeridos"
            });
        }

        if (username !== process.env.ADMIN_USER) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        const valid = await bcrypt.compare(
            password,
            process.env.ADMIN_PASS_HASH
        );

        if (!valid) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            { username, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || "8h" }
        );

        return res.json({ token });

    } catch (err) {
        console.error("Error en login:", err.message);
        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
}

module.exports = { login };