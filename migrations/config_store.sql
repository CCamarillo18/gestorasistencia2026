create schema if not exists config_store;

create table if not exists config_store.settings (
  id bigint generated always as identity primary key,
  active_year int not null,
  terms_count int not null,
  updated_at timestamptz default now()
);

create table if not exists config_store.subject_hours_profiles (
  id bigint generated always as identity primary key,
  year int not null,
  created_at timestamptz default now()
);

create table if not exists config_store.subject_hours_profile_entries (
  id bigint generated always as identity primary key,
  profile_id bigint not null references config_store.subject_hours_profiles(id) on delete cascade,
  subject text not null,
  grade int not null,
  hours int not null
);

-- RLS (si usas RLS)
-- alter table config_store.settings enable row level security;
-- create policy read_settings on config_store.settings for select to authenticated using (true);
-- create policy write_settings on config_store.settings for update to authenticated using (true) with check (true);
-- create policy insert_settings on config_store.settings for insert to authenticated using (true) with check (true);
-- alter table config_store.subject_hours_profiles enable row level security;
-- alter table config_store.subject_hours_profile_entries enable row level security;
-- create policy read_profiles on config_store.subject_hours_profiles for select to authenticated using (true);
-- create policy write_profiles on config_store.subject_hours_profiles for insert to authenticated using (true) with check (true);
-- create policy read_entries on config_store.subject_hours_profile_entries for select to authenticated using (true);
-- create policy write_entries on config_store.subject_hours_profile_entries for insert to authenticated using (true) with check (true);
