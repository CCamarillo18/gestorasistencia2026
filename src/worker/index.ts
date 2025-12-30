import { getSupabase } from "./supabase";

// --- UTILIDADES ---
async function withCORS(env, req, handler) {
  const origin = req.headers.get("Origin") || "*";
  
  // 1. Manejo inmediato de OPTIONS (Pre-vuelo) para evitar bloqueo de navegador
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // 2. Ejecutar la lógica normal
  const res = await handler(env, req);
  
  // 3. Inyectar cabeceras en la respuesta final
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Credentials", "true");
  
  return new Response(res.body, { status: res.status, headers: h });
}

const json = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
});

// --- AUTENTICACIÓN ---
async function getUser(env, req) {
  const auth = req.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const sb = getSupabase(env);
  try {
    const { data: { user }, error } = await sb.auth.getUser(token);
    return error || !user ? null : user;
  } catch (e) {
    return null;
  }
}

// --- ROUTER PRINCIPAL ---
async function handleRequest(env, req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/api\/?/, "/");
  const method = req.method;
  const sb = getSupabase(env);

  // RUTAS PÚBLICAS O DE TEST (Opcional)
  if (path === "/test") return json(200, { ok: true });

  const user = await getUser(env, req);
  if (!user) return json(401, { error: "Usuario no autenticado" });

  // --- TEACHERS ---
  if (path === "/admin/teachers") {
    if (method === "GET") {
      const { data } = await sb.from("teachers").select("*").order("nombre");
      return json(200, (data || []).map(t => ({ ...t, nombre: t.nombre ?? t.name ?? "Sin nombre", roles: Array.isArray(t.roles) ? t.roles : [] })));
    }
    if (method === "POST") {
      const body = await req.json();
      const { nombre, email } = body;
      if (!nombre || !email) return json(400, { success: false, error: "Datos inválidos" });
      const { data, error } = await sb.from("teachers").insert({ nombre, email, roles: JSON.stringify(["Prof."]), tutorDe: "NO", cargaAcademica: {} }).select("id");
      return error ? json(500, { success: false, error: String(error) }) : json(200, { success: true, id: data[0]?.id });
    }
  }

  // --- SUBJECTS ---
  if (path === "/admin/subjects") {
    if (method === "GET") {
      const { data } = await sb.from("subjects").select("id, name, course_id, teacher_id").order("name");
      return json(200, data || []);
    }
  }

  // --- CONFIG STORE SAVE ---
  if (path === "/admin/config-store/save" && method === "POST") {
    try {
      const body = await req.json();
      const settings = body?.settings || {};
      const rows = Array.isArray(body?.subject_hours) ? body.subject_hours : (Array.isArray(body?.subjects) ? body.subjects : []);
      const year = parseInt(settings.active_year);
      const terms = parseInt(settings.terms_count);

      if (!isNaN(year) && year > 0 && !isNaN(terms) && terms > 0) {
        const { data: existing } = await sb.from("academic_settings").select("id").limit(1);
        if ((existing || []).length === 0) {
          await sb.from("academic_settings").insert({ active_year: year, terms_count: terms });
        } else {
          await sb.from("academic_settings").update({ active_year: year, terms_count: terms }).eq("id", existing[0].id);
        }
      }

      const list = Array.isArray(rows) ? rows : [];
      const gradeRows = list.filter(r => r && r.grade != null);
      const simpleRows = list.filter(r => r && r.grade == null);
      let savedConfig = 0, savedGradeHours = 0;

      if (simpleRows.length > 0) {
        const normalized = simpleRows.filter(r => r.name || r.subject).map(r => ({ name: String(r.name || r.subject), area: r.area ? String(r.area) : null, hours: r.hours != null ? parseInt(r.hours) : null }));
        const { data } = await sb.from("subject_config").upsert(normalized, { onConflict: "name" }).select("name");
        savedConfig = data?.length || 0;
      }

      if (gradeRows.length > 0) {
        const normalized = gradeRows.filter(r => (r.subject || r.name) && r.grade != null).map(r => ({ subject: String(r.subject || r.name), grade: parseInt(r.grade), hours: parseInt(r.hours) }));
        const { data } = await sb.from("subject_grade_hours").upsert(normalized, { onConflict: "subject,grade" }).select("subject");
        savedGradeHours = data?.length || 0;
      }
      return json(200, { success: true, saved_subject_config: savedConfig, saved_subject_hours: savedGradeHours });
    } catch (e) { return json(500, { success: false, error: e.message }); }
  }

  // --- ASISTENCIA V2 ---
  if (path === "/attendance/v2" && method === "POST") {
    const body = await req.json();
    const { subject_id, course_id, date, records } = body;
    if (!subject_id || !course_id || !date || !records?.length) return json(400, { success: false, error: "Datos inválidos" });
    const payload = records.filter(r => r.student_id && r.status).map(r => ({ student_id: parseInt(r.student_id), course_id, subject_id, date, status: String(r.status), observations: r.observations || null, hours_count: parseInt(body.hours_count) || 1 }));
    let { data, error } = await sb.from("attendance").insert(payload).select("student_id");
    if (error) { const alt = await sb.from("attendances").insert(payload).select("student_id"); data = alt.data; error = alt.error; }
    return error ? json(500, { success: false, error: error.message }) : json(200, { success: true, inserted: data?.length });
  }

  // --- REPORTES DIARIOS ---
  if (path === "/reports/daily" && method === "GET") {
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    let { data } = await sb.from("attendance").select("student_id,subject_id,status,course_id").eq("date", date);
    if (!data?.length) { const alt = await sb.from("attendances").select("student_id,subject_id,status,course_id").eq("date", date); data = alt.data; }
    if (!data?.length) return json(200, []);
    return json(200, { message: "Reporte generado", count: data.length });
  }

  // --- AGREGAR ESTA RUTA PARA CARGAR EL HISTORIAL Y SETTINGS ---
  if (path === "/admin/settings" && method === "GET") {
    const { data } = await sb.from("academic_settings").select("*").limit(1);
    return json(200, data?.[0] || {});
  }
  
  if (path === "/admin/subject-hours" && method === "GET") {
    const { data } = await sb.from("subject_grade_hours").select("*");
    return json(200, data || []);
  }

  if (path === "/admin/courses" && method === "GET") {
    const { data } = await sb.from("courses").select("*");
    return json(200, data || []);
  }

  return json(404, { error: "Ruta no encontrada" });
}

addEventListener("fetch", event => {
  event.respondWith(withCORS(event.env, event.request, (env, req) => handleRequest(env, req)));
});

// BORRA el addEventListener y pon esto en su lugar:

export default {
  async fetch(request, env) {
    // Usamos withCORS directamente pasando el 'env' (donde están tus claves de Supabase)
    return withCORS(env, request, (env, req) => handleRequest(env, req));
  }
};