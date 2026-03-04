/* src/controllers/config.controller.js */

function getConfig(req,res){

  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnon: process.env.SUPABASE_ANON_KEY
  })

}

module.exports={getConfig}