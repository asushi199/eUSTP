-- Dua unit komputer riba telah wujud sebelum inventori Lampiran C diimport.
-- Kekalkan ID dan peruntukan pinjaman unit tersebut, tetapi gunakan nombor
-- inventori baharu dan simpan nombor siri pengilang dalam catatan.
DO $$
DECLARE
  existing_count integer;
BEGIN
  SELECT count(*)::integer
  INTO existing_count
  FROM "equipment_units" u
  INNER JOIN "equipment_types" t ON t."id" = u."equipment_type_id"
  WHERE t."code" = '001002002'
    AND u."serial_no" IN ('T9N0CV14A76839E', 'T9N0CV14A779393');

  IF existing_count = 2 THEN
    DELETE FROM "equipment_units" u
    USING "equipment_types" t
    WHERE u."equipment_type_id" = t."id"
      AND t."code" = '001002002'
      AND u."serial_no" IN ('001002002-1', '001002002-2')
      AND u."status" = 'available'
      AND NOT EXISTS (
        SELECT 1
        FROM "equipment_loan_allocations" a
        WHERE a."unit_id" = u."id"
      );

    UPDATE "equipment_units" u
    SET
      "serial_no" = CASE u."serial_no"
        WHEN 'T9N0CV14A76839E' THEN '001002002-1'
        WHEN 'T9N0CV14A779393' THEN '001002002-2'
      END,
      "notes" = CASE
        WHEN u."notes" = '' THEN 'No. siri pengilang: ' || u."serial_no"
        ELSE u."notes" || ' · No. siri pengilang: ' || u."serial_no"
      END,
      "updated_at" = now()
    FROM "equipment_types" t
    WHERE u."equipment_type_id" = t."id"
      AND t."code" = '001002002'
      AND u."serial_no" IN ('T9N0CV14A76839E', 'T9N0CV14A779393');
  END IF;
END $$;
