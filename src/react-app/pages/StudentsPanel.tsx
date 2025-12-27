import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "@/react-app/components/Sidebar";
import { apiFetch } from "@/react-app/lib/api";
import { Search, Eye, Phone, Mail, AlertTriangle, FileDown, Plus } from "lucide-react";

type Course = { id: number; name: string };
type Student = { id: number; name: string; course_id: number; code?: string | null; status?: string | null; gender?: string | null; require_piar?: boolean | null };
type AlertInfo = { student_id: number; consecutive_absences: number };
type AttendanceSummary = { student_id: number; sessions: number; absences: number; percentage: number };

export default function StudentsPanel() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [query, setQuery] = useState<string>("");
  const [newModal, setNewModal] = useState<boolean>(false);
  const [newForm, setNewForm] = useState<{ name: string; course_id: number | null; code?: string; phone?: string; email?: string }>({ name: "", course_id: null });

  useEffect(() => {
    const load = async () => {
      const c = await apiFetch("/api/admin/courses");
      if (c.ok) {
        const arr = (await c.json()) as Course[];
        setCourses(arr);
        if (arr.length > 0) setSelectedCourseId(arr[0].id);
      }
      const s = await apiFetch("/api/admin/students");
      if (s.ok) setStudents(await s.json());
    };
    load();
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedCourseId) return;
      const a = await apiFetch(`/api/students/alerts?course_id=${selectedCourseId}`);
      if (a.ok) setAlerts(await a.json());
      const su = await apiFetch(`/api/students/attendance-summary?course_id=${selectedCourseId}`);
      if (su.ok) setSummary(await su.json());
    };
    loadDetails();
  }, [selectedCourseId]);

  const pctMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of summary) m.set(s.student_id, Math.round(s.percentage));
    return m;
  }, [summary]);

  const alertSet = useMemo(() => new Set(alerts.filter((a) => a.consecutive_absences >= 3).map((a) => a.student_id)), [alerts]);

  const filtered = useMemo(() => {
    const base = selectedCourseId ? students.filter((st) => st.course_id === selectedCourseId) : students;
    if (!query) return base;
    const q = query.toLowerCase();
    return base.filter((st) => st.name.toLowerCase().includes(q) || String(st.id).includes(q));
  }, [students, selectedCourseId, query]);

  const totals = useMemo(() => {
    const total = filtered.length;
    const withAlerts = filtered.filter((st) => alertSet.has(st.id)).length;
    const withPiar = filtered.filter((st) => !!st.require_piar).length;
    return { total, activos: total, alerts: withAlerts, piar: withPiar };
  }, [filtered, alertSet]);

  const exportCSV = () => {
    const rows = filtered.map((st) => {
      const pct = pctMap.get(st.id) ?? 0;
      const course = courses.find((c) => c.id === st.course_id)?.name || "";
      return [st.name, st.id, course, `${pct}%`].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",");
    });
    const csv = ["Nombre,CC,Curso,Asistencia", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estudiantes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async () => {
    if (!newForm.name || !newForm.course_id) return;
    const resp = await apiFetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (resp.ok) {
      setNewModal(false);
      setNewForm({ name: "", course_id: selectedCourseId || null });
      const s = await apiFetch("/api/admin/students");
      if (s.ok) setStudents(await s.json());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-2xl font-bold text-slate-900">{totals.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Activos</div>
            <div className="text-2xl font-bold text-slate-900">{totals.activos}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Con PIAR</div>
            <div className="text-2xl font-bold text-slate-900">{totals.piar}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Con alertas
            </div>
            <div className="text-2xl font-bold text-slate-900">{totals.alerts}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full outline-none text-sm"
            />
          </div>
          <select
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
            className="bg-white rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200"
          >
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => navigate("/admin/import-students")}
            className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200"
          >
            Importar
          </button>
          <button
            onClick={() => setNewModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Estudiante
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((st) => {
              const pct = pctMap.get(st.id) ?? 0;
              const isAlert = alertSet.has(st.id);
              const course = courses.find((c) => c.id === st.course_id)?.name || "—";
              return (
                <div key={st.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                      {st.name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        {st.name}
                        {isAlert && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="text-xs text-slate-500">CC: {String(st.id).padStart(6, "0")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">{course}</span>
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-2 rounded-full ${pct >= 90 ? "bg-green-500" : pct >= 75 ? "bg-amber-400" : "bg-red-500"}`}
                        />
                      </div>
                      <div className="text-right text-xs text-slate-600 mt-1">{pct}%</div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${isAlert ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isAlert ? "Alerta" : "Activo"}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-4 h-4" />
                      <Mail className="w-4 h-4" />
                    </div>
                    <button
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1"
                      onClick={() => window.location.href = `/mobile/students`}
                    >
                      <Eye className="w-4 h-4" />
                      Ver ficha
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">Sin estudiantes para el filtro seleccionado</div>
            )}
          </div>
        </div>
        {newModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-bold text-slate-900 mb-3">Nuevo Estudiante</div>
              <div className="space-y-3">
                <input
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="Nombre"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={newForm.course_id || ""}
                  onChange={(e) => setNewForm({ ...newForm, course_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecciona curso</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newForm.code || ""}
                    onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
                    placeholder="Código (opcional)"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={newForm.phone || ""}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    placeholder="Teléfono (opcional)"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <input
                  value={newForm.email || ""}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="Email (opcional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setNewModal(false)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm">Cancelar</button>
                <button onClick={handleCreate} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
        </main>
      </div>
    </div>
  );
}
