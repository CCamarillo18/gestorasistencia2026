import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { ArrowLeft, CheckCircle2, XCircle, Users, AlertTriangle, Clock } from "lucide-react";
import type { TodayClass } from "@/shared/types";
import { apiFetch } from "@/react-app/lib/api";

export default function Attendance() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<TodayClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoursCount, setHoursCount] = useState(1);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [scheduleId]);

  const fetchStudents = async () => {
    try {
      // Obtener información de la clase
      const classesResponse = await apiFetch("/api/teachers/today-classes");
      if (classesResponse.ok) {
        const classes = await classesResponse.json();
        const currentClass = classes.find(
          (c: TodayClass) => c.schedule_id === parseInt(scheduleId!)
        );
        if (currentClass) {
          setClassInfo(currentClass);
        }
      }

      // Obtener estudiantes
      const response = await apiFetch(`/api/classes/${scheduleId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.map((s: any) => ({ ...s, status: "present", observations: "" })));
      } else {
        setError("No se pudo cargar la lista de estudiantes");
      }
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId: number, status: "present" | "absent" | "late") => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setAlertMessage(null);

    try {
      const todayRecords = students.map((s) => ({ student_id: s.id, status: s.status, observations: s.observations || "" }));

      const today = new Date().toISOString().split("T")[0];

      // Necesitamos obtener el subject_id del schedule
      // Por ahora, usaremos una llamada adicional o lo incluiremos en la respuesta original
      // Para simplificar, asumiremos que tenemos esta información
      const response = await apiFetch("/api/attendance/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject_id: classInfo?.subject_id,
          course_id: classInfo?.course_id,
          date: today,
          hours_count: hoursCount,
          records: todayRecords,
        }),
      });

      if (response.ok) {
        await response.json();
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Error al registrar asistencia");
      }
    } catch (error) {
      console.error("Error al enviar asistencia:", error);
      setError("Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const totalCount = students.length;
  const attendancePercentage =
    totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a Mis Clases</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Asistencia
          </h1>
          <p className="text-gray-600">
            Marca los estudiantes ausentes. Los no marcados se registrarán como
            presentes.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto">
            <div className="min-w-[160px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="text-xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="min-w-[160px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 mb-1">Presentes</p>
                  <p className="text-xl font-bold text-green-900">{presentCount}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="min-w-[160px] bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700 mb-1">Ausentes</p>
                  <p className="text-xl font-bold text-red-900">{absentCount}</p>
                </div>
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="min-w-[160px] bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 mb-1">Tardanzas</p>
                  <p className="text-xl font-bold text-amber-900">{lateCount}</p>
                </div>
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Asistencia
            </span>
            <span className="text-sm font-bold text-gray-900">
              {attendancePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                attendancePercentage >= 80
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : attendancePercentage >= 50
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                  : "bg-gradient-to-r from-red-500 to-rose-600"
              }`}
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">
                Asistencia registrada exitosamente
              </p>
              {alertMessage && (
                <div className="mt-2 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-700 text-sm">{alertMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de estudiantes */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Horas de clase</p>
                <select
                  value={hoursCount}
                  onChange={(e) => setHoursCount(parseInt(e.target.value))}
                  className="mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                >
                  {[1,2,3,4,5,6].map((h) => (
                    <option key={h} value={h}>{h} hora{h > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {(Array.isArray(students) ? students : []).map((student) => (
                  <div key={student.id} className="w-full px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm sm:text-base text-gray-900">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                      <div className="flex bg-slate-100 rounded-xl overflow-hidden w-full sm:w-auto">
                        {["present","absent","late"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setStatus(student.id, opt as any)}
                            className={`flex-1 px-3 py-2 text-sm ${student.status === opt ? "bg-white text-slate-900" : "text-slate-600"}`}
                          >
                            {opt === "present" ? "P" : opt === "absent" ? "A" : "T"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botón de envío */}
        {!loading && !success && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </span>
              ) : (
                "Enviar Reporte de Asistencia"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
