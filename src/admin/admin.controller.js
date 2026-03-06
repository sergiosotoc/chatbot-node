/* src/admin/admin.controller.js
 * Panel Admin: solo empresas activas, count usuarios, métricas mensajes, errores, notificaciones.
 * NO pedidos, NO mensajes/contenido, NO datos empleados, NO datos bancarios.
 */
const { supabase } = require("../config/supabase");
const {
  getErroresRecientes,
  getErroresDesdeBD,
} = require("../services/error-logger.service");

function getRangoFechas(periodo) {
  const ahora = new Date();
  const fin = new Date(ahora);
  let inicio = new Date(ahora);

  switch (periodo) {
    case "dia":
      inicio.setHours(0, 0, 0, 0);
      break;
    case "semana":
      inicio.setDate(inicio.getDate() - 7);
      break;
    case "mes":
      inicio.setMonth(inicio.getMonth() - 1);
      break;
    case "anio":
      inicio.setFullYear(inicio.getFullYear() - 1);
      break;
    default:
      inicio.setHours(0, 0, 0, 0);
  }
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

async function getDashboard(req, res) {
  try {
    // Empresas activas (solo activas)
    const { count: countActivas } = await supabase
      .from("empresas")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    const { count: totalEmpresas } = await supabase
      .from("empresas")
      .select("*", { count: "exact", head: true });

    // Empresas con count de usuarios (sin datos de empleados)
    const { data: empresasConUsuarios } = await supabase
      .from("empresas")
      .select("id, nombre, correo, telefono_whatsapp, activo, created_at, whatsapp_phone_id")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const counts = [];
    if (empresasConUsuarios?.length) {
      for (const e of empresasConUsuarios) {
        const { count } = await supabase
          .from("operadores")
          .select("*", { count: "exact", head: true })
          .eq("empresa_id", e.id);
        counts.push({ empresa_id: e.id, count_usuarios: count ?? 0 });
      }
    }
    const mapCounts = counts.reduce((a, c) => ({ ...a, [c.empresa_id]: c.count_usuarios }), {});
    const empresas = (empresasConUsuarios || []).map((e) => ({
      ...e,
      count_usuarios: mapCounts[e.id] ?? 0,
    }));

    // Métricas de mensajes: día, semana, mes, año (vía clientes_whatsapp -> mensajes)
    const mensajesPorPeriodo = {};
    for (const p of ["dia", "semana", "mes", "anio"]) {
      const { inicio, fin } = getRangoFechas(p);
      const { data: mensajes } = await supabase
        .from("mensajes")
        .select("id")
        .gte("created_at", inicio)
        .lte("created_at", fin);
      mensajesPorPeriodo[p] = (mensajes || []).length;
    }

    // Métricas de mensajes POR EMPRESA (solo count)
    const mensajesPorEmpresa = [];
    for (const e of empresasConUsuarios || []) {
      const { data: clientes } = await supabase
        .from("clientes_whatsapp")
        .select("id")
        .eq("empresa_id", e.id);
      const clienteIds = (clientes || []).map((c) => c.id);
      if (clienteIds.length === 0) {
        mensajesPorEmpresa.push({
          empresa_id: e.id,
          empresa_nombre: e.nombre,
          mensajes_dia: 0,
          mensajes_semana: 0,
          mensajes_mes: 0,
          mensajes_anio: 0,
        });
        continue;
      }
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const sem = new Date(hoy);
      sem.setDate(sem.getDate() - 7);
      const mes = new Date(hoy);
      mes.setMonth(mes.getMonth() - 1);
      const anio = new Date(hoy);
      anio.setFullYear(anio.getFullYear() - 1);

      const [rDia, rSem, rMes, rAnio] = await Promise.all([
        supabase.from("mensajes").select("id", { count: "exact", head: true }).in("cliente_id", clienteIds).gte("created_at", hoy.toISOString()),
        supabase.from("mensajes").select("id", { count: "exact", head: true }).in("cliente_id", clienteIds).gte("created_at", sem.toISOString()),
        supabase.from("mensajes").select("id", { count: "exact", head: true }).in("cliente_id", clienteIds).gte("created_at", mes.toISOString()),
        supabase.from("mensajes").select("id", { count: "exact", head: true }).in("cliente_id", clienteIds).gte("created_at", anio.toISOString()),
      ]);

      mensajesPorEmpresa.push({
        empresa_id: e.id,
        empresa_nombre: e.nombre,
        mensajes_dia: rDia.count ?? 0,
        mensajes_semana: rSem.count ?? 0,
        mensajes_mes: rMes.count ?? 0,
        mensajes_anio: rAnio.count ?? 0,
      });
    }

    // Errores del sistema (para soporte)
    let errores = getErroresRecientes();
    try {
      const desdeBD = await getErroresDesdeBD(20);
      if (desdeBD.length > 0) {
        errores = [...desdeBD.map((r) => ({ ...r, created_at: r.created_at })), ...errores.filter((e) => !desdeBD.find((b) => b.id === e.id))].slice(0, 30);
      }
    } catch (_) {}

    // Estado de servicios y notificaciones
    let whatsappStatus = false;
    try {
      whatsappStatus = !!process.env.WHATSAPP_TOKEN || false;
    } catch (_) {}
    const supabaseStatus = true; // asumimos OK si llegamos aquí
    const notificaciones = [];
    if (!whatsappStatus) {
      notificaciones.push({
        tipo: "warning",
        titulo: "WhatsApp API",
        mensaje: "Token global no configurado. Las empresas deben configurar su propio token.",
      });
    }
    const empresasSinWhatsApp = (empresasConUsuarios || []).filter(
      (e) => e.activo && !e.whatsapp_phone_id
    );
    if (empresasSinWhatsApp.length > 0) {
      notificaciones.push({
        tipo: "info",
        titulo: "Configuración WhatsApp",
        mensaje: `${empresasSinWhatsApp.length} empresa(s) activa(s) sin WhatsApp configurado`,
      });
    }
    if (errores.length > 0) {
      notificaciones.push({
        tipo: errores.some((e) => e.nivel === "critical") ? "error" : "warning",
        titulo: "Errores recientes",
        mensaje: `Hay ${errores.length} error(es) registrados. Revisar sección de soporte.`,
      });
    }

    res.json({
      user: req.user,
      stats: {
        empresas_activas: countActivas ?? empresasConUsuarios?.length ?? 0,
        total_empresas: totalEmpresas ?? 0,
        mensajes_dia: mensajesPorPeriodo.dia,
        mensajes_semana: mensajesPorPeriodo.semana,
        mensajes_mes: mensajesPorPeriodo.mes,
        mensajes_anio: mensajesPorPeriodo.anio,
      },
      empresas,
      mensajes_por_empresa: mensajesPorEmpresa,
      errores: errores.slice(0, 15),
      notificaciones,
      servicios: {
        whatsapp: whatsappStatus,
        supabase: supabaseStatus,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    console.error(error);
    const { registrarError } = require("../services/error-logger.service");
    await registrarError({
      nivel: "error",
      codigo: "DASHBOARD_ADMIN",
      mensaje: "Error cargando dashboard admin",
      detalle: error.message,
      contexto: { stack: error.stack },
    });
    res.status(500).json({ error: "Error cargando dashboard" });
  }
}

module.exports = { getDashboard };
