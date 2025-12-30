import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import Sidebar from "@/react-app/components/Sidebar";
import { Calendar, Clock, BookOpen, ChevronRight, AlertCircle, ClipboardList } from "lucide-react";
import type { TodayClass, DailyAbsence, AttendanceReport } from "@/shared/types";
import { apiFetch } from "@/react-app/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<DailyAbsence[]>([]);
  const [dailySummary, setDailySummary] = useState<{ present: number; absent: number; late: number; total: number }>({ present: 0, absent: 0, late: 0, total: 0 });
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [piarCount, setPiarCount] = useState<number>(0);
  const [weeklyTrend, setWeeklyTrend] = useState<Array<{ day: string; attendance: number }>>([]);
  const [coursePerformance, setCoursePerformance] = useState<Array<{ course: string; avg: number }>>([]);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodayClasses();
  }, []);

  const fetchTodayClasses = async () => {
    try {
      const response = await apiFetch("/api/teachers/today-classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
      const today = new Date().toISOString().split("T")[0];
      const absResp = await apiFetch(`/api/absences/daily?date=${today}`);
      if (absResp.ok) {
        const d = await absResp.json();
        const list = Array.isArray(d) ? d : (d?.data || []);
        setAbsences(list);
        if (d?.summary) {
          setDailySummary({
            present: Number(d.summary.present) || 0,
            absent: Number(d.summary.absent) || 0,
            late: Number(d.summary.late) || 0,
            total: Number(d.summary.total) || 0,
          });
        }
      }
      const repResp = await apiFetch(`/api/reports/daily?date=${today}`);
      if (repResp.ok) {
        const d = await repResp.json();
        setReports(d);
      }
      const meResp = await apiFetch("/api/teachers/profile");
      if (meResp.ok) {
        const me = await meResp.json();
        setTeacherName(me.name);
      }
      const studentsResp = await apiFetch("/api/students/all");
      if (studentsResp.ok) {
        const s = await studentsResp.json();
        const list = Array.isArray(s) ? s : [];
        setStudentsCount(list.length);
        setPiarCount(list.filter((x: any) => x.piar === 1 || x.has_piar === 1).length);
      }
      const days = Array.from({ length: 7 }).map((_v, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const trend: Array<{ day: string; attendance: number }> = [];
      for (const d of days) {
        const dateStr = d.toISOString().split("T")[0];
        const resp = await apiFetch(`/api/reports/daily?date=${dateStr}`);
        if (resp.ok) {
          const arr: AttendanceReport[] = await resp.json();
          const list = Array.isArray(arr) ? arr : [];
          const total = list.reduce((acc, r) => acc + (r.total_students || 0), 0);
          const present = list.reduce((acc, r) => acc + (r.present_count || 0), 0);
          const perc = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
          trend.push({
            day: d.toLocaleDateString("es-CO", { weekday: "short" }),
            attendance: perc,
          });
        } else {
          trend.push({
            day: d.toLocaleDateString("es-CO", { weekday: "short" }),
            attendance: 0,
          });
        }
      }
      setWeeklyTrend(trend);
      const perfMap = new Map<string, number[]>();
      for (const r of reports) {
        const key = r.course_name || "Sin curso";
        const arr = perfMap.get(key) || [];
        arr.push(r.attendance_percentage);
        perfMap.set(key, arr);
      }
      setCoursePerformance(
        Array.from(perfMap.entries()).map(([course, arr]) => ({
          course,
          avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
        }))
      );
    } catch (error) {
      console.error("Error al cargar clases:", error);
    } finally {
      setLoading(false);
    }
  };

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
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleClassClick = (scheduleId: number) => {
    navigate(`/attendance/${scheduleId}`);
  };

  const presentSum = useMemo(() => reports.reduce((acc, r) => acc + r.present_count, 0), [reports]);
  const totalStudentsSum = useMemo(() => reports.reduce((acc, r) => acc + r.total_students, 0), [reports]);
  const todayAttendancePerc = totalStudentsSum > 0 ? Math.round((presentSum / totalStudentsSum) * 1000) / 10 : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 capitalize">
                {formatDate()}
              </h1>
            </div>
          <p className="text-slate-600">{teacherName ? `Hola, ${teacherName}.` : "Tus clases programadas para hoy"}</p>
          {activeYear !== null && (
            <div className="mt-1">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                Año lectivo: {activeYear}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 hover:scale-[1.02] transition duration-300">
            <p className="text-sm text-slate-600 mb-1">Matrícula Total</p>
            <p className="text-3xl font-black text-slate-800">{studentsCount}</p>
          </div>
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 hover:scale-[1.02] transition duration-300">
            <p className="text-sm text-slate-600 mb-1">Asistencia Hoy</p>
            <p className="text-3xl font-black text-slate-800">{todayAttendancePerc}%</p>
          </div>
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 hover:scale-[1.02] transition duration-300">
            <p className="text-sm text-slate-600 mb-1">Alertas Críticas</p>
            <p className="text-3xl font-black text-slate-800">
              {dailySummary.absent}
            </p>
          </div>
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 hover:scale-[1.02] transition duration-300">
            <p className="text-sm text-slate-600 mb-1">Población PIAR</p>
            <p className="text-3xl font-black text-slate-800">{piarCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 lg:col-span-2">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 mb-4">
              Tendencia semanal de asistencia
            </h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" stroke="#4f46e5" fill="url(#attendanceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 mb-4">
              Rendimiento por grados
            </h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-indigo-100">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes clases hoy
            </h3>
            <p className="text-gray-600">
              Disfruta tu día libre o revisa los reportes de días anteriores
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <button
                key={classItem.schedule_id}
                onClick={() => handleClassClick(classItem.schedule_id)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-100 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {classItem.subject_name}
                    </h3>
                    <p className="text-gray-600 font-medium">{classItem.course_name}</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>

                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {classItem.start_time} - {classItem.end_time}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-indigo-600 font-semibold group-hover:text-indigo-700">
                    Tomar asistencia →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => navigate("/reports")}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-100 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Ver Reportes de Asistencia
                  </h3>
                  <p className="text-sm text-gray-600">
                    Consulta estadísticas y exporta datos
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate("/school-absences")}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-red-100 hover:shadow-xl hover:border-red-300 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    Ausencias del Colegio
                  </h3>
                  <p className="text-sm text-gray-600">
                    Estudiantes ausentes del día
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-red-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate("/manual-attendance")}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl hover:border-green-300 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group md:col-span-2"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    Registro Manual de Asistencia
                  </h3>
                  <p className="text-sm text-gray-600">
                    Registra asistencia por fecha y asignatura
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
            </button>
          </div>
        )}

        <div className="mt-10 bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 mb-4">
            Actividad y Alertas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-800 mb-2">
                Novedades de Hoy
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {absences.map((a) => (
                  <div key={`${a.student_id}-${a.absence_count}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl">
                    <div>
                      <p className="text-slate-800 font-semibold">{a.student_name}</p>
                      <p className="text-slate-500 text-sm">{a.course_name}</p>
                    </div>
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded-xl hover:scale-[1.02] transition">
                      Llamar Acudiente
                    </button>
                  </div>
                ))}
                {absences.length === 0 && <p className="text-slate-500">Sin novedades</p>}
              </div>
            </div>
            <div className="md:col-span-1">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-800 mb-2">
                Alertas de Rendimiento
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                <p className="text-slate-500">Sin alertas</p>
              </div>
            </div>
            <div className="md:col-span-1">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-800 mb-2">
                Últimas Observaciones
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                <p className="text-slate-500">Sin observaciones</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
