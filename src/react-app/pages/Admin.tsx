import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/lib/api";
import { ArrowLeft, Users, Cog, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import type { Student, Course } from "@/shared/types";

type TabType = "students" | "config";

// interfaz no usada eliminada

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("config");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [termsCount, setTermsCount] = useState<number>(3);
  const [subjectHours, setSubjectHours] = useState<Array<{subject:string;grade:number;hours:number}>>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{year:number;vigente:boolean;grados_6_9:Array<{subject:string;hours:number}>;grados_10_11:Array<{subject:string;hours:number}>}>>([]);
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
  const pressTargetRef = useRef<{ subject: string; grade: number } | null>(null);

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
  // estado de profesores eliminado

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [studentForm, setStudentForm] = useState({ name: "", course_id: 0 });

  // Attendance state eliminado (no usado)

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

  // carga de profesores eliminada

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

  // Eliminado: carga de registros de asistencia no usada

  const loadConfig = async () => {
    setLoading(true);
    try {
      const s = await apiFetch("/api/admin/settings");
      if (s.ok) {
        const d = await s.json();
        setActiveYear(d.active_year);
        setTermsCount(d.terms_count);
      }
      const h = await apiFetch("/api/admin/subject-hours");
      if (h.ok) {
        const arr = await h.json();
        setSubjectHours(arr);
      }
      const hist = await apiFetch("/api/admin/config-store/history");
      if (hist.ok) {
        const arr = await hist.json();
        setHistory(arr);
      }
      // perfil de profesor omitido
      setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", () => setIsMobile(window.innerWidth < 768));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // manejo de profesores eliminado

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

  // Eliminado: borrado de registro de asistencia no usado

  // inicio de edición de profesor eliminado

  const startEditStudent = (student: Student) => {
    setEditingStudent(student.id);
    setStudentForm({
      name: student.name,
      course_id: student.course_id,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona profesores, estudiantes y registros de asistencia
          </p>
        </div>

        {/* Messages */}
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

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "config"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Cog className="w-4 h-4" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "students"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Estudiantes</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Eliminado: pestaña de profesores */}

            {/* Students Tab */}
            {activeTab === "students" && (
              <>
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => navigate("/admin/import-students")}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Importar desde CSV</span>
                  </button>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <div key={student.id} className="p-6">
                      {editingStudent === student.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={studentForm.name}
                            onChange={(e) =>
                              setStudentForm({ ...studentForm, name: e.target.value })
                            }
                            placeholder="Nombre"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          />
                          <select
                            value={studentForm.course_id}
                            onChange={(e) =>
                              setStudentForm({
                                ...studentForm,
                                course_id: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          >
                            <option value={0}>Selecciona un curso</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateStudent(student.id)}
                              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              <span>Guardar</span>
                            </button>
                            <button
                              onClick={() => setEditingStudent(null)}
                              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Curso: {getCourseNameById(student.course_id)}
                            </p>
                            {student.phone && (
                              <p className="text-xs text-gray-500 mt-1">
                                Tel: {student.phone}
                              </p>
                            )}
                            {student.guardian_name && (
                              <p className="text-xs text-gray-500">
                                Acudiente: {student.guardian_name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditStudent(student)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}

            {/* Attendance removed */}

            {/* Config Tab */}
            {activeTab === "config" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Año lectivo y periodos</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-700">Año lectivo</label>
                      <input
                        type="number"
                        min={new Date().getFullYear() - 1}
                        max={new Date().getFullYear() + 5}
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
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
                          setSuccess(r.warning ? r.warning : `Horas y configuración guardadas (${r.count})`);
                          const d = { active_year: activeYear, terms_count: termsCount };
                          window.dispatchEvent(new CustomEvent("settings-updated", { detail: d }));
                          try {
                            const hh = await apiFetch("/api/admin/subject-hours");
                            if (hh.ok) {
                              setSubjectHours(await hh.json());
                            }
                            const hist = await apiFetch("/api/admin/config-store/history");
                            if (hist.ok) {
                              setHistory(await hist.json());
                            }
                          } catch {}
                        } else setError("Error al guardar");
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Guardar horas
                    </button>
                    <button
                      onClick={async () => {
                        const ok = window.confirm("¿Borrar TODAS las asignaturas y horas en todos los grados?");
                        if (!ok) return;
                        const resp = await apiFetch("/api/admin/subject-hours", { method: "DELETE" });
                        if (resp.ok) {
                          setSubjectHours([]);
                          setSuccess("Se borraron todas las asignaturas");
                        } else {
                          setError("No se pudo borrar");
                        }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Borrar todas
                    </button>
                  </div>
                  <p className="text-gray-600 mb-3">Selecciona una asignatura y pulsa en un grado para sumar horas. Usa Guardar para persistir.</p>
                  {isMobile && (
                    <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                      Esta configuración solo se realiza en PC.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SUBJECT_OPTIONS.map((opt) => {
                      const isSel = selectedSubject === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedSubject(isSel ? null : opt.value)}
                          className={`px-2 py-1 rounded-xl text-[10px] uppercase font-black ${
                            isSel ? `${subjectColor(opt.value)} text-white` : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-6 gap-3 mb-4">
                    {[6,7,8,9,10,11].map((g) => (
                      <div
                        key={g}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const subj = e.dataTransfer.getData("text/plain");
                          const idx = subjectHours.findIndex((r) => r.subject === subj && r.grade === g);
                          if (idx >= 0) {
                            const next = [...subjectHours];
                            next[idx] = { ...next[idx], hours: next[idx].hours + 1 };
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
                            next[idx] = { ...next[idx], hours: next[idx].hours + 1 };
                            setSubjectHours(next);
                          } else {
                            setSubjectHours([...subjectHours, { subject: selectedSubject, grade: g, hours: 1 }]);
                          }
                        }}
                        className="min-h-24 p-3 border border-slate-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Grado {g}</span>
                          <span className="text-[10px] text-slate-500">
                            Total: {subjectHours.filter((r) => r.grade === g).reduce((a,b) => a + b.hours, 0)} h
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {subjectHours.filter((r) => r.grade === g).map((r) => (
                            <div
                              key={`${r.subject}-${g}`}
                              className={`flex items-center gap-1 px-2 py-1 rounded-xl ${subjectColor(r.subject)} text-white text-[10px] uppercase font-black`}
                              onMouseDown={() => {
                                pressTargetRef.current = { subject: r.subject, grade: g };
                                pressTimerRef.current = window.setTimeout(() => {
                                  const next = subjectHours.filter((x) => !(x.subject === r.subject && x.grade === g));
                                  setSubjectHours(next);
                                  pressTimerRef.current = null;
                                  pressTargetRef.current = null;
                                }, 3000);
                              }}
                              onMouseUp={() => {
                                if (pressTimerRef.current) {
                                  clearTimeout(pressTimerRef.current);
                                  pressTimerRef.current = null;
                                  pressTargetRef.current = null;
                                }
                              }}
                              onMouseLeave={() => {
                                if (pressTimerRef.current) {
                                  clearTimeout(pressTimerRef.current);
                                  pressTimerRef.current = null;
                                  pressTargetRef.current = null;
                                }
                              }}
                              onTouchStart={() => {
                                pressTargetRef.current = { subject: r.subject, grade: g };
                                pressTimerRef.current = window.setTimeout(() => {
                                  const next = subjectHours.filter((x) => !(x.subject === r.subject && x.grade === g));
                                  setSubjectHours(next);
                                  pressTimerRef.current = null;
                                  pressTargetRef.current = null;
                                }, 3000);
                              }}
                              onTouchEnd={() => {
                                if (pressTimerRef.current) {
                                  clearTimeout(pressTimerRef.current);
                                  pressTimerRef.current = null;
                                  pressTargetRef.current = null;
                                }
                              }}
                            >
                              <span draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", r.subject)} className="leading-tight">
                                {SUBJECT_OPTIONS.find((o) => o.value === r.subject)?.label || r.subject}: {r.hours}h
                              </span>
                              <>
                                <div className="flex flex-col">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = subjectHours.map((x) =>
                                        x.subject === r.subject && x.grade === g ? { ...x, hours: x.hours + 1 } : x
                                      );
                                      setSubjectHours(next);
                                    }}
                                    className="bg-white/20 rounded px-1"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = subjectHours.map((x) =>
                                        x.subject === r.subject && x.grade === g ? { ...x, hours: Math.max(0, x.hours - 1) } : x
                                      );
                                      setSubjectHours(next);
                                    }}
                                    className="bg-white/20 rounded px-1"
                                  >
                                    –
                                  </button>
                                </div>
                              </>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      const resp = await apiFetch("/api/admin/config-store/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ settings: { active_year: activeYear, terms_count: termsCount }, subject_hours: subjectHours }),
                      });
                      if (resp.ok) {
                        const r = await resp.json();
                        setSuccess(r.warning ? r.warning : `Horas y configuración guardadas (${r.count})`);
                        const d = { active_year: activeYear, terms_count: termsCount };
                        window.dispatchEvent(new CustomEvent("settings-updated", { detail: d }));
                        // Reload history and subject hours
                        try {
                          const hh = await apiFetch("/api/admin/subject-hours");
                          if (hh.ok) {
                            setSubjectHours(await hh.json());
                          }
                          const hist = await apiFetch("/api/admin/config-store/history");
                          if (hist.ok) {
                            setHistory(await hist.json());
                          }
                        } catch {}
                      } else setError("Error al guardar");
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Guardar horas
                  </button>
                  </div>
                </div>
                <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de cargas de asignaturas</h3>
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-600">Sin perfiles guardados todavía. Usa “Guardar horas” para registrar el perfil de este año.</p>
                  ) : (
                    <div className="space-y-4">
                      {history.map((h) => (
                        <div key={h.year} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-800">Año {h.year}</span>
                            {h.vigente && (
                              <span className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-semibold">Perfil vigente</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-700 mb-2">Grados 6–9</h4>
                              <div className="flex flex-wrap gap-2">
                                {h.grados_6_9.map((r) => (
                                  <span key={`6-9-${r.subject}`} className="px-2 py-1 rounded-xl bg-slate-100 text-slate-800 text-[10px] uppercase font-black">
                                    {r.subject}: {r.hours}h
                                  </span>
                                ))}
                                {h.grados_6_9.length === 0 && <span className="text-[10px] text-slate-500">Sin datos</span>}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-700 mb-2">Grados 10–11</h4>
                              <div className="flex flex-wrap gap-2">
                                {h.grados_10_11.map((r) => (
                                  <span key={`10-11-${r.subject}`} className="px-2 py-1 rounded-xl bg-slate-100 text-slate-800 text-[10px] uppercase font-black">
                                    {r.subject}: {r.hours}h
                                  </span>
                                ))}
                                {h.grados_10_11.length === 0 && <span className="text-[10px] text-slate-500">Sin datos</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
