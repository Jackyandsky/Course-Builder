-- Add schedule_id to enrollments table if it doesn't exist
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_schedule_id ON enrollments(schedule_id);

-- Migrate data from schedule_enrollments to enrollments if needed
UPDATE enrollments e
SET schedule_id = se.schedule_id
FROM schedule_enrollments se
WHERE e.id = se.enrollment_id
AND e.schedule_id IS NULL;

-- Drop the schedule_enrollments table as it's no longer needed
DROP TABLE IF EXISTS schedule_enrollments CASCADE;

-- Update RLS policies if needed
-- Allow users to read their own enrollments with schedule
CREATE POLICY IF NOT EXISTS "Users can view own enrollments with schedule"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);