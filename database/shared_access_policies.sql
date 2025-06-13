-- Shared Access RLS Policies for Course Builder
-- These policies allow shared access without authentication for users with permission

-- Drop existing restrictive policies and create shared access policies

-- Categories: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Allow shared access to categories" ON categories FOR ALL USING (true);

-- Courses: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
DROP POLICY IF EXISTS "Users can view public courses" ON courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

CREATE POLICY "Allow shared access to courses" ON courses FOR ALL USING (true);

-- Books: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can view public books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

CREATE POLICY "Allow shared access to books" ON books FOR ALL USING (true);

-- Vocabulary Groups: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can view public vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can insert their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can update their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can delete their own vocabulary groups" ON vocabulary_groups;

CREATE POLICY "Allow shared access to vocabulary groups" ON vocabulary_groups FOR ALL USING (true);

-- Vocabulary: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can insert their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can update their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can delete their own vocabulary" ON vocabulary;

CREATE POLICY "Allow shared access to vocabulary" ON vocabulary FOR ALL USING (true);

-- Vocabulary Group Items: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can insert vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can update vocabulary group items they own" ON vocabulary_group_items;
DROP POLICY IF EXISTS "Users can delete vocabulary group items they own" ON vocabulary_group_items;

CREATE POLICY "Allow shared access to vocabulary group items" ON vocabulary_group_items FOR ALL USING (true);

-- Objectives: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can view template objectives" ON objectives;
DROP POLICY IF EXISTS "Users can insert their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can update their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can delete their own objectives" ON objectives;

CREATE POLICY "Allow shared access to objectives" ON objectives FOR ALL USING (true);

-- Methods: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own methods" ON methods;
DROP POLICY IF EXISTS "Users can view template methods" ON methods;
DROP POLICY IF EXISTS "Users can insert their own methods" ON methods;
DROP POLICY IF EXISTS "Users can update their own methods" ON methods;
DROP POLICY IF EXISTS "Users can delete their own methods" ON methods;

CREATE POLICY "Allow shared access to methods" ON methods FOR ALL USING (true);

-- Tasks: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view template tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

CREATE POLICY "Allow shared access to tasks" ON tasks FOR ALL USING (true);

-- Schedules: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON schedules;

CREATE POLICY "Allow shared access to schedules" ON schedules FOR ALL USING (true);

-- Lessons: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lessons from their schedules" ON lessons;
DROP POLICY IF EXISTS "Users can insert lessons to their schedules" ON lessons;
DROP POLICY IF EXISTS "Users can update lessons in their schedules" ON lessons;
DROP POLICY IF EXISTS "Users can delete lessons from their schedules" ON lessons;

CREATE POLICY "Allow shared access to lessons" ON lessons FOR ALL USING (true);

-- Course Books: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view course books they own" ON course_books;
DROP POLICY IF EXISTS "Users can manage course books they own" ON course_books;

CREATE POLICY "Allow shared access to course books" ON course_books FOR ALL USING (true);

-- Course Vocabulary Groups: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view course vocabulary groups they own" ON course_vocabulary_groups;
DROP POLICY IF EXISTS "Users can manage course vocabulary groups they own" ON course_vocabulary_groups;

CREATE POLICY "Allow shared access to course vocabulary groups" ON course_vocabulary_groups FOR ALL USING (true);

-- Lesson Objectives: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lesson objectives they own" ON lesson_objectives;
DROP POLICY IF EXISTS "Users can manage lesson objectives they own" ON lesson_objectives;

CREATE POLICY "Allow shared access to lesson objectives" ON lesson_objectives FOR ALL USING (true);

-- Lesson Methods: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lesson methods they own" ON lesson_methods;
DROP POLICY IF EXISTS "Users can manage lesson methods they own" ON lesson_methods;

CREATE POLICY "Allow shared access to lesson methods" ON lesson_methods FOR ALL USING (true);

-- Lesson Tasks: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lesson tasks they own" ON lesson_tasks;
DROP POLICY IF EXISTS "Users can manage lesson tasks they own" ON lesson_tasks;

CREATE POLICY "Allow shared access to lesson tasks" ON lesson_tasks FOR ALL USING (true);

-- Lesson Books: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lesson books they own" ON lesson_books;
DROP POLICY IF EXISTS "Users can manage lesson books they own" ON lesson_books;

CREATE POLICY "Allow shared access to lesson books" ON lesson_books FOR ALL USING (true);

-- Lesson Vocabulary: Allow all operations for shared access
DROP POLICY IF EXISTS "Users can view lesson vocabulary they own" ON lesson_vocabulary;
DROP POLICY IF EXISTS "Users can manage lesson vocabulary they own" ON lesson_vocabulary;

CREATE POLICY "Allow shared access to lesson vocabulary" ON lesson_vocabulary FOR ALL USING (true);

-- Public Links: Keep existing policies as they are appropriate for public access
-- (No changes needed for public_links table)