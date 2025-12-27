import { useEffect, useState } from "react";
import Navbar from "@/react-app/components/Navbar";
import Sidebar from "@/react-app/components/Sidebar";
import TeacherCard from "@/react-app/components/TeacherCard";
import TeacherAssignModal from "@/react-app/components/TeacherAssignModal";
import { supabase } from "@/react-app/lib/supabase";
import { Plus } from "lucide-react";

type TeacherRow = {
  id: string;
  nombre: string;
  email: string;
  roles: any;
  tutorDe: string;
  cargaAcademica: Record<string, string[]>;
};

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [hoursMap, setHoursMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRow | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherRow | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail || {};
      if (typeof d.active_year === "number") setActiveYear(d.active_year);
    };
    window.addEventListener("settings-updated", handler as any);
    return () => window.removeEventListener("settings-updated", handler as any);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { data: auth } = await supabase.auth.getUser();
    const userEmail = auth?.user?.email || null;
    const { data: tRows, error: terr } = await supabase.from("teachers").select("*").order("nombre", { ascending: true });
    if (terr) {
      setError("No se pudo cargar docentes. Ejecuta migrations/teacher_module.sql en Supabase.");
    }
    const { data: confRows, error: cerr } = await supabase.from("subject_config").select("*");
    if (cerr) {
      setError("No se pudo cargar configuración de materias. Ejecuta migrations/teacher_module.sql en Supabase.");
    }
    const map: Record<string, number> = {};
    (confRows || []).forEach((r: any) => (map[r.materia] = r.horas));
    setHoursMap(map);
    const list = (tRows || []) as any;
    setTeachers(list);
    if (userEmail) {
      const me = list.find((t: any) => t.email === userEmail);
      const roles = Array.isArray(me?.roles) ? me.roles : typeof me?.roles === "string" ? (() => { try { return JSON.parse(me.roles); } catch { return []; } })() : [];
      setCanManage(roles.includes("Admin.") || roles.includes("Coord."));
    } else {
      setCanManage(false);
    }
    const s = await fetch("/api/admin/settings");
    if (s.ok) {
      const d = await s.json();
      setActiveYear(d.active_year);
    }
    setLoading(false);
  };

  const openAssign = (t: TeacherRow) => {
    setSelectedTeacher(t);
    setAssignOpen(true);
  };

  const saveCarga = async (carga: Record<string, string[]>) => {
    if (!selectedTeacher) return;
    await supabase.from("teachers").update({ cargaAcademica: carga }).eq("id", selectedTeacher.id);
    setAssignOpen(false);
    await loadData();
  };

  const openAdd = () => {
    setFormNombre("");
    setFormEmail("");
    setAddOpen(true);
  };
  const saveAdd = async () => {
    await supabase.from("teachers").insert({ nombre: formNombre, email: formEmail, roles: JSON.stringify(["Prof."]), tutorDe: "NO", cargaAcademica: {} });
    setAddOpen(false);
    await loadData();
  };
  const openEdit = (t: TeacherRow) => {
    setEditTeacher(t);
    setFormNombre(t.nombre);
    setFormEmail(t.email);
    setEditOpen(true);
  };
  const saveEdit = async () => {
    if (!editTeacher) return;
    await supabase.from("teachers").update({ nombre: formNombre, email: formEmail }).eq("id", editTeacher.id);
    setEditOpen(false);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">Gestión de Docentes</h1>
            {canManage && (
              <button onClick={openAdd} className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Añadir Docente
              </button>
            )}
          </div>
          {activeYear !== null && (
            <div className="mb-4">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                Año lectivo: {activeYear}
              </span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-20 text-center text-slate-600">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t as any} hoursMap={hoursMap} onOpenAssign={openAssign} onEdit={openEdit} canManage={canManage} />
              ))}
              {teachers.length === 0 && !error && (
                <div className="col-span-full py-20 text-center text-slate-500">
                  Sin docentes. Ejecuta el seed en migrations/teacher_module.sql.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <TeacherAssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        teacher={selectedTeacher}
        onSave={saveCarga}
      />
      {addOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6">
            <h3 className="text-xl font-black text-slate-800 mb-4">Añadir Docente</h3>
            <div className="mb-3">
              <label className="text-sm text-slate-700">Nombre</label>
              <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2" />
            </div>
            <div className="mb-3">
              <label className="text-sm text-slate-700">Correo</label>
              <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800">Cancelar</button>
              <button onClick={saveAdd} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}
      {editOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6">
            <h3 className="text-xl font-black text-slate-800 mb-4">Editar Docente</h3>
            <div className="mb-3">
              <label className="text-sm text-slate-700">Nombre</label>
              <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2" />
            </div>
            <div className="mb-3">
              <label className="text-sm text-slate-700">Correo</label>
              <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800">Cancelar</button>
              <button onClick={saveEdit} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

