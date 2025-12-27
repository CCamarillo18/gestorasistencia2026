import { useMemo, useState } from "react";
import { subjectBadge, SUBJECTS_META } from "@/react-app/lib/subjects";

type Props = {
  open: boolean;
  onClose: () => void;
  teacher: {
    id: string;
    nombre: string;
    cargaAcademica: Record<string, string[]>;
  } | null;
  onSave: (carga: Record<string, string[]>) => void;
};

const GRADES = ["6A","6B","6C","7A","7B","7C","8A","8B","8C","9A","9B","9C","10A","10B","10C","11A","11B","11C"];
const MATERIAS = Object.keys(SUBJECTS_META);

export default function TeacherAssignModal({ open, onClose, teacher, onSave }: Props) {
  const [materia, setMateria] = useState<string>(MATERIAS[0]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const sortedGrades = useMemo(() => GRADES.sort((a,b) => {
    const pa = /^(\d+)([A-Za-z])$/.exec(a);
    const pb = /^(\d+)([A-Za-z])$/.exec(b);
    if (pa && pb) {
      const na = parseInt(pa[1],10), nb = parseInt(pb[1],10);
      return na === nb ? pa[2].localeCompare(pb[2]) : na - nb;
    }
    return a.localeCompare(b);
  }), []);

  if (!open || !teacher) return null;

  const toggleGrade = (g: string) => {
    setSelected((prev) => ({ ...prev, [g]: !prev[g] }));
  };

  const save = () => {
    const carga = { ...(teacher.cargaAcademica || {}) };
    Object.keys(selected).forEach((g) => {
      if (!selected[g]) return;
      const arr = new Set([...(carga[g] || []), materia]);
      carga[g] = Array.from(arr);
    });
    onSave(carga);
    onClose();
  };

  const meta = subjectBadge(materia);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6">
        <h3 className="text-xl font-black text-slate-800 mb-4">Asignación masiva – {teacher.nombre}</h3>
        <div className="mb-4">
          <label className="text-sm text-slate-700">Materia</label>
          <select
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl p-2"
          >
            {MATERIAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className={`mt-2 inline-block px-2 py-1 rounded-xl text-white ${meta.colorClass} text-xs uppercase font-black`}>
            {materia}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl p-2">
          {sortedGrades.map((g) => (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              className={`px-2 py-2 rounded-xl border text-sm ${
                selected[g] ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-800 border-slate-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800">Cancelar</button>
          <button onClick={save} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Guardar</button>
        </div>
      </div>
    </div>
  );
}

