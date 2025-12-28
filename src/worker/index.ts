import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { getSupabase, getSupabaseSchema } from "./supabase";
import { SubmitAttendanceSchema, ManualAttendanceSchema, type AttendanceReport, type Student, type DailyAbsence } from "@/shared/types";

type SupaUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

const app = new Hono<{ Bindings: Env; Variables: { user: SupaUser } }>();
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

const supabaseAuth: MiddlewareHandler<{ Bindings: Env; Variables: { user: SupaUser } }> = async (c, next) => {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return c.json({ error: "Usuario no autenticado" }, 401);
  const sb = getSupabase(c.env);
  const res = await sb.auth.getUser(token);
  if (res.error || !res.data.user) return c.json({ error: "Usuario no autenticado" }, 401);
  c.set("user", res.data.user);
  await next();
}

async function ensureAdminOrCoord(c: any) {
  const user = c.get("user");
  const sb = getSupabase(c.env);
  // Buscar por user_id o por email para compatibilidad con esquemas existentes
  let { data: me } = await sb.from("teachers").select("*").eq("user_id", user.id).maybeSingle();
  if (!me && user.email) {
    const { data: byEmail } = await sb.from("teachers").select("*").eq("email", user.email).maybeSingle();
    me = byEmail || null;
  }
  let roles: string[] = [];
  if (me?.roles) {
    roles = Array.isArray(me.roles) ? (me.roles as any) : typeof me.roles === "string" ? (() => { try { return JSON.parse(me.roles as any); } catch { return []; } })() : [];
  }
  const ok =
    roles.includes("Admin.") ||
    roles.includes("Coord.") ||
    roles.includes("Administrativo") ||
    roles.includes("Administrador");
  return ok;
}

// ==================== Autenticación ====================

// Auth endpoints eliminados al migrar a Supabase Auth

// ==================== Perfil de Profesor ====================

app.get("/api/teachers/profile", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: found } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  let teacher = found;
  if (!teacher) {
    const name =
      (user.user_metadata?.name as string | undefined) ||
      (user.email ? user.email.split("@")[0] : "Profesor");
    try {
      const { data: inserted } = await sb
        .from("teachers")
        .insert({ name, user_id: user.id, email: user.email })
        .select("*")
        .single();
      teacher = inserted;
    } catch {
      const now = new Date().toISOString();
      teacher = {
        id: -1,
        name,
        user_id: user.id,
        email: user.email || "",
        tutor_course_id: null,
        created_at: now,
        updated_at: now,
        roles: ["Administrador"],
      } as any;
    }
  }
  return c.json(teacher as any);
});

// ==================== Clases de Hoy ====================

app.get("/api/teachers/today-classes", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json([]);
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;

  const { data: subjects } = await sb
    .from("subjects")
    .select("id, name, hours_per_week, course_id")
    .eq("teacher_id", (teacher as any).id);
  const subjectIds = (subjects || []).map((s) => s.id);
  if (subjectIds.length === 0) return c.json([]);
  const { data: schedules } = await sb
    .from("schedules")
    .select("id, subject_id, start_time, end_time, day_of_week")
    .eq("day_of_week", dayOfWeek)
    .in("subject_id", subjectIds);
  const courseIds = Array.from(new Set((subjects || []).map((s) => s.course_id)));
  const { data: courses } = await sb
    .from("courses")
    .select("id, name")
    .in("id", courseIds);
  const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));
  const subjectMap = new Map(
    (subjects || []).map((s) => [s.id, { name: s.name, hours_per_week: s.hours_per_week, course_id: s.course_id }])
  );
  const results = (schedules || [])
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
    .map((sch: any) => {
      const subj = subjectMap.get(sch.subject_id);
      const courseName = subj ? courseMap.get(subj.course_id) : null;
      return {
        schedule_id: sch.id,
        subject_id: sch.subject_id,
        subject_name: subj?.name,
        hours_per_week: subj?.hours_per_week,
        course_id: subj?.course_id,
        course_name: courseName,
        start_time: sch.start_time,
        end_time: sch.end_time,
        day_of_week: sch.day_of_week,
      };
    });
  return c.json(results);
});

// ==================== Asignaturas del Profesor ====================

app.get("/api/teachers/subjects", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json([]);
  const { data: subjects } = await sb
    .from("subjects")
    .select("*, course_id")
    .eq("teacher_id", (teacher as any).id)
    .order("name", { ascending: true });
  const courseIds = Array.from(new Set((subjects || []).map((s) => s.course_id)));
  const { data: courses } = await sb.from("courses").select("*").in("id", courseIds);
  const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));
  const results = (subjects || []).map((s: any) => ({ ...s, course_name: courseMap.get(s.course_id) }));
  return c.json(results);
});

// ==================== Todas las Asignaturas ====================

app.get("/api/subjects/all", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: subjects } = await sb.from("subjects").select("*").order("name", { ascending: true });
  const courseIds = Array.from(new Set((subjects || []).map((s) => s.course_id)));
  const { data: courses } = await sb.from("courses").select("id,name").in("id", courseIds);
  const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));
  const results = (subjects || []).map((s: any) => ({ ...s, course_name: courseMap.get(s.course_id) }));
  return c.json(results);
});

// ==================== Alertas de Deserción por Curso ====================

app.get("/api/students/alerts", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const courseId = parseInt(c.req.query("course_id") || "");
  if (!courseId || Number.isNaN(courseId)) return c.json([]);
  const sb = getSupabase(c.env);
  const { data: subjects } = await sb.from("subjects").select("id").eq("course_id", courseId);
  const subjectIds = (subjects || []).map((s: any) => s.id);
  if (subjectIds.length === 0) return c.json([]);
  const { data: records } = await sb
    .from("attendance_records")
    .select("id, attendance_date, subject_id")
    .in("subject_id", subjectIds)
    .order("attendance_date", { ascending: false });
  const recIds = (records || []).map((r: any) => r.id);
  if (recIds.length === 0) return c.json([]);
  const { data: absent } = await sb.from("absent_students").select("attendance_record_id, student_id").in("attendance_record_id", recIds);
  const byStudent = new Map<number, Array<{ date: string; absent: boolean }>>();
  for (const r of records || []) {
    const date = (r as any).attendance_date;
    const aIds = new Set(
      (absent || [])
        .filter((a: any) => a.attendance_record_id === (r as any).id)
        .map((a: any) => a.student_id)
    );
    for (const sid of Array.from(aIds)) {
      const arr = byStudent.get(sid) || [];
      arr.push({ date, absent: true });
      byStudent.set(sid, arr);
    }
  }
  const alerts: Array<{ student_id: number; consecutive_absences: number }> = [];
  for (const [sid, arr] of byStudent.entries()) {
    const sorted = arr.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    let consec = 0;
    for (const e of sorted) {
      if (e.absent) consec++;
      else break;
    }
    alerts.push({ student_id: sid, consecutive_absences: consec });
  }
  return c.json(alerts);
});

// ==================== Resumen de asistencia por curso ====================

app.get("/api/students/attendance-summary", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const courseId = parseInt(c.req.query("course_id") || "");
  if (!courseId || Number.isNaN(courseId)) return c.json([]);
  const sb = getSupabase(c.env);
  const { data: students } = await sb.from("students").select("id").eq("course_id", courseId);
  const { data: subjects } = await sb.from("subjects").select("id").eq("course_id", courseId);
  const subjectIds = (subjects || []).map((s: any) => s.id);
  if (subjectIds.length === 0) return c.json([]);
  const { data: records } = await sb
    .from("attendance_records")
    .select("id, subject_id")
    .in("subject_id", subjectIds);
  const recIds = (records || []).map((r: any) => r.id);
  const sessions = recIds.length;
  if (sessions === 0) {
    return c.json((students || []).map((s: any) => ({ student_id: s.id, sessions: 0, absences: 0, percentage: 0 })));
  }
  const { data: absent } = await sb.from("absent_students").select("attendance_record_id, student_id").in("attendance_record_id", recIds);
  const absByStudent = new Map<number, number>();
  for (const a of absent || []) {
    const sid = (a as any).student_id as number;
    absByStudent.set(sid, (absByStudent.get(sid) || 0) + 1);
  }
  const results = (students || []).map((s: any) => {
    const abs = absByStudent.get(s.id) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(((sessions - abs) / sessions) * 100)));
    return { student_id: s.id, sessions, absences: abs, percentage: pct };
  });
  return c.json(results);
});

// ==================== Estudiantes de una Clase ====================

app.get("/api/classes/:scheduleId/students", supabaseAuth, async (c) => {
  const scheduleId = parseInt(c.req.param("scheduleId"));
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json({ error: "Perfil de profesor no encontrado" }, 403);
  const { data: schedule } = await sb
    .from("schedules")
    .select("subject_id")
    .eq("id", scheduleId)
    .maybeSingle();
  if (!schedule) return c.json({ error: "Clase no encontrada" }, 404);
  const { data: subject } = await sb
    .from("subjects")
    .select("*")
    .eq("id", (schedule as any).subject_id)
    .maybeSingle();
  if (!subject) return c.json({ error: "Asignatura no encontrada" }, 404);
  if ((subject as any).teacher_id !== (teacher as any).id) {
    return c.json({ error: "No tienes acceso a esta clase" }, 403);
  }
  const { data: students } = await sb
    .from("students")
    .select("*")
    .eq("course_id", (subject as any).course_id)
    .order("name", { ascending: true });
  return c.json(students || []);
});

// ==================== Todos los Estudiantes ====================

app.get("/api/students/all", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data } = await sb.from("students").select("*").order("name", { ascending: true });
  return c.json(data || []);
});

// ==================== Estudiantes de una Asignatura ====================

app.get("/api/subjects/:subjectId/students", supabaseAuth, async (c) => {
  const subjectId = parseInt(c.req.param("subjectId"));
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json({ error: "Perfil de profesor no encontrado" }, 403);
  const { data: subject } = await sb
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .eq("teacher_id", (teacher as any).id)
    .maybeSingle();
  if (!subject) {
    return c.json({ error: "No tienes acceso a esta asignatura" }, 403);
  }
  const { data: students } = await sb
    .from("students")
    .select("*")
    .eq("course_id", (subject as any).course_id)
    .order("name", { ascending: true });
  return c.json(students || []);
});

// ==================== Registrar Asistencia ====================

app.post("/api/attendance", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const body = await c.req.json();

  // Validar datos
  const validatedData = SubmitAttendanceSchema.parse(body);

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json({ error: "Perfil de profesor no encontrado" }, 403);
  const { data: subject } = await sb
    .from("subjects")
    .select("id")
    .eq("id", validatedData.subject_id)
    .eq("teacher_id", (teacher as any).id)
    .maybeSingle();
  if (!subject) {
    return c.json({ error: "No tienes acceso a esta asignatura" }, 403);
  }
  const { data: existing } = await sb
    .from("attendance_records")
    .select("id")
    .eq("subject_id", validatedData.subject_id)
    .eq("schedule_id", validatedData.schedule_id)
    .eq("attendance_date", validatedData.attendance_date);
  if ((existing || []).length > 0) {
    return c.json({ error: "Ya existe un registro de asistencia para esta fecha y clase" }, 400);
  }
  const { data: inserted } = await sb
    .from("attendance_records")
    .insert({
      subject_id: validatedData.subject_id,
      schedule_id: validatedData.schedule_id,
      attendance_date: validatedData.attendance_date,
      teacher_id: (teacher as any).id,
    })
    .select("id")
    .single();
  const recordId = (inserted as any).id;
  if (validatedData.absent_student_ids.length > 0) {
    await sb.from("absent_students").insert(
      validatedData.absent_student_ids.map((studentId) => ({
        attendance_record_id: recordId,
        student_id: studentId,
      }))
    );
  }
  const { data: subj } = await sb.from("subjects").select("course_id").eq("id", validatedData.subject_id).single();
  const { count: totalStudents } = await sb
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("course_id", (subj as any).course_id);
  const absentCount = validatedData.absent_student_ids.length;
  const absentPercentage = totalStudents ? (absentCount / totalStudents) * 100 : 0;
  return c.json({
    success: true,
    record_id: recordId,
    alert:
      absentPercentage > 50
        ? `Alerta: Más del 50% de estudiantes ausentes (${absentPercentage.toFixed(1)}%)`
        : null,
  });
});

// ==================== Registrar Asistencia Manual ====================

app.post("/api/attendance/manual", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const body = await c.req.json();

  // Validar datos
  const validatedData = ManualAttendanceSchema.parse(body);

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Procesar cada entrada de ausencia
  const processedRecords = [];

  for (const entry of validatedData.entries) {
    const { data: subject } = await sb
      .from("subjects")
      .select("id")
      .eq("id", entry.subject_id)
      .eq("teacher_id", (teacher as any).id)
      .maybeSingle();
    if (!subject) {
      continue;
    }
    const { data: existingStudent } = await sb
      .from("students")
      .select("id")
      .eq("name", entry.student_name)
      .maybeSingle();
    let studentId: number;
    if (existingStudent) {
      studentId = (existingStudent as any).id;
    } else {
      const { data: newStudent } = await sb
        .from("students")
        .insert({ name: entry.student_name, course_id: 0 })
        .select("id")
        .single();
      studentId = (newStudent as any).id;
    }
    const { data: existingRecord } = await sb
      .from("attendance_records")
      .select("id")
      .eq("subject_id", entry.subject_id)
      .eq("attendance_date", entry.attendance_date)
      .eq("teacher_id", (teacher as any).id)
      .maybeSingle();
    let recordId: number;
    if (existingRecord) {
      recordId = (existingRecord as any).id;
    } else {
      const { data: newRec } = await sb
        .from("attendance_records")
        .insert({
          subject_id: entry.subject_id,
          schedule_id: 0,
          attendance_date: entry.attendance_date,
          teacher_id: (teacher as any).id,
        })
        .select("id")
        .single();
      recordId = (newRec as any).id;
    }
    await sb
      .from("absent_students")
      .insert({ attendance_record_id: recordId, student_id: studentId, hours_count: entry.hours_count });

    processedRecords.push({
      student_name: entry.student_name,
      subject_id: entry.subject_id,
      hours_count: entry.hours_count,
    });
  }

  return c.json({
    success: true,
    processed_count: processedRecords.length,
  });
});

// ==================== Ausencias Diarias del Colegio ====================

app.get("/api/absences/daily", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const date = c.req.query("date") || new Date().toISOString().split("T")[0];

  const sb = getSupabase(c.env);
  const { data: records } = await sb
    .from("attendance_records")
    .select("id, attendance_date")
    .eq("attendance_date", date);
  const recordIds = (records || []).map((r) => r.id);
  if (recordIds.length === 0) return c.json([]);
  const { data: absences } = await sb
    .from("absent_students")
    .select("attendance_record_id, student_id, hours_count")
    .in("attendance_record_id", recordIds);
  const studentIds = Array.from(new Set((absences || []).map((a) => a.student_id)));
  const { data: students } = await sb.from("students").select("id,name,course_id").in("id", studentIds);
  const courseIds = Array.from(new Set((students || []).map((s) => s.course_id).filter(Boolean)));
  const { data: courses } = await sb.from("courses").select("id,name").in("id", courseIds);
  const studentMap = new Map((students || []).map((s) => [s.id, s]));
  const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));
  const agg = new Map<
    number,
    { student_id: number; student_name: string; course_id: number | null; course_name: string | null; absence_count: number; total_hours: number }
  >();
  for (const a of absences || []) {
    const st = studentMap.get(a.student_id as any);
    const key = a.student_id as any;
    const prev = agg.get(key);
    const hours = a.hours_count ?? 1;
    if (prev) {
      prev.absence_count += 1;
      prev.total_hours += hours;
    } else {
      agg.set(key, {
        student_id: key,
        student_name: (st as any)?.name,
        course_id: (st as any)?.course_id ?? null,
        course_name: (st as any)?.course_id ? courseMap.get((st as any).course_id) ?? null : null,
        absence_count: 1,
        total_hours: hours,
      });
    }
  }
  const results = Array.from(agg.values()).sort((a, b) => {
    const ca = a.course_name ?? "Sin curso";
    const cb = b.course_name ?? "Sin curso";
    const ccmp = ca.localeCompare(cb);
    return ccmp !== 0 ? ccmp : a.student_name.localeCompare(b.student_name);
  });
  return c.json(results as unknown as DailyAbsence[]);
});

// ==================== Reportes ====================

app.get("/api/reports/daily", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const date = c.req.query("date") || new Date().toISOString().split("T")[0];
  const courseId = c.req.query("course_id");
  const subjectId = c.req.query("subject_id");

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) return c.json([]);

  let { data: records } = await sb
    .from("attendance_records")
    .select("id, attendance_date, subject_id")
    .eq("teacher_id", (teacher as any).id)
    .eq("attendance_date", date)
    .order("created_at", { ascending: false });
  if (subjectId) {
    records = (records || []).filter((r) => r.subject_id === parseInt(subjectId));
  }
  if (courseId) {
    const { data: subjects } = await sb
      .from("subjects")
      .select("id, course_id")
      .in(
        "id",
        Array.from(new Set((records || []).map((r) => r.subject_id)))
      );
    const allowedIds = new Set(
      (subjects || []).filter((s) => s.course_id === parseInt(courseId)).map((s) => s.id)
    );
    records = (records || []).filter((r) => allowedIds.has(r.subject_id as any));
  }

  const reports: AttendanceReport[] = [];

  for (const record of (records || [])) {

    const sb = getSupabase(c.env);
    const { data: subject } = await sb.from("subjects").select("name, course_id").eq("id", (record as any).subject_id).single();
    const { data: course } = await sb.from("courses").select("id,name").eq("id", (subject as any).course_id).single();
    const { data: allStudents } = await sb
      .from("students")
      .select("*")
      .eq("course_id", (subject as any).course_id)
      .order("name", { ascending: true });
    const { data: absentStudentIds } = await sb
      .from("absent_students")
      .select("student_id")
      .eq("attendance_record_id", (record as any).id);
    const absentIds = new Set((absentStudentIds || []).map((a) => (a as any).student_id));
    const presentStudents = (allStudents || []).filter((s: any) => !absentIds.has(s.id)) as Student[];
    const absentStudents = (allStudents || []).filter((s: any) => absentIds.has(s.id)) as Student[];

    const totalStudents = (allStudents || []).length;
    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const attendancePercentage = (presentCount / totalStudents) * 100;

    reports.push({
      date: (record as any).attendance_date,
      course_name: (course as any).name,
      subject_name: (subject as any).name,
      total_students: totalStudents,
      present_count: presentCount,
      absent_count: absentCount,
      attendance_percentage: attendancePercentage,
      absent_students: absentStudents as Student[],
      present_students: presentStudents as Student[],
    });
  }

  return c.json(reports);
});

// ==================== Admin - Cursos ====================

app.get("/api/admin/courses", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data } = await sb.from("courses").select("*").order("name", { ascending: true });
  return c.json(data || []);
});

// ==================== Admin - Profesores ====================

app.get("/api/admin/teachers", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data } = await sb.from("teachers").select("*").order("name", { ascending: true });
  return c.json(data || []);
});

app.put("/api/admin/teachers/:id", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const teacherId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  // Validar datos
  if (!body.name || !body.email) {
    return c.json({ error: "Nombre y email son requeridos" }, 400);
  }

  const sb = getSupabase(c.env);
  const { data: existing } = await sb
    .from("teachers")
    .select("id")
    .eq("email", body.email)
    .neq("id", teacherId);
  if ((existing || []).length > 0) {
    return c.json({ error: "Este email ya está en uso" }, 400);
  }

  await sb
    .from("teachers")
    .update({ name: body.name, email: body.email, tutor_course_id: body.tutor_course_id })
    .eq("id", teacherId);

  return c.json({ success: true });
});

app.delete("/api/admin/teachers/:id", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const teacherId = parseInt(c.req.param("id"));

  const sb = getSupabase(c.env);
  const { count } = await sb
    .from("subjects")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacherId);
  if ((count || 0) > 0) {
    return c.json({ error: "No se puede eliminar: el profesor tiene asignaturas asignadas" }, 400);
  }

  await sb.from("teachers").delete().eq("id", teacherId);

  return c.json({ success: true });
});

// ==================== Admin - Importar Estudiantes desde CSV ====================

app.post("/api/admin/students/import", async (c) => {

  try {
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No se proporcionó un archivo válido" }, 400);
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return c.json({ error: "El archivo está vacío o no tiene datos" }, 400);
    }

    // Parse header
    const header = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    
    const requiredColumns = ["nombre", "curso"];
    const missingColumns = requiredColumns.filter(
      (col) => !header.includes(col)
    );

    if (missingColumns.length > 0) {
      return c.json(
        {
          error: `Faltan columnas requeridas: ${missingColumns.join(", ")}`,
        },
        400
      );
    }

    const sb = getSupabase(c.env);
    const { data: coursesResults } = await sb.from("courses").select("id,name");
    const coursesMap = new Map((coursesResults || []).map((c: any) => [c.name.toLowerCase(), c.id]));

    let imported = 0;
    const errors: string[] = [];

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line: string = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handle quoted values)
        const values: string[] = [];
        let currentValue = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        // Create object from values
        const row: Record<string, string> = {};
        header.forEach((col: string, index: number) => {
          row[col] = values[index] || "";
        });

        // Validate required fields
        if (!row.nombre || !row.curso) {
          errors.push(`Línea ${i + 1}: Falta nombre o curso`);
          continue;
        }

        // Find or create course
        let courseId = coursesMap.get(row.curso.toLowerCase());
        if (!courseId) {
          const { data: created, error: courseErr } = await sb.from("courses").insert({ name: row.curso }).select("id").single();
          if (courseErr) {
            errors.push(`Línea ${i + 1}: No se pudo crear el curso "${row.curso}"`);
            continue;
          }
          courseId = (created as any).id;
          coursesMap.set(row.curso.toLowerCase(), courseId);
        }

        // Parse boolean for insurance
        let hasInsurance = null;
        if (row.seguro_estudiantil) {
          const insuranceValue = row.seguro_estudiantil.toLowerCase();
          hasInsurance = insuranceValue === "si" || insuranceValue === "sí" || insuranceValue === "yes" ? 1 : 0;
        }

        const { data: existingResults } = await sb
          .from("students")
          .select("id")
          .eq("name", row.nombre)
          .eq("course_id", courseId);
        if ((existingResults || []).length > 0) {
          errors.push(
            `Línea ${i + 1}: El estudiante "${row.nombre}" ya existe en el curso "${row.curso}"`
          );
          continue;
        }

        const genderRaw = (row.genero || "").toLowerCase();
        const gender =
          genderRaw === "m" || genderRaw.startsWith("mas") ? "Masculino" :
          genderRaw === "f" || genderRaw.startsWith("fem") ? "Femenino" :
          null;
        const piarRaw = (row.piar || row.requiere_piar || row.con_piar || "").toLowerCase();
        const requirePiar =
          piarRaw === "si" || piarRaw === "sí" || piarRaw === "yes" || piarRaw === "true" ? true :
          piarRaw === "no" || piarRaw === "false" ? false :
          null;
        const payload: any = {
          name: row.nombre,
          course_id: courseId,
          phone: row.telefono || null,
          email: row.correo || null,
          guardian_name: row.nombre_acudiente || null,
          guardian_phone: row.telefono_acudiente || null,
          address: row.direccion || null,
          has_student_insurance: hasInsurance,
          blood_type: row.tipo_sangre || null,
        };
        if (gender) payload.gender = gender;
        if (requirePiar !== null) payload.require_piar = requirePiar;
        let { error: insErr } = await sb.from("students").insert(payload);
        if (insErr) {
          const fallback: any = { ...payload };
          delete fallback.gender;
          delete fallback.require_piar;
          const { error: fbErr } = await sb.from("students").insert(fallback);
          if (fbErr) {
            errors.push(`Línea ${i + 1}: No se pudo crear el estudiante "${row.nombre}"`);
            continue;
          }
        }

        imported++;
      } catch (error) {
        errors.push(`Línea ${i + 1}: Error al procesar - ${error}`);
      }
    }

    return c.json({
      imported,
      errors,
      message: `Se importaron ${imported} estudiantes exitosamente`,
    });
  } catch (error) {
    console.error("Error importing students:", error);
    return c.json({ error: "Error al procesar el archivo" }, 500);
  }
});

// ==================== Admin - Estudiantes ====================

app.get("/api/admin/students", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data } = await sb.from("students").select("*").order("name", { ascending: true });
  return c.json(data || []);
});

app.post("/api/admin/students", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const isAdmin = await ensureAdminOrCoord(c);
  if (!isAdmin) return c.json({ error: "Sin permisos" }, 403);
  const body = await c.req.json();
  if (!body?.name || !body?.course_id) return c.json({ error: "Nombre y curso son requeridos" }, 400);
  const sb = getSupabase(c.env);
  const payload: any = {
    name: String(body.name),
    course_id: parseInt(body.course_id),
  };
  if (body.code) payload.code = String(body.code);
  if (body.phone) payload.phone = String(body.phone);
  if (body.email) payload.email = String(body.email);
  const { data, error } = await sb.from("students").insert(payload).select("*").single();
  if (error) return c.json({ error: "No se pudo crear el estudiante" }, 500);
  return c.json(data);
});
app.put("/api/admin/students/:id", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const studentId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  // Validar datos
  if (!body.name) {
    return c.json({ error: "El nombre es requerido" }, 400);
  }

  const sb = getSupabase(c.env);
  await sb.from("students").update({ name: body.name, course_id: body.course_id }).eq("id", studentId);

  return c.json({ success: true });
});

app.delete("/api/admin/students/:id", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const studentId = parseInt(c.req.param("id"));

  const sb = getSupabase(c.env);
  const { count } = await sb
    .from("absent_students")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId);
  if ((count || 0) > 0) {
    return c.json({ error: "No se puede eliminar: el estudiante tiene registros de asistencia" }, 400);
  }

  await sb.from("students").delete().eq("id", studentId);

  return c.json({ success: true });
});

// ==================== Admin - Registros de Asistencia ====================

app.get("/api/admin/attendance-records", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const sb = getSupabase(c.env);
  const { data: records } = await sb
    .from("attendance_records")
    .select("id, attendance_date, subject_id, teacher_id")
    .order("attendance_date", { ascending: false })
    .limit(100);
  const subjectIds = Array.from(new Set((records || []).map((r) => r.subject_id)));
  const teacherIds = Array.from(new Set((records || []).map((r) => r.teacher_id)));
  const { data: subjects } = await sb.from("subjects").select("id,name,course_id").in("id", subjectIds);
  const { data: courses } = await sb
    .from("courses")
    .select("id,name")
    .in("id", Array.from(new Set((subjects || []).map((s) => s.course_id))));
  const { data: teachers } = await sb.from("teachers").select("id,name").in("id", teacherIds);
  const subjMap = new Map((subjects || []).map((s) => [s.id, s]));
  const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));
  const teacherMap = new Map((teachers || []).map((t) => [t.id, t.name]));
  const absentCounts = new Map<number, number>();
  for (const r of records || []) {
    const { count } = await sb
      .from("absent_students")
      .select("*", { count: "exact", head: true })
      .eq("attendance_record_id", (r as any).id);
    absentCounts.set((r as any).id, count || 0);
  }
  const result = (records || []).map((r: any) => {
    const s = subjMap.get(r.subject_id);
    return {
      id: r.id,
      attendance_date: r.attendance_date,
      subject_name: s?.name,
      course_name: s?.course_id ? courseMap.get(s.course_id) : null,
      teacher_name: teacherMap.get(r.teacher_id) || null,
      absent_count: absentCounts.get(r.id) || 0,
    };
  });
  return c.json(result);
});

app.delete("/api/admin/attendance-records/:id", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const recordId = parseInt(c.req.param("id"));

  const sb = getSupabase(c.env);
  await sb.from("absent_students").delete().eq("attendance_record_id", recordId);
  await sb.from("attendance_records").delete().eq("id", recordId);

  return c.json({ success: true });
});

// ==================== Exportar CSV ====================

app.get("/api/reports/export/csv", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  const date = c.req.query("date") || new Date().toISOString().split("T")[0];

  const sb = getSupabase(c.env);
  const { data: teacher } = await sb
    .from("teachers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: records } = await sb
    .from("attendance_records")
    .select("id, attendance_date, subject_id")
    .eq("teacher_id", (teacher as any).id)
    .eq("attendance_date", date)
    .order("id", { ascending: true });

  // Configuración académica
  const { data: settings } = await sb.from("academic_settings").select("*").limit(1);
  const year = (settings as any)?.[0]?.active_year ?? null;
  const terms = (settings as any)?.[0]?.terms_count ?? null;

  // Generar CSV
  let header = "Fecha,Curso,Asignatura,Estudiante,Estado\n";
  if (year) header = `Año lectivo,${year}${terms ? `,Periodos,${terms}` : ""}\n` + header;
  let csv = header;

  for (const record of (records || [])) {
    const sb = getSupabase(c.env);
    const { data: subject } = await sb.from("subjects").select("name, course_id").eq("id", (record as any).subject_id).single();
    const { data: course } = await sb.from("courses").select("name").eq("id", (subject as any).course_id).single();
    const { data: absentStudents } = await sb
      .from("absent_students")
      .select("student_id")
      .eq("attendance_record_id", (record as any).id);
    if (absentStudents && absentStudents.length > 0) {
      const { data: studentNames } = await sb
        .from("students")
        .select("name,id")
        .in(
          "id",
          absentStudents.map((x: any) => x.student_id)
        )
        .order("name", { ascending: true });
      for (const student of studentNames || []) {
        csv += `${(record as any).attendance_date},${(course as any).name},${(subject as any).name},${(student as any).name},Ausente\n`;
      }
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="asistencia_${year ? `${year}_` : ""}${terms ? `p${terms}_` : ""}${date}.csv"`,
    },
  });
});

// ==================== Admin - Configuración Académica ====================

app.get("/api/admin/settings", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const sbConf = getSupabaseSchema(c.env, "config_store");
  const { data: conf } = await sbConf.from("settings").select("*").limit(1);
  if ((conf || []).length > 0) return c.json((conf as any)[0]);
  const sb = getSupabase(c.env);
  const { data } = await sb.from("academic_settings").select("*").limit(1);
  if ((data || []).length === 0) {
    const year = new Date().getFullYear();
    const { data: inserted } = await sb.from("academic_settings").insert({ active_year: year, terms_count: 3 }).select("*");
    return c.json((inserted || [])[0] || { active_year: year, terms_count: 3 });
  }
  return c.json((data as any)[0]);
});

app.put("/api/admin/settings", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const isAdmin = await ensureAdminOrCoord(c);
  if (!isAdmin) return c.json({ error: "Sin permisos" }, 403);
  const body = await c.req.json();
  const year = parseInt(body.active_year);
  const terms = parseInt(body.terms_count);
  if (!year || isNaN(year) || terms < 1) return c.json({ error: "Datos inválidos" }, 400);
  const sb = getSupabase(c.env);
  const { data } = await sb.from("academic_settings").select("id").limit(1);
  if ((data || []).length === 0) {
    await sb.from("academic_settings").insert({ active_year: year, terms_count: terms });
  } else {
    await sb.from("academic_settings").update({ active_year: year, terms_count: terms }).eq("id", (data as any)[0].id);
  }
  return c.json({ success: true });
});

// ==================== Admin - Horas por Asignatura y Grado ====================

app.get("/api/admin/subject-hours", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const sb = getSupabase(c.env);
  const { data } = await sb.from("subject_grade_hours").select("*").order("subject", { ascending: true }).order("grade", { ascending: true });
  return c.json(data || []);
});

app.put("/api/admin/subject-hours", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const isAdmin = await ensureAdminOrCoord(c);
  if (!isAdmin) return c.json({ error: "Sin permisos" }, 403);
  const body = await c.req.json();
  const rows = Array.isArray(body) ? body : [];
  const normalized = rows
    .filter((r: any) => r && r.subject && r.grade && typeof r.hours === "number")
    .map((r: any) => ({ subject: String(r.subject), grade: parseInt(r.grade), hours: parseInt(r.hours) }));
  const sb = getSupabase(c.env);
  const { error } = await sb.from("subject_grade_hours").upsert(normalized, { onConflict: "subject,grade" });
  if (error) return c.json({ error: "No se pudo guardar horas. Crear tabla y clave única (subject,grade)." }, 500);
  return c.json({ success: true, count: normalized.length });
});

app.delete("/api/admin/subject-hours", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const sb = getSupabase(c.env);
  const { count } = await sb.from("subject_grade_hours").select("*", { count: "exact", head: true });
  const { error: delErr } = await sb.from("subject_grade_hours").delete().not("subject", "is", null);
  if (delErr) return c.json({ error: "No se pudo borrar todas las asignaturas. Revisa RLS o configura SUPABASE_SERVICE_ROLE_KEY." }, 500);
  return c.json({ success: true, deleted: count || 0 });
});

// ==================== Admin - Config Store (robusto) ====================

app.post("/api/admin/config-store/save", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const isAdmin = await ensureAdminOrCoord(c);
  if (!isAdmin) return c.json({ error: "Sin permisos" }, 403);
  const body = await c.req.json();
  const settings = body?.settings || {};
  const rows = Array.isArray(body?.subject_hours) ? body.subject_hours : [];
  const year = parseInt(settings.active_year);
  const terms = parseInt(settings.terms_count);
  if (!year || isNaN(year) || terms < 1) return c.json({ error: "Datos inválidos" }, 400);

  // Persist settings in dedicated schema
  const sbConf = getSupabaseSchema(c.env, "config_store");
  let confWarning: string | null = null;
  try {
    const { data: existing } = await sbConf.from("settings").select("id").limit(1);
    if ((existing || []).length === 0) {
      await sbConf.from("settings").insert({ active_year: year, terms_count: terms });
    } else {
      await sbConf.from("settings").update({ active_year: year, terms_count: terms }).eq("id", (existing as any)[0].id);
    }
  } catch (e: any) {
    confWarning = "No se pudo escribir en config_store.settings. Ejecuta migrations/config_store.sql y revisa RLS.";
  }

  // Persist subject hours in public
  const normalized = rows
    .filter((r: any) => r && r.subject && r.grade && typeof r.hours === "number")
    .map((r: any) => ({ subject: String(r.subject), grade: parseInt(r.grade), hours: parseInt(r.hours) }));
  const sb = getSupabase(c.env);
  const { error: upErr } = await sb.from("subject_grade_hours").upsert(normalized, { onConflict: "subject,grade" });
  if (upErr) confWarning = "No se pudo guardar horas. Crear tabla subject_grade_hours y clave única (subject,grade).";

  // Snapshot profile per year in config_store
  try {
    const { data: curRows } = await sb.from("subject_grade_hours").select("subject,grade,hours").order("subject", { ascending: true }).order("grade", { ascending: true });
    const entriesSrc = (curRows || []).map((r: any) => ({ subject: String(r.subject), grade: parseInt(r.grade), hours: parseInt(r.hours) })).filter((r: any) => r.subject && r.grade && typeof r.hours === "number");
    const { data: newProfile } = await sbConf
      .from("subject_hours_profiles")
      .insert({ year })
      .select("id")
      .single();
    const profileId = (newProfile as any)?.id;
    if (profileId) {
      const entries = entriesSrc.map((r: any) => ({ profile_id: profileId, subject: r.subject, grade: r.grade, hours: r.hours }));
      if (entries.length > 0) {
        const { error: insErr } = await sbConf.from("subject_hours_profile_entries").insert(entries);
        if (insErr) {
          const { error: fbErr } = await sb.from("subject_hours_profile_entries").insert(entries);
          if (fbErr) {
            confWarning = "No se pudo registrar el historial. Ejecuta migrations/config_store.sql o migrations/subject_hours_history.sql y revisa RLS.";
          } else {
            confWarning = "Historial guardado en esquema público (fallback). Sugerido: crear config_store para perfiles.";
          }
        }
      }
    }
  } catch (e: any) {
    // Intentar fallback en public.*
    const sbPub = getSupabase(c.env);
    try {
      const { data: curRowsPub } = await sb.from("subject_grade_hours").select("subject,grade,hours").order("subject", { ascending: true }).order("grade", { ascending: true });
      const entriesSrcPub = (curRowsPub || []).map((r: any) => ({ subject: String(r.subject), grade: parseInt(r.grade), hours: parseInt(r.hours) })).filter((r: any) => r.subject && r.grade && typeof r.hours === "number");
      const { data: newProfilePub } = await sbPub
        .from("subject_hours_profiles")
        .insert({ year })
        .select("id")
        .single();
      const profileIdPub = (newProfilePub as any)?.id;
      if (profileIdPub) {
        const entriesPub = entriesSrcPub.map((r: any) => ({ profile_id: profileIdPub, subject: r.subject, grade: r.grade, hours: r.hours }));
        if (entriesPub.length > 0) {
          await sbPub.from("subject_hours_profile_entries").insert(entriesPub);
        }
      }
      confWarning = "Historial guardado en esquema público (fallback). Sugerido: crear config_store para perfiles.";
    } catch (e2: any) {
      confWarning = "No se pudo registrar el historial. Ejecuta migrations/config_store.sql o migrations/subject_hours_history.sql y revisa RLS.";
    }
  }

  return c.json({ success: true, count: normalized.length, warning: confWarning });
});

app.get("/api/admin/config-store/history", supabaseAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Usuario no autenticado" }, 401);
  const sbConf = getSupabaseSchema(c.env, "config_store");
  const sb = getSupabase(c.env);
  let vigenteYear: number | null = null;
  let profiles: any[] | null = null;
  try {
    const { data: settings } = await sbConf.from("settings").select("*").limit(1);
    vigenteYear = (settings as any)?.[0]?.active_year ?? null;
    const resp = await sbConf
      .from("subject_hours_profiles")
      .select("id, year, created_at")
      .order("year", { ascending: false });
    profiles = resp.data || [];
  } catch {
    vigenteYear = null;
    profiles = null;
  }
  // Fallback a esquema público si no hay perfiles en config_store
  if (!profiles || profiles.length === 0) {
    const { data: profilesPub } = await sb
      .from("subject_hours_profiles")
      .select("id, year, created_at")
      .order("year", { ascending: false });
    profiles = profilesPub || [];
  }
  const results: any[] = [];
  for (const p of profiles || []) {
    // Intentar leer de config_store, si falla usar público
    let entries: any[] | null = null;
    try {
      const resp = await sbConf
        .from("subject_hours_profile_entries")
        .select("subject, grade, hours")
        .eq("profile_id", (p as any).id);
      entries = resp.data || [];
    } catch {
      const respPub = await sb
        .from("subject_hours_profile_entries")
        .select("subject, grade, hours")
        .eq("profile_id", (p as any).id);
      entries = respPub.data || [];
    }
    if (!entries || entries.length === 0) {
      const respPub = await sb
        .from("subject_hours_profile_entries")
        .select("subject, grade, hours")
        .eq("profile_id", (p as any).id);
      entries = respPub.data || entries || [];
    }
    const groupSummary = (fromG: number, toG: number) => {
      const map = new Map<string, number[]>();
      for (const e of entries || []) {
        const g = (e as any).grade;
        if (g >= fromG && g <= toG) {
          const s = (e as any).subject;
          const arr = map.get(s) || [];
          arr.push((e as any).hours);
          map.set(s, arr);
        }
      }
      const out: Array<{ subject: string; hours: number }> = [];
      for (const [subject, arr] of map) {
        if (arr.length > 0) {
          // Use mode; fallback to average
          const counts = new Map<number, number>();
          for (const h of arr) counts.set(h, (counts.get(h) || 0) + 1);
          let modeH = arr[0];
          let modeC = 0;
          for (const [h, c] of counts) {
            if (c > modeC) {
              modeC = c;
              modeH = h;
            }
          }
          out.push({ subject, hours: modeH });
        }
      }
      out.sort((a, b) => a.subject.localeCompare(b.subject));
      return out;
    };
    results.push({
      year: (p as any).year,
      vigente: vigenteYear !== null ? (p as any).year === vigenteYear : false,
      created_at: (p as any).created_at,
      grados_6_9: groupSummary(6, 9),
      grados_10_11: groupSummary(10, 11),
    });
  }
  return c.json(results);
});

export default app;
