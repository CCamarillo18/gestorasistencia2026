create table if not exists public.subject_grade_hours (
  subject text not null,
  grade int not null,
  hours int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint subject_grade_hours_pk primary key (subject, grade)
);

