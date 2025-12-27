
-- Eliminar horarios
DELETE FROM schedules WHERE subject_id IN (1, 2, 3, 5, 6, 7, 8, 9);

-- Eliminar asignaturas
DELETE FROM subjects WHERE course_id IN (1, 2, 3);
