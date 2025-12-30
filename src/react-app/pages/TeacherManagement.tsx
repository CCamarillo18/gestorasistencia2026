import { useEffect, useState } from "react";
import Navbar from "@/react-app/components/Navbar";
import Sidebar from "@/react-app/components/Sidebar";
import { apiFetch } from "@/react-app/lib/api";
import { subjectBadge } from "@/react-app/lib/subjects";
import { X, Plus, UserPlus, Save, Edit, Settings2, GraduationCap, FileText, Database } from "lucide-react";

type TeacherRow = {
  id: number;
  nombre: string;
  email: string;
};

const COURSE_NAMES = [
  "6A", "6B", "6C", "7A", "7B", "7C", "8A", "8B", "8C", 
  "9A", "9B", "9C", "10A", "10B", "10C", "11A", "11B", "11C"
];

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherRow | null>(null);
  const [formData, setFormData] = useState({ nombre: "", email: "" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeCourseName, setActiveCourseName] = useState("6A");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [resT, resS, resC] = await Promise.all([
        apiFetch("/api/admin/teachers"),
        apiFetch("/api/admin/subjects"),
        apiFetch("/api/admin/courses")
      ]);
      
      if (resT.ok) setTeachers(await resT.json());
      if (resS.ok) {
        const sData = await resS.json();
        setSubjectsList(Array.isArray(sData) ? sData : []);
      }
      if (resC.ok) setCourses(await resC.json());
    } catch (err) { 
      console.error("Error cargando datos:", err); 
    }
  };

  const handleBootstrap = async () => {
    if (!confirm("Esto creará la malla de asignaturas para todos los cursos. ¿Continuar?")) return;
    const r = await apiFetch("/api/admin/subjects/bootstrap", { method: "POST" });
    if (r.ok) { 
      alert("Malla curricular creada exitosamente"); 
      await loadData(); 
    }
  };

  const openModal = (t: TeacherRow | null = null) => {
    if (t) {
      setEditTeacher(t);
      setFormData({ nombre: t.nombre, email: t.email });
      const current = subjectsList
        .filter(s => s.teacher_id === t.id)
        .map(s => s.id);
      setSelectedIds(current);
    } else {
      setEditTeacher(null);
      setFormData({ nombre: "", email: "" });
      setSelectedIds([]);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let tId = editTeacher?.id;
      const res = await apiFetch(editTeacher ? `/api/admin/teachers/${tId}` : "/api/admin/teachers", {
        method: editTeacher ? "PUT" : "POST",
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error();
      if (!editTeacher) {
        const saved = await res.json();
        tId = saved.id;
      }

      await apiFetch("/api/admin/subjects/assign-teacher", {
        method: "PUT",
        body: JSON.stringify({ teacher_id: tId, subject_ids: selectedIds })
      });

      setModalOpen(false);
      loadData();
      alert("Carga académica actualizada con éxito");
    } catch (e) { 
      alert("Error al guardar los cambios"); 
    }
  };

  // Lógica de filtrado para el Modal
  const currentCourse = courses.find(c => String(c.name).trim() === activeCourseName);
  const currentCourseId = currentCourse ? currentCourse.id : null;

  const filteredSubjects = subjectsList.filter(s => 
    currentCourseId !== null && Number(s.course_id) === Number(currentCourseId)
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex text-[#37352F]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">Carga Docente</h1>
              {subjectsList.length === 0 && (
                <button onClick={handleBootstrap} className="mt-2 flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-xl font-bold text-xs hover:bg-orange-100 transition-all animate-pulse">
                  <Database size={14} /> Base de datos vacía: Crear Malla
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => alert("Preparando PDF...")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 transition">
                <FileText size={18} /> Generar PDF
              </button>
              <button onClick={() => openModal()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                <Plus size={20} /> Nuevo Docente
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><UserPlus size={24} /></div>
                  <button onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16}/></button>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">{t.nombre}</h3>
                <p className="text-slate-400 text-[10px] mb-6 font-mono uppercase tracking-wider italic">{t.email}</p>
                
                {/* CAMBIO: Chips con nombre de curso incluido */}
                <div className="flex flex-wrap gap-1.5 mb-8 min-h-[40px] content-start">
                  {subjectsList
                    .filter(s => s.teacher_id === t.id)
                    .map((s) => {
                      const courseName = courses.find(c => c.id === s.course_id)?.name || "";
                      return (
                        <span key={s.id} className={`px-2 py-1 rounded-lg text-white text-[9px] font-bold shadow-sm flex items-center gap-1 ${subjectBadge(s.name).colorClass}`}>
                          {s.name}
                          <span className="opacity-60 font-black border-l border-white/30 pl-1">{courseName}</span>
                        </span>
                      );
                    })}
                </div>

                <button onClick={() => openModal(t)} className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                  <Settings2 size={14} /> Gestionar Carga
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border">
            <header className="p-8 border-b flex justify-between items-center bg-[#FBFBFA]">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><GraduationCap size={24}/></div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">Asignación de Materias</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={28}/></button>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-28 bg-slate-50 border-r overflow-y-auto p-2 space-y-1">
                {COURSE_NAMES.map(c => (
                  <button key={c} onClick={() => setActiveCourseName(c)} className={`w-full py-3 rounded-xl text-[10px] font-black transition-all ${activeCourseName === c ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:bg-slate-200'}`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Docente</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((s) => {
                      const isSelected = selectedIds.includes(s.id);
                      const badge = subjectBadge(s.name);
                      return (
                        <button key={s.id} onClick={() => setSelectedIds(prev => isSelected ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                          className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${isSelected ? `${badge.colorClass} text-white shadow-lg scale-105 border-transparent` : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}>
                          {/* CAMBIO: Label dentro del botón con curso y área */}
                          <div className="text-[8px] font-black uppercase mb-1 opacity-70">{activeCourseName} • {s.area || 'GENERAL'}</div>
                          <div className="text-[11px] font-bold leading-tight">{s.name}</div>
                          {isSelected && <div className="absolute top-2 right-2 bg-white/20 rounded-full p-0.5"><Save size={10}/></div>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-slate-400 text-sm font-medium italic">No hay asignaturas en {activeCourseName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="p-8 border-t flex justify-end gap-3 bg-white">
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cerrar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all transform active:scale-95">
                <Save size={18} className="inline mr-2" /> Guardar Todo
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}