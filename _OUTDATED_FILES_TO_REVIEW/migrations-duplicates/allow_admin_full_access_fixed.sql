-- Allow all authenticated users (admin users) to have full access to all data
-- This makes all data shared among admin users

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tasks: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

CREATE POLICY "Authenticated users have full access to tasks" ON tasks
    FOR ALL USING (is_authenticated());

-- Objectives: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all objectives" ON objectives;
DROP POLICY IF EXISTS "Users can insert their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can update their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can delete their own objectives" ON objectives;

CREATE POLICY "Authenticated users have full access to objectives" ON objectives
    FOR ALL USING (is_authenticated());

-- Methods: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all methods" ON methods;
DROP POLICY IF EXISTS "Users can insert their own methods" ON methods;
DROP POLICY IF EXISTS "Users can update their own methods" ON methods;
DROP POLICY IF EXISTS "Users can delete their own methods" ON methods;

CREATE POLICY "Authenticated users have full access to methods" ON methods
    FOR ALL USING (is_authenticated());

-- Vocabulary: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can insert their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can update their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can delete their own vocabulary" ON vocabulary;

CREATE POLICY "Authenticated users have full access to vocabulary" ON vocabulary
    FOR ALL USING (is_authenticated());

-- Vocabulary Groups: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can insert their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can update their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can delete their own vocabulary groups" ON vocabulary_groups;

CREATE POLICY "Authenticated users have full access to vocabulary groups" ON vocabulary_groups
    FOR ALL USING (is_authenticated());

-- Books: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

CREATE POLICY "Authenticated users have full access to books" ON books
    FOR ALL USING (is_authenticated());

-- Categories: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Authenticated users have full access to categories" ON categories
    FOR ALL USING (is_authenticated());

-- Courses: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

CREATE POLICY "Authenticated users have full access to courses" ON courses
    FOR ALL USING (is_authenticated());

-- Schedules: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON schedules;

CREATE POLICY "Authenticated users have full access to schedules" ON schedules
    FOR ALL USING (is_authenticated());

-- Lessons: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Users can insert lessons to their schedules" ON lessons;
DROP POLICY IF EXISTS "Users can update lessons in their schedules" ON lessons;
DROP POLICY IF EXISTS "Users can delete lessons from their schedules" ON lessons;

CREATE POLICY "Authenticated users have full access to lessons" ON lessons
    FOR ALL USING (is_authenticated());

-- Content: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all content" ON content;
DROP POLICY IF EXISTS "Users can insert their own content" ON content;
DROP POLICY IF EXISTS "Users can update their own content" ON content;
DROP POLICY IF EXISTS "Users can delete their own content" ON content;

CREATE POLICY "Authenticated users have full access to content" ON content
    FOR ALL USING (is_authenticated());

-- Decoders: Full access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all decoders" ON decoders;
DROP POLICY IF EXISTS "Users can insert their own decoders" ON decoders;
DROP POLICY IF EXISTS "Users can update their own decoders" ON decoders;
DROP POLICY IF EXISTS "Users can delete their own decoders" ON decoders;

CREATE POLICY "Authenticated users have full access to decoders" ON decoders
    FOR ALL USING (is_authenticated());

-- Vocabulary Group Items: Full access for authenticated users
DROP POLICY IF EXISTS "Users can view vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can insert vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can update vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can delete vocabulary group items they own" ON vocabulary_group_items;

CREATE POLICY "Authenticated users have full access to vocabulary group items" ON vocabulary_group_items
    FOR ALL USING (is_authenticated());

-- Course relationship tables
-- Course Books
DROP POLICY IF EXISTS "Users can view course books they own" ON course_books;
DROP POLICY IF EXISTS "Users can manage course books they own" ON course_books;

CREATE POLICY "Authenticated users have full access to course books" ON course_books
    FOR ALL USING (is_authenticated());

-- Course Objectives  
DROP POLICY IF EXISTS "Users can view course objectives they own" ON course_objectives;
DROP POLICY IF EXISTS "Users can manage course objectives they own" ON course_objectives;

CREATE POLICY "Authenticated users have full access to course objectives" ON course_objectives
    FOR ALL USING (is_authenticated());

-- Course Methods
DROP POLICY IF EXISTS "Users can view course methods they own" ON course_methods;
DROP POLICY IF EXISTS "Users can manage course methods they own" ON course_methods;

CREATE POLICY "Authenticated users have full access to course methods" ON course_methods
    FOR ALL USING (is_authenticated());

-- Course Tasks
DROP POLICY IF EXISTS "Users can view course tasks they own" ON course_tasks;
DROP POLICY IF EXISTS "Users can manage course tasks they own" ON course_tasks;

CREATE POLICY "Authenticated users have full access to course tasks" ON course_tasks
    FOR ALL USING (is_authenticated());

-- Course Vocabulary Groups
DROP POLICY IF EXISTS "Users can view course vocabulary groups they own" ON course_vocabulary_groups;
DROP POLICY IF EXISTS "Users can manage course vocabulary groups they own" ON course_vocabulary_groups;

CREATE POLICY "Authenticated users have full access to course vocabulary groups" ON course_vocabulary_groups
    FOR ALL USING (is_authenticated());

-- Lesson relationship tables
-- Lesson Books
DROP POLICY IF EXISTS "Users can view lesson books they own" ON lesson_books;
DROP POLICY IF EXISTS "Users can manage lesson books they own" ON lesson_books;

CREATE POLICY "Authenticated users have full access to lesson books" ON lesson_books
    FOR ALL USING (is_authenticated());

-- Lesson Objectives
DROP POLICY IF EXISTS "Users can view lesson objectives they own" ON lesson_objectives;
DROP POLICY IF EXISTS "Users can manage lesson objectives they own" ON lesson_objectives;

CREATE POLICY "Authenticated users have full access to lesson objectives" ON lesson_objectives
    FOR ALL USING (is_authenticated());

-- Lesson Methods
DROP POLICY IF EXISTS "Users can view lesson methods they own" ON lesson_methods;
DROP POLICY IF EXISTS "Users can manage lesson methods they own" ON lesson_methods;

CREATE POLICY "Authenticated users have full access to lesson methods" ON lesson_methods
    FOR ALL USING (is_authenticated());

-- Lesson Tasks
DROP POLICY IF EXISTS "Users can view lesson tasks they own" ON lesson_tasks;
DROP POLICY IF EXISTS "Users can manage lesson tasks they own" ON lesson_tasks;

CREATE POLICY "Authenticated users have full access to lesson tasks" ON lesson_tasks
    FOR ALL USING (is_authenticated());