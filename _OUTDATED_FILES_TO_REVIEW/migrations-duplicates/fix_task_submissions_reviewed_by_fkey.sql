-- Fix task_submissions reviewed_by foreign key to reference user_profiles instead of auth.users
-- This resolves the PGRST200 error when trying to establish relationships

-- First, drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'task_submissions_reviewed_by_fkey' 
               AND table_name = 'task_submissions') THEN
        ALTER TABLE task_submissions DROP CONSTRAINT task_submissions_reviewed_by_fkey;
    END IF;
END $$;

-- Add the correct foreign key constraint to reference user_profiles
ALTER TABLE task_submissions 
ADD CONSTRAINT task_submissions_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Update any existing reviewed_by values to ensure they exist in user_profiles
-- (This should be safe since user_profiles.id references auth.users.id)
UPDATE task_submissions 
SET reviewed_by = NULL 
WHERE reviewed_by IS NOT NULL 
AND reviewed_by NOT IN (SELECT id FROM user_profiles);

-- Add comment to document the change
COMMENT ON CONSTRAINT task_submissions_reviewed_by_fkey ON task_submissions 
IS 'Foreign key to user_profiles for reviewer information';