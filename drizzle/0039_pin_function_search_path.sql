-- Kunci search_path fungsi trigger supaya tidak mewarisi laluan sesi
-- (amaran Supabase "Function Search Path Mutable"). Rujukan objek mestilah
-- berkelayakan penuh kerana search_path = ''.

CREATE OR REPLACE FUNCTION public.prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
begin
  if new.status not in ('pending', 'approved') then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.pkg_id || ':' || new.room_slug || ':' || new.date::text)
  );

  if exists (
    select 1
    from public.bookings existing
    where existing.id <> new.id
      and existing.status in ('pending', 'approved')
      and existing.pkg_id = new.pkg_id
      and existing.room_slug = new.room_slug
      and existing.date = new.date
      and (
        existing.slot = new.slot
        or existing.slot = 'full_day'
        or new.slot = 'full_day'
      )
  ) then
    raise exception 'Slot bilik ini sudah ditempah atau sedang menunggu kelulusan.';
  end if;

  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.enforce_equipment_loan_school_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW."applicant_type" = 'sekolah' THEN
    SELECT "name"
    INTO NEW."org_name"
    FROM public."schools"
    WHERE "code" = NEW."school_code";

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kod sekolah tidak dijumpai dalam senarai sekolah';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
