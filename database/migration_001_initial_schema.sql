-- Course Builder Database Migration
-- Migration: 001_initial_schema
-- Description: Create initial database schema for Course Builder application
-- Date: 2025-06-08

-- Include schema
\i schema.sql

-- Include RLS policies
\i rls_policies.sql

-- Create some initial template data for users
INSERT INTO objectives (title, description, bloom_level, is_template, user_id) VALUES
('Understand key concepts', 'Students will be able to understand and explain the key concepts', 'understand', true, auth.uid()),
('Apply knowledge', 'Students will be able to apply the learned concepts in practical scenarios', 'apply', true, auth.uid()),
('Analyze problems', 'Students will be able to analyze complex problems and break them down', 'analyze', true, auth.uid()),
('Create solutions', 'Students will be able to create innovative solutions to problems', 'create', true, auth.uid());

INSERT INTO methods (name, description, instructions, duration_minutes, is_template, user_id) VALUES
('Lecture', 'Traditional lecture format', 'Present information to students in a structured manner', 45, true, auth.uid()),
('Group Discussion', 'Interactive group discussion', 'Facilitate discussion among students on the topic', 30, true, auth.uid()),
('Hands-on Practice', 'Practical exercises', 'Guide students through practical exercises', 60, true, auth.uid()),
('Peer Review', 'Students review each other''s work', 'Organize peer review sessions for feedback', 30, true, auth.uid());

INSERT INTO tasks (title, description, instructions, duration_minutes, is_template, user_id) VALUES
('Reading Assignment', 'Assigned reading from textbook or materials', 'Read the specified chapters and take notes', 60, true, auth.uid()),
('Written Exercise', 'Writing assignment or essay', 'Complete the writing assignment following guidelines', 90, true, auth.uid()),
('Problem Set', 'Mathematical or logical problems to solve', 'Solve all problems showing your work', 45, true, auth.uid()),
('Project Work', 'Work on course project', 'Continue working on your project following the requirements', 120, true, auth.uid());

-- Add a comment to track migration
COMMENT ON SCHEMA public IS 'Course Builder initial schema v1.0.0';
