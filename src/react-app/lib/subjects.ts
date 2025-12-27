export type SubjectMeta = {
  colorClass: string;
  area: "Ciencias" | "Matemáticas" | "Humanidades" | "Sociales" | "Otras";
};

export const SUBJECTS_META: Record<string, SubjectMeta> = {
  "Biología": { colorClass: "bg-emerald-600", area: "Ciencias" },
  "Física": { colorClass: "bg-indigo-500", area: "Ciencias" },
  "Química": { colorClass: "bg-violet-600", area: "Ciencias" },
  "Preciencias": { colorClass: "bg-green-700", area: "Ciencias" },
  "Pre Ciencias": { colorClass: "bg-green-700", area: "Ciencias" },
  "Matemáticas": { colorClass: "bg-blue-600", area: "Matemáticas" },
  "Geometría": { colorClass: "bg-sky-500", area: "Matemáticas" },
  "Economía Política": { colorClass: "bg-stone-600", area: "Matemáticas" },
  "Lengua Castellana": { colorClass: "bg-orange-600", area: "Humanidades" },
  "Comprensión Lectora": { colorClass: "bg-orange-400", area: "Humanidades" },
  "Inglés": { colorClass: "bg-purple-600", area: "Humanidades" },
  "Filosofía": { colorClass: "bg-slate-800", area: "Humanidades" },
  "Sociales": { colorClass: "bg-amber-700", area: "Sociales" },
  "Historia": { colorClass: "bg-amber-600", area: "Sociales" },
  "Geografía": { colorClass: "bg-amber-500", area: "Sociales" },
  "Artística": { colorClass: "bg-pink-500", area: "Otras" },
  "Informática": { colorClass: "bg-slate-600", area: "Otras" },
  "Ética": { colorClass: "bg-lime-600", area: "Otras" },
  "Religión": { colorClass: "bg-yellow-600", area: "Otras" },
  "Ciudadanas": { colorClass: "bg-teal-600", area: "Otras" },
  "C. Ciudadanas": { colorClass: "bg-teal-600", area: "Otras" },
  "Ed. Física": { colorClass: "bg-red-600", area: "Otras" },
};

export function subjectBadge(materia: string) {
  const meta = SUBJECTS_META[materia] || { colorClass: "bg-slate-400", area: "Otras" as const };
  return meta;
}

