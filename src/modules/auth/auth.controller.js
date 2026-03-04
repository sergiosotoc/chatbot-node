/* src/modules/auth/auth.controller.js */

const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { supabase } = require("../../config/supabase")

async function login(req, res) {

    try {

        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                error: "Usuario y contraseña requeridos"
            })
        }

        const { data: user, error } = await supabase
            .from("operadores")
            .select("*")
            .eq("username", username)
            .single()

        if (error || !user) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            })
        }

        const valid = await bcrypt.compare(password, user.password_hash)

        if (!valid) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            })
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.rol,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        )

        res.json({ token })

    } catch (err) {

        console.error(err)

        res.status(500).json({
            error: "Error interno"
        })

    }

}

module.exports = { login }