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

-- Add helpful comments
COMMENT ON TABLE course_objectives IS 'Junction table for course-objective many-to-many relationships';
COMMENT ON COLUMN course_objectives.position IS 'Order of objectives within the course';
COMMENT ON COLUMN course_objectives.course_id IS 'Reference to the course';
COMMENT ON COLUMN course_objectives.objective_id IS 'Reference to the learning objective';