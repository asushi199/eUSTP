-- Buang kategori tersalah cipta (OBS01 / OBSBOT).
-- Model sebenar kekal di bawah kategori OBSBOT01.
DELETE FROM "equipment_categories" WHERE "code" = 'OBS01';
