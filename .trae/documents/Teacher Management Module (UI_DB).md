## Base de Datos (Supabase SQL)
1. Crear tablas y llaves:
```sql
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  roles jsonb not null default '[]'::jsonb,
  tutorDe text not null default 'NO',
  cargaAcademica jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists subject_config (
  materia text primary key,
  gradoRaiz text not null,
  horas int not null,
  created_at timestamptz default now()
);

-- índices útiles
create index if not exists idx_teachers_roles_gin on teachers using gin (roles);
create index if not exists idx_teachers_carga_gin on teachers using gin (cargaAcademica);
```
2. Sembrar docentes iniciales (roles como array JSON):
```sql
insert into teachers (nombre,email,roles,tutorDe) values
('Raul David Soto Vergara','rdsv9620@gmail.com','["Prof."]','8B'),
('Evely Barraza','evely.torres.b@gmail.com','["Prof."]','10A'),
('David Antonio Yance Nuñez','davidyance@hotmail.com','["Prof."]','NO'),
('Noelia Barrios','noeliambarrios98@gmail.com','["Prof."]','9A'),
('Jacqueline Leon Puello','jajepa@hotmail.com','["Prof."]','6B'),
('Carlos Camarillo','camarillocj@gmail.com','["Prof.","Admin.","Coord."]','9B'),
('Yenis Muñoz','yenisitajudith@gmail.com','["Prof."]','6A'),
('Alvaro Gomez','algaro2656@hotmail.com','["Prof."]','NO'),
('Judith Beltran','judibeltran9984@hotmail.com','["Prof."]','11A'),
('Solfadys Diaz','solfadys@gmail.com','["Prof."]','8A'),
('Rubén D. Sánchez Dams','rubendams@gmail.com','["Prof."]','7A'),
('Guillermo Emilio Castro Del Valle','memocastro2012@gmail.com','["Prof."]','7C'),
('Abel Socarrás','spadabel@gmail.com','["Prof."]','NO'),
('Maria Eugenia Barrios Donado','mirefugio77@hotmail.com','["Prof."]','7B'),
('Nubia Jimenez Ballesteros','Coordinacion.eduardosantos2024@hotmail.com','["Coord."]','NO');
```
3. Sembrar subject_config con horas (ejemplo base, ampliable):
```sql
insert into subject_config (materia,gradoRaiz,horas) values
('Biología','Ciencias',3),('Física','Ciencias',3),('Química','Ciencias',3),('Preciencias','Ciencias',2),
('Matemáticas','Matemáticas',4),('Geometría','Matemáticas',2),('Economía Política','Matemáticas',2),
('Lengua Castellana','Humanidades',4),('Comprensión Lectora','Humanidades',2),('Inglés','Humanidades',3),('Filosofía','Humanidades',2),
('Sociales','Sociales',3),('Historia','Sociales',2),('Geografía','Sociales',2),
('Artística','Otras',2),('Informática','Otras',2),('Ética','Otras',2),('Religión','Otras',2),('Ciudadanas','Otras',2),('Ed. Física','Otras',2);
```

## Diccionario de Asignaturas y colores (Frontend)
- Crear `src/react-app/lib/subjects.ts` con:
  - Mapa `{ materia: { colorClass, area } }` usando las clases Tailwind pedidas.
  - Utilidad `subjectBadge(materia)` devuelve clases y label.

## UI/UX Premium (TeacherManagement.tsx)
1. Estructura de archivos:
- `pages/TeacherManagement.tsx` (vista principal)
- `components/TeacherCard.tsx` (tarjeta con KPI y materias)
- `components/TeacherAssignModal.tsx` (modal de asignación masiva)
- `lib/subjects.ts` (colores y helpers)

2. Tarjetas de Docente:
- Desktop: `rounded-[3rem]`; móvil: `rounded-[2rem]` vía clases responsivas.
- Encabezado: nombre, email, chips de roles, tutorDe.
- KPI horas: badge top-right con total semanal.
- Grid de materias por grado: etiquetas con `uppercase font-black` y `text-[8px] sm:text-[10px]` y color por materia.
- Botones: “Ficha Técnica”, “Exportar PDF”, “Editar carga”.

3. Sidebar y navegación:
- Reusar el Sidebar ya integrado; agregar ruta `/teachers`.

4. Modal Ficha Técnica (asignación masiva):
- Selector de materia (combobox con filtro por categoría)
- Lista de grados con check múltiple: ["6A","6B","7A",...]
- Al guardar: fusionar en `cargaAcademica` del docente: `{ grado: [ ...materias ] }`.
- Orden alfanumérico estricto de grados:
```ts
const gradeSort = (a:string,b:string) => {
  const pa = a.match(/(\d+)([A-Z])/)!; const pb = b.match(/(\d+)([A-Z])/)!;
  const na = parseInt(pa[1],10), nb = parseInt(pb[1],10);
  return na === nb ? pa[2].localeCompare(pb[2]) : na - nb;
};
```

## Lógica Técnica
1. Supabase-js (cliente front):
- Listar docentes: `supabase.from('teachers').select('*').order('nombre')`.
- Guardar carga: `update teachers set cargaAcademica = ... where id = ...`.
- Leer subject_config para horas y calcular KPI:
```ts
function totalHoras(carga:Record<string,string[]>, conf:Record<string,number>) {
  let h=0; Object.values(carga||{}).forEach(arr => arr.forEach(m=> h += conf[m]||0)); return h;
}
```

2. Exportar PDF (jsPDF + autoTable):
- Generar tabla: columnas [Grado, Materia, Horas] usando `subject_config` para horas.
- `new jsPDF(); doc.autoTable({ head, body }); doc.save('carga_docente.pdf');`

3. UI Responsiva y accesible:
- Contenedores bg-slate-50, `shadow-xl shadow-slate-200/60`, `border-slate-100`.
- Transiciones: `hover:scale-[1.02] duration-300`.
- Micro-tipografía para móvil en chips de materias.

## Seguridad y reglas
- Lectura abierta (Auth: usuario logueado).
- Escritura solo para roles que incluyan `Admin.` o `Coord.` (validación en UI + verificación en el Worker si se expone un endpoint de proxy).
- Opcional: políticas RLS en Supabase (si se centraliza escritura desde el Worker con service role, no expone la clave en cliente).

## Integración
1. Rutas:
- Añadir `Route path="/teachers" element={<TeacherManagement/>}`.
2. Sidebar: enlazar botón Docentes a `/teachers`.

## Validación
- Sembrar tablas y datos en Supabase.
- Probar listado, asignación masiva, cálculo de horas, exportar PDF.
- Revisar móvil: sin desbordes, chips legibles.

## Entregables
- Nuevos archivos TSX y utilidades.
- Scripts SQL de creación y seed.
- Implementación jsPDF + autoTable.
- Estilo Tailwind aplicado con la estética solicitada.

¿Confirmas que proceda con la implementación completa (SQL + componentes + wiring de rutas)?