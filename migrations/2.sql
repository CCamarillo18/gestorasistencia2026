
ALTER TABLE teachers ADD COLUMN tutor_course_id INTEGER;
ALTER TABLE subjects ADD COLUMN hours_per_week INTEGER DEFAULT 1;
