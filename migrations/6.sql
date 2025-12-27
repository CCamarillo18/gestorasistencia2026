
-- Insertar asignaturas para 6A (course_id=1)
INSERT INTO subjects (name, teacher_id, course_id, hours_per_week) VALUES
('Matemáticas', 1, 1, 5),
('Español', 1, 1, 4),
('Ciencias Naturales', 1, 1, 3),
('Ciencias Sociales', 1, 1, 3),
('Inglés', 1, 1, 3),
('Educación Física', 1, 1, 2),
('Artes', 1, 1, 2);

-- Insertar asignaturas para 6B (course_id=2)
INSERT INTO subjects (name, teacher_id, course_id, hours_per_week) VALUES
('Matemáticas', 1, 2, 5),
('Español', 1, 2, 4),
('Ciencias Naturales', 1, 2, 3),
('Ciencias Sociales', 1, 2, 3),
('Inglés', 1, 2, 3),
('Educación Física', 1, 2, 2),
('Artes', 1, 2, 2);

-- Insertar asignaturas para 7A (course_id=3)
INSERT INTO subjects (name, teacher_id, course_id, hours_per_week) VALUES
('Matemáticas', 1, 3, 5),
('Español', 1, 3, 4),
('Ciencias Naturales', 1, 3, 3),
('Ciencias Sociales', 1, 3, 3),
('Inglés', 1, 3, 3),
('Educación Física', 1, 3, 2),
('Tecnología', 1, 3, 2);

-- Insertar horarios de ejemplo para el lunes (day_of_week=1)
-- Matemáticas 6A de 7:00 a 8:30
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(1, 1, '07:00', '08:30'),
(1, 3, '07:00', '08:30');

-- Español 6A de 8:30 a 10:00
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(2, 1, '08:30', '10:00'),
(2, 4, '08:30', '10:00');

-- Ciencias Naturales 6A de 10:30 a 12:00
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(3, 1, '10:30', '12:00');

-- Matemáticas 6B de 7:00 a 8:30
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(8, 2, '07:00', '08:30'),
(8, 5, '07:00', '08:30');

-- Español 6B de 8:30 a 10:00
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(9, 2, '08:30', '10:00'),
(9, 5, '08:30', '10:00');

-- Inglés 6A de 14:00 a 15:30
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(5, 2, '14:00', '15:30');

-- Educación Física 6A de 10:30 a 12:00
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(6, 3, '10:30', '12:00');

-- Artes 6A de 14:00 a 15:30
INSERT INTO schedules (subject_id, day_of_week, start_time, end_time) VALUES
(7, 4, '14:00', '15:30');
