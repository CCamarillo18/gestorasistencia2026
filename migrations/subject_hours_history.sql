create table if not exists public.subject_hours_profiles (
  id bigint generated always as identity primary key,
  year int not null,
  created_at timestamptz default now()
);

create table if not exists public.subject_hours_profile_entries (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.subject_hours_profiles(id) on delete cascade,
  subject text not null,
  grade int not null,
  hours int not null
);

