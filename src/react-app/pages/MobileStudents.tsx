import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/react-app/lib/api";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import { User, IdCard, Droplets, Home, Medal, AlertTriangle, ClipboardList, FileText, X } from "lucide-react";

type Course = { id: number; name: string };
type Student = {
  id: number;
  name: string;
  course_id: number;
  phone?: string | null;
  email?: string | null;
  guardian_name?: string | null;
  address?: string | null;
  birth_date?: string | null;
  rh?: string | null;
  eps?: string | null;
  clubs?: string[] | null;
};

type AlertInfo = { student_id: number; consecutive_absences: number };

const COURSE_ORDER = [
  "6A",
  "6B",
  "6C",
  "7A",
  "7B",
  "7C",
  "8A",
  "8B",
  "8C",
  "9A",
  "9B",
  "9C",
  "10A",
  "10B",
  "10C",
  "11A",
  "11B",
  "11C",
];

export default function MobileStudents() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState<string>("6A");
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"id" | "perf" | "att" | "obs">("id");

  useEffect(() => {
    const load = async () => {
      const c = await apiFetch("/api/admin/courses");
      if (c.ok) {
        const arr = (await c.json()) as Course[];
        const sorted = COURSE_ORDER.map((n) => arr.find((x) => x.name === n)).filter(Boolean) as Course[];
        setCourses(sorted.length > 0 ? sorted : arr);
      }
      const s = await apiFetch("/api/admin/students");
      if (s.ok) {
        setStudents(await s.json());
      }
    };
    load();
  }, []);

  const selectedCourse = useMemo(() => courses.find((c) => c.name === selectedCourseName) || null, [courses, selectedCourseName]);
  const courseStudents = useMemo(
    () => (selectedCourse ? students.filter((st) => st.course_id === selectedCourse.id) : []),
    [students, selectedCourse]
  );
  const alertSet = useMemo(() => new Set(alerts.filter((a) => a.consecutive_absences >= 3).map((a) => a.student_id)), [alerts]);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!selectedCourse) return;
      const resp = await apiFetch(`/api/students/alerts?course_id=${selectedCourse.id}`);
      if (resp.ok) {
        setAlerts(await resp.json());
      } else {
        setAlerts([]);
      }
    };
    loadAlerts();
  }, [selectedCourse]);

  const calcAge = (birth?: string | null) => {
    if (!birth) return "-";
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return "-";
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const mDiff = now.getMonth() - d.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) age--;
    return `${age}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-white">
        <div className="sticky top-0 z-20 backdrop-blur-md bg-black/40">
          <div className="flex overflow-x-auto no-scrollbar gap-2 p-2">
            {(courses.length > 0 ? courses.map((c) => c.name) : COURSE_ORDER).map((name) => (
              <button
                key={name}
                onClick={() => setSelectedCourseName(name)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all active:scale-95 ${
                  selectedCourseName === name ? "bg-indigo-600 shadow-lg" : "bg-neutral-700 hover:bg-neutral-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            {courseStudents.map((st) => {
              const isAlert = alertSet.has(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStudent(st);
                    setActiveTab("id");
                    setModalOpen(true);
                  }}
                  className="relative rounded-[1.5rem] bg-neutral-900/70 border border-neutral-700 p-2 text-left hover:bg-neutral-800 active:scale-95 transition-all"
                >
                  {isAlert && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  )}
                  <div className="text-[9px] font-black uppercase leading-tight line-clamp-1">{st.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {modalOpen && activeStudent && (
          <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-2xl flex items-end sm:items-center justify-center">
            <div className="w-full sm:max-w-md bg-neutral-900 rounded-3xl border border-neutral-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase">{activeStudent.name}</span>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-800">
                  <X className="w-4 h-4 text-neutral-300" />
                </button>
              </div>

              {Array.from(alertSet).includes(activeStudent.id) && (
                <div className="mb-2 px-2 py-1 rounded-xl bg-red-700/30 border border-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] font-black uppercase">ALERTA ROJA: 3 inasistencias consecutivas</span>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setActiveTab("id")}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase active:scale-95 ${
                    activeTab === "id" ? "bg-indigo-600" : "bg-neutral-800"
                  }`}
                >
                  Identidad
                </button>
                <button
                  onClick={() => setActiveTab("perf")}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase active:scale-95 ${
                    activeTab === "perf" ? "bg-indigo-600" : "bg-neutral-800"
                  }`}
                >
                  Rendimiento
                </button>
                <button
                  onClick={() => setActiveTab("att")}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase active:scale-95 ${
                    activeTab === "att" ? "bg-indigo-600" : "bg-neutral-800"
                  }`}
                >
                  Asistencia
                </button>
                <button
                  onClick={() => setActiveTab("obs")}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase active:scale-95 ${
                    activeTab === "obs" ? "bg-indigo-600" : "bg-neutral-800"
                  }`}
                >
                  Observador
                </button>
              </div>

              {activeTab === "id" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl p-2">
                    <IdCard className="w-4 h-4 text-indigo-300" />
                    <div className="text-[10px]">
                      <div>Edad: {calcAge(activeStudent.birth_date)}</div>
                      <div>Documento: —</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl p-2">
                    <Droplets className="w-4 h-4 text-sky-300" />
                    <div className="text-[10px]">
                      <div>RH: {activeStudent.rh || "—"}</div>
                      <div>EPS: {activeStudent.eps || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl p-2 col-span-2">
                    <Home className="w-4 h-4 text-emerald-300" />
                    <div className="text-[10px]">
                      <div>Dirección: {activeStudent.address || "—"}</div>
                      <div>Clubes: {(activeStudent.clubs || []).join(", ") || "—"}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "perf" && (
                <div className="bg-neutral-800 rounded-2xl p-2">
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {["P1", "P2", "P3", "P4"].map((p) => (
                      <div key={p} className="text-center text-[10px] font-black uppercase">{p}</div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {/* Etiquetas de dificultades (<3.0); sustituir con datos reales si el endpoint está disponible */}
                    {/* Ejemplo visual */}
                    <span className="px-2 py-1 rounded-full bg-blue-600 text-[7px] font-black uppercase">Matemáticas &lt; 3.0</span>
                    <span className="px-2 py-1 rounded-full bg-purple-600 text-[7px] font-black uppercase">Física &lt; 3.0</span>
                  </div>
                </div>
              )}

              {activeTab === "att" && (
                <div className="bg-neutral-800 rounded-2xl p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Medal className="w-4 h-4 text-amber-300" />
                    <span className="text-[10px] font-black uppercase">Smart Monitor</span>
                  </div>
                  <div className="text-[10px]">Señaliza alerta si detecta 3 inasistencias consecutivas.</div>
                </div>
              )}

              {activeTab === "obs" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-300" />
                    <span className="text-[10px] font-black uppercase">Registrar evento</span>
                  </div>
                  <form
                    className="bg-neutral-800 rounded-2xl p-2 space-y-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget as HTMLFormElement);
                      const payload = {
                        student_id: activeStudent?.id,
                        severity: fd.get("severity"),
                        note: fd.get("note"),
                      };
                      const resp = await apiFetch("/api/students/observations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      // Manejo sin bloquear UI
                      if (resp.ok) {
                        (e.currentTarget as HTMLFormElement).reset();
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <select name="severity" defaultValue={"Leve"} className="bg-neutral-900 rounded-xl p-2 text-[10px]">
                        <option>Leve</option>
                        <option>Grave</option>
                        <option>Gravísima</option>
                      </select>
                      <input name="note" placeholder="Nota" className="bg-neutral-900 rounded-xl p-2 text-[10px]" />
                    </div>
                    <button className="mt-1 w-full bg-indigo-600 rounded-xl p-2 text-[10px] font-black uppercase active:scale-95">Guardar</button>
                  </form>
                  <div className="bg-neutral-800 rounded-2xl p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-neutral-300" />
                      <span className="text-[10px] font-black uppercase">Historial</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] px-2 py-1 rounded-xl bg-green-900/30 border border-green-700">Leve: ejemplo de evento</div>
                      <div className="text-[10px] px-2 py-1 rounded-xl bg-amber-900/30 border border-amber-700">Grave: ejemplo de evento</div>
                      <div className="text-[10px] px-2 py-1 rounded-xl bg-red-900/30 border border-red-700">Gravísima: ejemplo de evento</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

