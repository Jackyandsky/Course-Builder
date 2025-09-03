-- Allow all authenticated users to read data
-- Only restrict write operations to data owners

-- Tasks: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own and shared tasks" ON tasks;
CREATE POLICY "Authenticated users can view all tasks" ON tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Objectives: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own and shared objectives" ON objectives;
CREATE POLICY "Authenticated users can view all objectives" ON objectives
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Methods: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own and shared methods" ON methods;
CREATE POLICY "Authenticated users can view all methods" ON methods
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Vocabulary: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own and shared vocabulary" ON vocabulary;
CREATE POLICY "Authenticated users can view all vocabulary" ON vocabulary
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Vocabulary Groups: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own, shared and public vocabulary groups" ON vocabulary_groups;
CREATE POLICY "Authenticated users can view all vocabulary groups" ON vocabulary_groups
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Books: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own, shared and public books" ON books;
CREATE POLICY "Authenticated users can view all books" ON books
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Categories: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Authenticated users can view all categories" ON categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Courses: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
DROP POLICY IF EXISTS "Users can view public courses" ON courses;
CREATE POLICY "Authenticated users can view all courses" ON courses
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Schedules: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;
CREATE POLICY "Authenticated users can view all schedules" ON schedules
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Lessons: Allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view lessons from their schedules" ON lessons;
CREATE POLICY "Authenticated users can view all lessons" ON lessons
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Content: Update if exists
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own content" ON content;
DROP POLICY IF EXISTS "Users can view public content" ON content;
CREATE POLICY "Authenticated users can view all content" ON content
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Decoders: Update if exists  
ALTER TABLE decoders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own decoders" ON decoders;
DROP POLICY IF EXISTS "Users can view active decoders" ON decoders;
CREATE POLICY "Authenticated users can view all decoders" ON decoders
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Keep write operations restricted to owners (no changes to INSERT, UPDATE, DELETE policies)