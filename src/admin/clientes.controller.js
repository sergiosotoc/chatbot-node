/* src/admin/clientes.controller.js */

const { supabase } = require("../config/supabase");

async function getClientes(req,res){

  const {data,error}=await supabase
  .from("clientes_whatsapp")
  .select("*")
  .order("created_at",{ascending:false});

  if(error){
    return res.status(500).json(error);
  }

  res.json(data);

}

module.exports={getClientes};