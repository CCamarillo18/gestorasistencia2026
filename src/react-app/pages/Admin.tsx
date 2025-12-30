import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/lib/api";
import { ArrowLeft, Users, Cog, Edit2, Trash2, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import type { Student, Course } from "@/shared/types";

type TabType = "students" | "config";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-red-50 min-h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Se detectó un error de renderizado</h1>
          <p className="text-gray-600 mb-4">El panel no pudo procesar la información actual.</p>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
            Recargar Panel
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [termsCount, setTermsCount] = useState<number>(3);
  const [subjectHours, setSubjectHours] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const SUBJECT_OPTIONS: Array<{ label: string; value: string }> = [
    { label: "Biol.", value: "Biología" },
    { label: "Fís.", value: "Física" },
    { label: "Quím.", value: "Química" },
    { label: "Pre Cien.", value: "Pre Ciencias" },
    { label: "Mat.", value: "Matemáticas" },
    { label: "Geom.", value: "Geometría" },
    { label: "Econ. Pol.", value: "Economía Política" },
    { label: "Leng. Cast.", value: "Lengua Castellana" },
    { label: "Comp. Lect.", value: "Comprensión Lectora" },
    { label: "Ingl.", value: "Inglés" },
    { label: "Fil.", value: "Filosofía" },
    { label: "Soc.", value: "Sociales" },
    { label: "Hist.", value: "Historia" },
    { label: "Geog.", value: "Geografía" },
    { label: "Art.", value: "Artística" },
    { label: "Info.", value: "Informática" },
    { label: "Ética", value: "Ética" },
    { label: "Relig.", value: "Religión" },
    { label: "C. Ciudad.", value: "C. Ciudadanas" },
    { label: "Ed. Fís.", value: "Ed. Física" },
  ];

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  const subjectColor = (name: string) => {
    if (name === "Matemáticas") return "bg-red-600";
    if (name === "Biología") return "bg-green-600";
    if (name === "Sociales") return "bg-amber-800";
    if (name === "Inglés") return "bg-purple-600";
    if (name === "Física") return "bg-rose-500";
    if (name === "Química") return "bg-violet-600";
    if (name === "Geometría") return "bg-sky-600";
    if (name === "Economía Política") return "bg-stone-700";
    if (name === "Lengua Castellana") return "bg-orange-600";
    if (name === "Comprensión Lectora") return "bg-orange-400";
    if (name === "Filosofía") return "bg-slate-700";
    if (name === "Historia") return "bg-amber-600";
    if (name === "Geografía") return "bg-amber-500";
    if (name === "Artística") return "bg-pink-500";
    if (name === "Informática") return "bg-slate-600";
    if (name === "Ética") return "bg-lime-600";
    if (name === "Religión") return "bg-yellow-600";
    if (name === "C. Ciudadanas") return "bg-teal-600";
    if (name === "Ed. Física") return "bg-red-700";
    if (name === "Pre Ciencias") return "bg-green-700";
    return "bg-indigo-600";
  };

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [studentForm, setStudentForm] = useState({ name: "", course_id: 0 });

  useEffect(() => {
    loadCourses();
    if (activeTab === "students") {
      loadStudents();
    } else if (activeTab === "config") {
      loadConfig();
    }
  }, [activeTab]);

  const loadCourses = async () => {
    try {
      const response = await apiFetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/admin/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      try {
        const s = await apiFetch("/api/admin/settings");
        if (s.ok) {
          const d = await s.json();
          setActiveYear(d?.active_year ?? new Date().getFullYear());
          setTermsCount(d?.terms_count ?? 3);
        }
      } catch (e) {
        console.error("settings load error", e);
      }
      try {
        const h = await apiFetch("/api/admin/subject-hours");
        if (h.ok) {
          const arr = await h.json();
          setSubjectHours(Array.isArray(arr) ? arr : []);
        } else {
          setSubjectHours([]);
        }
      } catch (e) {
        console.error("subject-hours load error", e);
        setSubjectHours([]);
      }
      try {
        const hist = await apiFetch("/api/admin/config-store/history");
        if (hist.ok) {
          const arr = await hist.json();
          setHistory(Array.isArray(arr) ? arr : []);
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error("history load error", e);
        setHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (studentId: number) => {
    setError(null);
    try {
      const response = await apiFetch(`/api/admin/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });

      if (response.ok) {
        setSuccess("Estudiante actualizado exitosamente");
        setEditingStudent(null);
        loadStudents();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const getCourseNameById = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : "Sin asignar";
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("¿Estás seguro de eliminar este estudiante?")) return;
    try {
      const response = await apiFetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSuccess("Estudiante eliminado exitosamente");
        loadStudents();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al eliminar");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student.id);
    setStudentForm({
      name: student.name,
      course_id: student.course_id,
    });
  };

  console.log("Estado de datos:", { students, history, subjectHours });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="flex space-x-2 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "config" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Cog className="w-4 h-4" />
              <span>Configuración</span>
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "students" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Estudiantes</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {activeTab === "students" && (
                <>
                  <div className="mb-6 flex justify-end">
                    <button
                      onClick={() => navigate("/admin/import-students")}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Importar desde CSV</span>
                    </button>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {(students || []).map((student) => (
                        <div key={student.id} className="p-6">
                          {editingStudent === student.id ? (
                            <div className="space-y-4">
                              <input
                                type="text"
                                value={studentForm.name}
                                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                              />
                              <select
                                value={studentForm.course_id}
                                onChange={(e) => setStudentForm({ ...studentForm, course_id: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                              >
                                <option value={0}>Selecciona un curso</option>
                                {(courses || []).map((course) => (
                                  <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                              </select>
                              <div className="flex space-x-2">
                                <button onClick={() => handleUpdateStudent(student.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Guardar</button>
                                <button onClick={() => setEditingStudent(null)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-600">Curso: {getCourseNameById(student.course_id)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => startEditStudent(student)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteStudent(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "config" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Año lectivo y periodos</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-700">Año lectivo</label>
                        <input
                          type="number"
                          value={activeYear}
                          onChange={(e) => setActiveYear(parseInt(e.target.value))}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Periodos</label>
                        <select
                          value={termsCount}
                          onChange={(e) => setTermsCount(parseInt(e.target.value))}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl"
                        >
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setSuccess("Configuración aplicada localmente");
                          window.dispatchEvent(new CustomEvent("settings-updated", { detail: { active_year: activeYear, terms_count: termsCount } }));
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Horas por asignatura y grado</h3>
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={async () => {
                          const resp = await apiFetch("/api/admin/config-store/save", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ settings: { active_year: activeYear, terms_count: termsCount }, subject_hours: subjectHours }),
                          });
                          if (resp.ok) {
                            const r = await resp.json();
                            setSuccess(`Horas y configuración guardadas (${r.count || 0})`);
                            loadConfig();
                          } else setError("Error al guardar");
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
                      >
                        Guardar horas
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm("¿Borrar TODAS las asignaturas?")) return;
                          const resp = await apiFetch("/api/admin/subject-hours", { method: "DELETE" });
                          if (resp.ok) { setSubjectHours([]); setSuccess("Borrado exitoso"); }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Borrar todas
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(SUBJECT_OPTIONS || []).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedSubject(selectedSubject === opt.value ? null : opt.value)}
                          className={`px-2 py-1 rounded-xl text-[10px] uppercase font-black ${
                            selectedSubject === opt.value ? `${subjectColor(opt.value)} text-white` : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-6 gap-3 mb-4">
                      {[6, 7, 8, 9, 10, 11].map((g) => (
                        <div
                          key={g}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const subj = e.dataTransfer.getData("text/plain");
                            const idx = subjectHours.findIndex((r) => r.subject === subj && r.grade === g);
                            if (idx >= 0) {
                              const next = [...subjectHours];
                              next[idx].hours += 1;
                              setSubjectHours(next);
                            } else {
                              setSubjectHours([...subjectHours, { subject: subj, grade: g, hours: 1 }]);
                            }
                          }}
                          onClick={() => {
                            if (!selectedSubject) return;
                            const idx = subjectHours.findIndex((r) => r.subject === selectedSubject && r.grade === g);
                            if (idx >= 0) {
                              const next = [...subjectHours];
                              next[idx].hours += 1;
                              setSubjectHours(next);
                            } else {
                              setSubjectHours([...subjectHours, { subject: selectedSubject, grade: g, hours: 1 }]);
                            }
                          }}
                          className="min-h-24 p-3 border border-slate-200 rounded-xl cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold">Grado {g}</span>
                            <span className="text-[10px]">{(Array.isArray(subjectHours) ? subjectHours.filter(r => r && r.grade === g) : []).reduce((a,b)=>a+b.hours,0)}h</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(subjectHours) && subjectHours
                              .filter(r => r && r.grade === g)
                              .map((r, idx) => (
                              <div
                                key={`${r.subject}-${g}-${idx}`}
                                className={`flex items-center gap-1 px-2 py-1 rounded-xl ${subjectColor(r.subject)} text-white text-[10px] uppercase font-black`}
                                onMouseDown={() => {
                                  pressTimerRef.current = window.setTimeout(() => {
                                    setSubjectHours(subjectHours.filter(x => !(x.subject === r.subject && x.grade === g)));
                                  }, 2000);
                                }}
                                onMouseUp={() => { if(pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                              >
                                <span draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", r.subject)}>
                                  {SUBJECT_OPTIONS.find(o => o.value === r.subject)?.label}: {r.hours}h
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historial temporalmente deshabilitado para diagnóstico */}
                  {/* <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de cargas</h3>
                    {Array.isArray(history) && history.length === 0 ? <p className="text-sm">Sin registros.</p> : (
                      <ul className="space-y-2">
                        {(history || []).map((h, index) => h && (
                          <li key={h.id || index} className="border border-slate-200 rounded-xl p-3 text-sm">
                            Año {h.year} · Asignaciones: {Array.isArray(h?.snapshot) ? h.snapshot.length : 0} · {h?.created_at ? new Date(h.created_at).toLocaleString() : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div> */}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
