import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { ArrowLeft, Calendar, AlertCircle, Users } from "lucide-react";
import type { DailyAbsence } from "@/shared/types";
import { apiFetch } from "@/react-app/lib/api";

export default function SchoolAbsences() {
  const navigate = useNavigate();
  const [absences, setAbsences] = useState<DailyAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    fetchAbsences();
  }, [selectedDate]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setActiveYear(d?.active_year ?? null))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail || {};
      if (typeof d.active_year === "number") setActiveYear(d.active_year);
    };
    window.addEventListener("settings-updated", handler as any);
    return () => window.removeEventListener("settings-updated", handler as any);
  }, []);
  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/absences/daily?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setAbsences(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error("Error al cargar ausencias:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByCourse = absences.reduce((acc, absence) => {
    if (!acc[absence.course_name]) {
      acc[absence.course_name] = [];
    }
    acc[absence.course_name].push(absence);
    return acc;
  }, {} as Record<string, DailyAbsence[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a Mis Clases</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ausencias Escolares del Día
              </h1>
              <p className="text-gray-600">
                Estudiantes que no asistieron al colegio
              </p>
              {activeYear !== null && (
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                    Año lectivo: {activeYear}
                  </span>
                </div>
              )}
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Ausentes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {absences.length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cursos Afectados</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Object.keys(groupedByCourse).length}
                </p>
              </div>
              <Users className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Promedio por Curso</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Object.keys(groupedByCourse).length > 0
                    ? (
                        absences.length / Object.keys(groupedByCourse).length
                      ).toFixed(1)
                    : "0"}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : absences.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-indigo-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Excelente asistencia!
            </h3>
            <p className="text-gray-600">
              No hay estudiantes ausentes registrados para esta fecha
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCourse).map(([courseName, students]) => (
              <div
                key={courseName}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Encabezado del curso */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{courseName}</h3>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-2xl font-bold">
                        {students.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de estudiantes */}
                <div className="p-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {students.map((student) => (
                      <div
                        key={student.student_id}
                        className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-red-900">
                          {student.student_name}
                        </span>
                        {student.absence_count > 1 && (
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            {student.absence_count}x
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
