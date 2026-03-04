/* src/admin/operadores.controller.js */

const { supabase } = require("../config/supabase")
const bcrypt = require("bcryptjs")

async function getOperadores(req, res) {

    const { data } = await supabase
        .from("operadores")
        .select("*")

    res.json(data)

}

async function crearOperador(req, res) {

    const { username, password, rol } = req.body

    const hash = await bcrypt.hash(password, 10)

    await supabase.from("operadores").insert({
        username,
        password_hash: hash,
        rol
    })

    res.json({ success: true })

}

module.exports = {
    getOperadores,
    crearOperador
}