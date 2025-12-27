
UPDATE subjects SET hours_per_week = 2 WHERE name = 'Matemáticas';
UPDATE subjects SET hours_per_week = 3 WHERE name = 'Español';
UPDATE subjects SET hours_per_week = 2 WHERE name IN ('Ciencias', 'Inglés', 'Sociales');
UPDATE subjects SET hours_per_week = 1 WHERE hours_per_week IS NULL;
