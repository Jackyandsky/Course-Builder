# Database Migration Instructions

## Issue: Course Detail Page Fallback

If you're experiencing issues with the course detail page immediately falling back to the courses list, it's likely because the `course_objectives` table doesn't exist in your database yet.

## Solution: Run the Course Objectives Migration

### Option 1: Manual SQL Execution
Execute the SQL file in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/create_course_objectives_table.sql`
4. Click **Run**

### Option 2: Using Supabase CLI (if available)
```bash
supabase db push
```

### Option 3: Direct SQL Query
Copy and paste this SQL into your Supabase SQL editor:

```sql
-- Create course_objectives table for managing course-objective relationships
CREATE TABLE IF NOT EXISTS course_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique course-objective combinations
    UNIQUE(course_id, objective_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON course_objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_course_objectives_objective_id ON course_objectives(objective_id);
CREATE INDEX IF NOT EXISTS idx_course_objectives_position ON course_objectives(course_id, position);

-- Add RLS (Row Level Security) policies
ALTER TABLE course_objectives ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (read)
CREATE POLICY "Allow read access to course_objectives" ON course_objectives
    FOR SELECT USING (true);

-- Policy for INSERT (create)
CREATE POLICY "Allow insert of course_objectives" ON course_objectives
    FOR INSERT WITH CHECK (true);

-- Policy for UPDATE (modify)
CREATE POLICY "Allow update of course_objectives" ON course_objectives
    FOR UPDATE USING (true);

-- Policy for DELETE (remove)
CREATE POLICY "Allow delete of course_objectives" ON course_objectives
    FOR DELETE USING (true);
```

## Verification

After running the migration:

1. Refresh your application
2. Try accessing a course detail page
3. The page should now load successfully
4. You can now add objectives to courses using the new ObjectiveSelector component

## Fallback Behavior

If the table still doesn't exist, the application will:
- Display course details without objectives (graceful degradation)
- Show a warning in the console
- Allow normal course functionality to continue

## Features Available After Migration

- ✅ Add/remove objectives to/from courses
- ✅ Reorder course objectives
- ✅ View rich objective details with Bloom's taxonomy
- ✅ Search and filter available objectives
- ✅ Template objective support