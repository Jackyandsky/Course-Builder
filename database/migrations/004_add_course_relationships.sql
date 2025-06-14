-- Add course-objective and course-method relationship tables
-- This migration adds the missing relationship tables for objectives and methods to courses

-- Course-Objective associations
CREATE TABLE IF NOT EXISTS course_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, objective_id)
);

-- Course-Method associations  
CREATE TABLE IF NOT EXISTS course_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    method_id UUID REFERENCES methods(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, method_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON course_objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_course_objectives_objective_id ON course_objectives(objective_id);
CREATE INDEX IF NOT EXISTS idx_course_methods_course_id ON course_methods(course_id);
CREATE INDEX IF NOT EXISTS idx_course_methods_method_id ON course_methods(method_id);