-- Buang aset EL (Set elektronik) dan kategorinya — tiada unit/loan bergantung.
DELETE FROM "equipment_types" WHERE "code" = 'EL';
--> statement-breakpoint

DELETE FROM "equipment_categories" WHERE "code" = 'SET-ELEKTRONIK';
