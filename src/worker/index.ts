import { getSupabase } from "./supabase";

/**
 * v2.1.70 - BACKEND TOTAL (SOPORTE ADMIN + ESTUDIANTES)
 * - Añadido: Soporte para la ruta /admin/students (Alias de /students).
 * - Añadido: Soporte para /courses (Para que el panel de admin funcione).
 * - Corregido: Normalización de rutas para evitar errores 404 por prefijos.
 */

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get("Origin") || "*";

    // --- NORMALIZACIÓN DE RUTA ---
    let path = url.pathname.replace(/\/api\/?/, "/").trim();
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // 1. MANEJO DE CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      const sb = getSupabase(env);

      // --- PRUEBA DE CONEXIÓN ---
      if (path === "/debug/connection") {
        const { error } = await sb.from("students").select("id").limit(1);
        return jsonRes(200, { 
          status: error ? "Error de Llave" : "Conectado", 
          env_check: { url: !!env.SUPABASE_URL, key: !!env.SUPABASE_ANON_KEY }
        }, origin);
      }

      // 2. VALIDACIÓN DE USUARIO (TOKEN)
      const authHeader = request.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      let user = null;
      if (token && token !== "null") {
        const { data } = await sb.auth.getUser(token);
        user = data?.user;
      }

      // 3. RUTAS DE DATOS

      // --- ESTUDIANTES (Acepta /students y /admin/students) ---
      if (path === "/students" || path === "/admin/students") {
        if (method === "GET") {
          const { data, error } = await sb.from("students").select("*").order("last_name");
          if (error) throw error;
          return jsonRes(200, data || [], origin);
        }
        if (method === "POST") {
          const body = await request.json();
          // Upsert maneja tanto creación como actualización
          const { data, error } = await sb.from("students").upsert(body).select();
          if (error) throw error;
          return jsonRes(200, { message: "Proceso exitoso", count: data?.length }, origin);
        }
      }

      // --- CURSOS (Grados) ---
      if (path === "/courses") {
        const { data, error } = await sb.from("courses").select("*").order("name");
        if (error) throw error;
        return jsonRes(200, data || [], origin);
      }

      // --- PERFIL ---
      if (path === "/teachers/profile") {
        if (!user) return jsonRes(200, { name: "Invitado" }, origin);
        const { data } = await sb.from("teachers").select("*").eq("email", user.email).single();
        return jsonRes(200, data || { name: user.email }, origin);
      }

      // --- CLASES Y ASISTENCIA ---
      if (path === "/teachers/today-classes") {
        const { data, error } = await sb.from("vw_teacher_schedules").select("*");
        if (error) throw error;
        return jsonRes(200, data || [], origin);
      }

      if (path === "/attendance/details") {
        const schedule_id = url.searchParams.get("schedule_id");
        const { data: subject } = await sb.from("vw_teacher_schedules").select("*").eq("schedule_id", schedule_id).single();
        const { data: students } = await sb.from("students").select("*").eq("course_id", subject?.course_id).order("last_name");
        return jsonRes(200, { subject, students: students || [] }, origin);
      }

      if (path === "/attendance/save" && method === "POST") {
        const body: any = await request.json();
        const payload = body.records.map((r: any) => ({
          student_id: r.student_id,
          course_id: body.course_id,
          subject_id: body.subject_id,
          date: body.date,
          status: r.status
        }));
        const { data, error } = await sb.from("attendance").insert(payload).select();
        if (error) throw error;
        return jsonRes(200, data, origin);
      }

      return jsonRes(404, { error: "Ruta no encontrada", path_recibido: path, version: "v2.1.70" }, origin);

    } catch (err: any) {
      return jsonRes(500, { error: "Falla en el Worker", details: err.message }, origin);
    }
  }
};

function jsonRes(status: number, data: any, origin: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true"
    }
  });
}