import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { CalendarDays, BookOpen } from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";

type TodayClass = {
  schedule_id: number;
  subject_id: number;
  course_id: number;
  subject_name: string;
  hours_per_week?: number;
};

export default function MyClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiFetch("/api/teachers/today-classes");
      if (resp.ok) {
        const arr = await resp.json();
        setClasses(Array.isArray(arr) ? arr : []);
      } else {
        setClasses([]);
      }
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mis Clases de Hoy</h1>
          <p className="text-gray-600">Selecciona una clase para registrar asistencia</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(classes) ? classes : []).map((c) => (
              <button
                key={c.schedule_id}
                onClick={() => navigate(`/asistencia/${c.schedule_id}`)}
                className="text-left bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-200 hover:shadow-xl hover:bg-white transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Horario #{c.schedule_id}</span>
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-gray-900">{c.subject_name}</span>
                </div>
                {c.hours_per_week && (
                  <p className="text-xs text-gray-600 mt-1">Intensidad: {c.hours_per_week}h/semana</p>
                )}
              </button>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-600">
                Sin clases programadas para hoy.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
