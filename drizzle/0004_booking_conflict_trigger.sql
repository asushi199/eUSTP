-- Pencegahan konflik slot (per PKG + bilik + tarikh), diporting verbatim dari
-- tempahan-pkg-manjung/supabase/schema.sql. Advisory lock menserikan insert/update
-- serentak supaya semakan kewujudan tidak terlepas tempahan yang belum commit (TOCTOU).
CREATE OR REPLACE FUNCTION prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  if new.status not in ('pending', 'approved') then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(new.pkg_id || ':' || new.room_slug || ':' || new.date::text)
  );

  if exists (
    select 1
    from bookings existing
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
--> statement-breakpoint
DROP TRIGGER IF EXISTS bookings_prevent_conflict ON bookings;
--> statement-breakpoint
CREATE TRIGGER bookings_prevent_conflict
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION prevent_booking_conflict();
