import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/lib/api";
import {
  ArrowLeft,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
} from "lucide-react";
import type { AttendanceReport } from "@/shared/types";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
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
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/reports/daily?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiFetch(
        `/api/reports/export/csv?date=${selectedDate}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asistencia_${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error al exportar CSV:", error);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "from-green-500 to-emerald-600";
    if (percentage >= 75) return "from-blue-500 to-indigo-600";
    if (percentage >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-600";
  };

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 75) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

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
                Reportes de Asistencia
              </h1>
              <p className="text-gray-600">
                Consulta y exporta registros de asistencia
              </p>
              {activeYear !== null && (
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                    Año lectivo: {activeYear}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-indigo-100">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay reportes para esta fecha
            </h3>
            <p className="text-gray-600">
              Selecciona otra fecha o toma asistencia en tus clases
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Encabezado del reporte */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">
                        {report.course_name}
                      </h3>
                      <p className="text-indigo-100">{report.subject_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAttendanceIcon(report.attendance_percentage)}
                      <span className="text-3xl font-bold">
                        {report.attendance_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {report.total_students}
                    </p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {report.present_count}
                    </p>
                    <p className="text-sm text-gray-600">Presentes</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      {report.absent_count}
                    </p>
                    <p className="text-sm text-gray-600">Ausentes</p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${getAttendanceColor(
                        report.attendance_percentage
                      )}`}
                      style={{ width: `${report.attendance_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Estudiantes ausentes */}
                {report.absent_count > 0 && (
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Estudiantes Ausentes ({report.absent_count})</span>
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {report.absent_students.map((student) => (
                        <div
                          key={student.id}
                          className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-900"
                        >
                          {student.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
