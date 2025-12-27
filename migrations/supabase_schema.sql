CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  phone TEXT,
  email TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  has_student_insurance BOOLEAN DEFAULT FALSE,
  blood_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);

CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  tutor_course_id BIGINT REFERENCES courses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);

CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  hours_per_week INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedules_subject ON schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  schedule_id BIGINT NOT NULL,
  attendance_date DATE NOT NULL,
  teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT idx_attendance_unique UNIQUE (subject_id, schedule_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance_records(subject_id);

CREATE TABLE IF NOT EXISTS absent_students (
  id BIGSERIAL PRIMARY KEY,
  attendance_record_id BIGINT NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  hours_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT idx_absent_unique UNIQUE (attendance_record_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_absent_record ON absent_students(attendance_record_id);
CREATE INDEX IF NOT EXISTS idx_absent_student ON absent_students(student_id);

