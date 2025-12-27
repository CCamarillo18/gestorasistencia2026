import { subjectBadge } from "@/react-app/lib/subjects";
import { FileDown, Settings, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiFetch } from "@/react-app/lib/api";

type Teacher = {
  id: string;
  nombre: string;
  email: string;
  roles: string[] | any;
  tutorDe: string;
  cargaAcademica: Record<string, string[]>;
};

type Props = {
  teacher: Teacher;
  hoursMap: Record<string, number>;
  onOpenAssign: (t: Teacher) => void;
  onEdit?: (t: Teacher) => void;
  canManage?: boolean;
};

function computeHours(carga: Record<string, string[]>, hoursMap: Record<string, number>) {
  let h = 0;
  Object.values(carga || {}).forEach((arr) => arr.forEach((m) => (h += hoursMap[m] || 0)));
  return h;
}

export default function TeacherCard({ teacher, hoursMap, onOpenAssign, onEdit, canManage }: Props) {
  const totalHoras = computeHours(teacher.cargaAcademica || {}, hoursMap);
  let roles: string[] = [];
  if (Array.isArray(teacher.roles)) roles = teacher.roles as string[];
  else if (typeof teacher.roles === "string") {
    try {
      const parsed = JSON.parse(teacher.roles as any);
      if (Array.isArray(parsed)) roles = parsed;
    } catch {}
  }

  const exportPDF = async () => {
    const doc = new jsPDF();
    let label = "";
    let fname = `carga_${teacher.nombre}.pdf`;
    try {
      const resp = await apiFetch("/api/admin/settings");
      if (resp.ok) {
        const d = await resp.json();
        label = `Año lectivo: ${d.active_year}${d.terms_count ? ` · ${d.terms_count} periodos` : ""}`;
        if (d.active_year) {
          fname = `carga_${teacher.nombre}_${d.active_year}${d.terms_count ? `_p${d.terms_count}` : ""}.pdf`;
        }
        doc.setFontSize(12);
        doc.text(label, 14, 18);
      }
    } catch {}
    const body: any[] = [];
    Object.keys(teacher.cargaAcademica || {}).forEach((grado) => {
      const materias = teacher.cargaAcademica[grado] || [];
      materias.forEach((m) => body.push([grado, m, hoursMap[m] || 0]));
    });
    autoTable(doc, {
      head: [["Grado", "Materia", "Horas"]],
      body,
    });
    doc.save(fname);
  };

  const hoursBadgeClass =
    totalHoras > 22 ? "bg-red-600 text-white" : "bg-indigo-600 text-white";

  return (
    <div className="bg-white rounded-[3rem] sm:rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 hover:scale-[1.02] transition duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`px-3 py-1 rounded-xl text-xs font-bold ${hoursBadgeClass}`}>
          {totalHoras} h
        </div>
        <div className="flex gap-2">
          {canManage && onEdit && (
            <button
              onClick={() => onEdit(teacher)}
              className="px-2 py-1 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition flex items-center gap-1 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-black text-slate-800">{teacher.nombre || (teacher as any).name}</h3>
        <p className="text-sm text-slate-500">{teacher.email}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {roles.map((r: string) => (
          <span key={r} className="px-2 py-1 text-xs rounded-xl bg-slate-100 text-slate-700 font-semibold">
            {r}
          </span>
        ))}
        {teacher.tutorDe && teacher.tutorDe !== "NO" && (
          <span className="px-2 py-1 text-xs rounded-xl bg-emerald-100 text-emerald-700 font-semibold">Tutor {teacher.tutorDe}</span>
        )}
      </div>
      <div className="space-y-3">
        {Object.keys(teacher.cargaAcademica || {})
          .sort((a, b) => {
            const pa = /^(\d+)([A-Za-z])$/.exec(a);
            const pb = /^(\d+)([A-Za-z])$/.exec(b);
            if (pa && pb) {
              const na = parseInt(pa[1], 10),
                nb = parseInt(pb[1], 10);
              if (na !== nb) return na - nb;
              return pa[2].localeCompare(pb[2]);
            }
            return a.localeCompare(b);
          })
          .map((grado) => (
          <div key={grado} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase text-slate-700">{grado}</span>
            {(teacher.cargaAcademica[grado] || []).map((m) => {
              const meta = subjectBadge(m);
              return (
                <span
                  key={`${grado}-${m}`}
                  className={`px-2 py-1 rounded-xl ${meta.colorClass} text-white uppercase font-black text-[8px] sm:text-[10px]`}
                >
                  {m}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {canManage && (
          <button
            onClick={() => onOpenAssign(teacher)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition flex items-center gap-1.5 text-xs"
          >
            <Settings className="w-3.5 h-3.5" /> Carga
          </button>
        )}
        <button
          onClick={exportPDF}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1.5 text-xs"
        >
          <FileDown className="w-3.5 h-3.5" /> PDF
        </button>
      </div>
    </div>
  );
}

