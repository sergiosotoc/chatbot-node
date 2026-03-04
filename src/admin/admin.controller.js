/* src/admin/admin.controller.js */
const { supabase } = require("../config/supabase");

async function getDashboard(req, res) {

  try {

    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const { count: totalHoy } = await supabase
      .from("pedidos")
      .select("*",{count:"exact",head:true})
      .gte("created_at",hoy.toISOString());

    const { count: pendientes } = await supabase
      .from("pedidos")
      .select("*",{count:"exact",head:true})
      .eq("estatus","pendiente");

    res.json({
      user:req.user,
      stats:{
        totalHoy:totalHoy||0,
        pendientes:pendientes||0
      },
      pedidos:pedidos||[],
      health:{
        status:"ok",
        uptime:process.uptime()
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:"Error cargando dashboard"
    });

  }

}

module.exports={getDashboard};