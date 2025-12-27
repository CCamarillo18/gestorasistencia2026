-- Configuración académica
create table if not exists academic_settings (
  id bigint generated always as identity primary key,
  active_year int not null,
  terms_count int not null default 3,
  updated_at timestamptz default now()
);

-- Horas por asignatura y grado (6..11)
create table if not exists subject_grade_hours (
  subject text not null,
  grade int not null,
  hours int not null,
  created_at timestamptz default now(),
  primary key (subject, grade)
);

-- RLS recomendado (ejecutar si usas RLS)
-- alter table academic_settings enable row level security;
-- create policy read_settings on academic_settings for select to authenticated using (true);
-- create policy write_settings on academic_settings for update to authenticated using (true) with check (true);
-- alter table subject_grade_hours enable row level security;
-- create policy read_subject_hours on subject_grade_hours for select to authenticated using (true);
-- create policy write_subject_hours on subject_grade_hours for insert to authenticated using (true) with check (true);
-- create policy upsert_subject_hours on subject_grade_hours for update to authenticated using (true) with check (true);

