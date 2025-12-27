
ALTER TABLE students ADD COLUMN phone TEXT;
ALTER TABLE students ADD COLUMN email TEXT;
ALTER TABLE students ADD COLUMN guardian_name TEXT;
ALTER TABLE students ADD COLUMN guardian_phone TEXT;
ALTER TABLE students ADD COLUMN address TEXT;
ALTER TABLE students ADD COLUMN has_student_insurance BOOLEAN DEFAULT 0;
ALTER TABLE students ADD COLUMN blood_type TEXT;
