-- Add available_for_booking field to user_profiles table
-- This field determines if a teacher can be selected for bookings

-- Add available_for_booking column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS available_for_booking BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.available_for_booking IS 'Indicates if a teacher is available for booking appointments. Only applies to users with teacher role.';

-- Update existing teachers to be available by default (optional)
-- You can comment this out if you want all teachers to be unavailable by default
UPDATE user_profiles 
SET available_for_booking = true 
WHERE role = 'teacher';

-- Create an index for better performance when querying available teachers
CREATE INDEX IF NOT EXISTS idx_user_profiles_available_teachers 
ON user_profiles(available_for_booking, role) 
WHERE role = 'teacher';