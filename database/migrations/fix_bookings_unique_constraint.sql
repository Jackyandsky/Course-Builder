-- Fix bookings unique constraint to exclude cancelled bookings
-- This allows the same time slot to be booked again after a cancellation

-- Drop the existing constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_booking_date_booking_time_teacher_id_key;

-- Create a new partial unique index that only applies to non-cancelled bookings
-- This ensures uniqueness only for bookings that are pending, confirmed, or completed
CREATE UNIQUE INDEX bookings_active_timeslot_teacher_idx 
ON bookings (booking_date, booking_time, teacher_id)
WHERE status NOT IN ('cancelled', 'no_show');

-- Add a comment explaining the constraint
COMMENT ON INDEX bookings_active_timeslot_teacher_idx IS 
'Ensures a teacher cannot have multiple active bookings at the same date/time. Cancelled and no-show bookings are excluded from this constraint.';