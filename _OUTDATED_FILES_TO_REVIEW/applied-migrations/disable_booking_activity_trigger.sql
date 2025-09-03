-- Disable the booking activity logging trigger that accesses auth.users
-- This trigger causes permission errors when updating bookings

-- Drop the trigger that logs booking activities
DROP TRIGGER IF EXISTS log_booking_activities ON bookings;

-- Optionally, you can also drop the function if it's not needed elsewhere
-- DROP FUNCTION IF EXISTS log_booking_activity();