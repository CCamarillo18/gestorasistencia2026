
DROP INDEX idx_absent_unique;
DROP INDEX idx_absent_student;
DROP INDEX idx_absent_record;
DROP TABLE absent_students;

DROP INDEX idx_attendance_unique;
DROP INDEX idx_attendance_subject;
DROP INDEX idx_attendance_date;
DROP TABLE attendance_records;

DROP INDEX idx_schedules_day;
DROP INDEX idx_schedules_subject;
DROP TABLE schedules;

DROP INDEX idx_subjects_course;
DROP INDEX idx_subjects_teacher;
DROP TABLE subjects;

DROP INDEX idx_teachers_user;
DROP TABLE teachers;

DROP INDEX idx_students_course;
DROP TABLE students;

DROP TABLE courses;
