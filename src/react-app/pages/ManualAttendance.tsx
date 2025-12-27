import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import type { Subject, Student, AbsenceEntry } from "@/shared/types";

export default function ManualAttendance() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [absenceEntries, setAbsenceEntries] = useState<AbsenceEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state for new entry
  const [newStudentName, setNewStudentName] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newHoursCount, setNewHoursCount] = useState<number>(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all subjects (not just teacher's subjects)
      const subjectsResponse = await fetch("/api/subjects/all");
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);
      }

      // Fetch all students
      const studentsResponse = await fetch("/api/students/all");
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setAllStudents(studentsData);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAbsenceEntry = () => {
    if (!newStudentName.trim() || !newSubjectId || newHoursCount < 1) {
      setError("Por favor completa todos los campos");
      return;
    }

    const subject = subjects.find((s) => s.id === newSubjectId);
    if (!subject) return;

    const newEntry: AbsenceEntry = {
      id: Date.now().toString(),
      student_name: newStudentName.trim(),
      subject_id: newSubjectId,
      subject_name: subject.name,
      hours_count: newHoursCount,
    };

    setAbsenceEntries([...absenceEntries, newEntry]);
    setNewStudentName("");
    setNewSubjectId(null);
    setNewHoursCount(1);
    setError(null);
  };

  const removeEntry = (entryId: string) => {
    setAbsenceEntries(absenceEntries.filter((e) => e.id !== entryId));
  };

  const handleSubmit = async () => {
    if (absenceEntries.length === 0) {
      setError("Agrega al menos una ausencia antes de enviar");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const entries = absenceEntries.map((entry) => ({
        student_name: entry.student_name,
        subject_id: entry.subject_id,
        attendance_date: selectedDate,
        hours_count: entry.hours_count,
      }));

      const response = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries }),
      });

      if (response.ok) {
        setSuccess(true);
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
            Registro Manual de Asistencia
          </h1>
          <p className="text-gray-600">
            Registra ausencias individuales con estudiante, asignatura y horas
          </p>
        </div>

        {/* Selector de fecha */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de las ausencias
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Formulario para agregar ausencia */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agregar Ausencia
          </h3>

          <div className="grid gap-4">
            {/* Nombre del estudiante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Estudiante
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  list="students-list"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Escribe o selecciona el nombre"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <datalist id="students-list">
                  {allStudents.map((student) => (
                    <option key={student.id} value={student.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Asignatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignatura
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={newSubjectId || ""}
                  onChange={(e) => setNewSubjectId(parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Selecciona una asignatura</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cantidad de horas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Horas
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={newHoursCount}
                onChange={(e) => setNewHoursCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Botón agregar */}
            <button
              onClick={addAbsenceEntry}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Ausencia</span>
            </button>
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
            <p className="text-green-800 font-medium">
              Asistencia registrada exitosamente
            </p>
          </div>
        )}

        {/* Lista de ausencias agregadas */}
        {absenceEntries.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <span>Ausencias Registradas</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {absenceEntries.length}
                </span>
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {absenceEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {entry.student_name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Asignatura:</span>{" "}
                        {entry.subject_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Horas:</span>{" "}
                        {entry.hours_count}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de envío */}
        {absenceEntries.length > 0 && !success && (
          <div className="flex justify-end">
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
                "Registrar Todas las Ausencias"
              )}
            </button>
          </div>
        )}

        {/* Mensaje cuando no hay ausencias */}
        {absenceEntries.length === 0 && !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-indigo-100">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay ausencias registradas
            </h3>
            <p className="text-gray-600">
              Usa el formulario de arriba para agregar ausencias individuales
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
