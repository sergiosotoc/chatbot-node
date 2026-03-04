/* src/admin/empresa.controller.js */

const { supabase } = require("../../config/supabase")

async function getEmpresa(req, res) {

    const { data } = await supabase
        .from("empresas")
        .select("*")
        .limit(1)
        .single()

    res.json(data)

}

async function updateEmpresa(req, res) {

    const {
        nombre,
        telefono_whatsapp,
        numero_operador,
        banco,
        cuenta,
        clabe,
        titular
    } = req.body

    await supabase
        .from("empresas")
        .update({
            nombre,
            telefono_whatsapp,
            numero_operador,
            banco,
            cuenta,
            clabe,
            titular
        })
        .eq("id", req.body.id)

    res.json({ success: true })

}

module.exports = {
    getEmpresa,
    updateEmpresa
}