import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { ArrowLeft, CheckCircle2, XCircle, Users, AlertTriangle, Clock } from "lucide-react";
import type { StudentWithAttendance, TodayClass } from "@/shared/types";
import { apiFetch } from "@/react-app/lib/api";

export default function Attendance() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [classInfo, setClassInfo] = useState<TodayClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
        setStudents(data.map((s: StudentWithAttendance) => ({ ...s, is_absent: false })));
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

  const toggleAbsent = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, is_absent: !s.is_absent } : s
      )
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setAlertMessage(null);

    try {
      // Obtener clase actual para subject_id
      const classResponse = await apiFetch(`/api/classes/${scheduleId}/students`);
      if (!classResponse.ok) {
        throw new Error("No se pudo obtener información de la clase");
      }

      const absentStudentIds = students
        .filter((s) => s.is_absent)
        .map((s) => s.id);

      const today = new Date().toISOString().split("T")[0];

      // Necesitamos obtener el subject_id del schedule
      // Por ahora, usaremos una llamada adicional o lo incluiremos en la respuesta original
      // Para simplificar, asumiremos que tenemos esta información
      const todayClassesResponse = await apiFetch("/api/teachers/today-classes");
      const todayClasses = await todayClassesResponse.json();
      const currentClass = todayClasses.find(
        (c: { schedule_id: number }) => c.schedule_id === parseInt(scheduleId!)
      );

      if (!currentClass) {
        throw new Error("No se encontró la clase");
      }

      const response = await apiFetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject_id: currentClass.subject_id,
          schedule_id: parseInt(scheduleId!),
          attendance_date: today,
          absent_student_ids: absentStudentIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(true);
        if (result.alert) {
          setAlertMessage(result.alert);
        }
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al registrar asistencia");
      }
    } catch (error) {
      console.error("Error al enviar asistencia:", error);
      setError("Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => !s.is_absent).length;
  const absentCount = students.filter((s) => s.is_absent).length;
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

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Presentes</p>
                <p className="text-2xl font-bold text-green-900">{presentCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Ausentes</p>
                <p className="text-2xl font-bold text-red-900">{absentCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Intensidad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classInfo?.hours_per_week || 1}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-indigo-400" />
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => toggleAbsent(student.id)}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    student.is_absent ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        student.is_absent
                          ? "bg-red-500 border-red-500"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {student.is_absent && (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        student.is_absent
                          ? "text-red-900"
                          : "text-gray-900"
                      }`}
                    >
                      {student.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      student.is_absent
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {student.is_absent ? "Ausente" : "Presente"}
                  </span>
                </button>
              ))}
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
