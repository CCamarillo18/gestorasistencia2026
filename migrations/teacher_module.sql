-- Limpieza y creación correcta de tablas base

drop table if exists teachers cascade;
drop table if exists subject_config cascade;

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

create index if not exists idx_teachers_roles_gin on teachers using gin (roles);
create index if not exists idx_teachers_carga_gin on teachers using gin (cargaAcademica);

-- Docentes iniciales
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
('Nubia Jimenez Ballesteros','Coordinacion.eduardosantos2024@hotmail.com','["Coord."]','NO')
on conflict (email) do nothing;

-- Materias y horas (nombres actualizados)
insert into subject_config (materia,gradoRaiz,horas) values
('Biología','Ciencias',3),('Física','Ciencias',3),('Química','Ciencias',3),('Pre Ciencias','Ciencias',2),
('Matemáticas','Matemáticas',4),('Geometría','Matemáticas',2),('Economía Política','Matemáticas',2),
('Lengua Castellana','Humanidades',4),('Comprensión Lectora','Humanidades',2),('Inglés','Humanidades',3),('Filosofía','Humanidades',2),
('Sociales','Sociales',3),('Historia','Sociales',2),('Geografía','Sociales',2),
('Artística','Otras',2),('Informática','Otras',2),('Ética','Otras',2),('Religión','Otras',2),('C. Ciudadanas','Otras',2),('Ed. Física','Otras',2)
on conflict (materia) do nothing;

