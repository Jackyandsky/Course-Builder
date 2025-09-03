-- Row Level Security Policies for Course Builder
-- Enable RLS on all tables

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- Courses RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own courses" ON courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public courses" ON courses
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" ON courses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" ON courses
    FOR DELETE USING (auth.uid() = user_id);

-- Books RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own books" ON books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public books" ON books
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own books" ON books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON books
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON books
    FOR DELETE USING (auth.uid() = user_id);

-- Vocabulary Groups RLS
ALTER TABLE vocabulary_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocabulary groups" ON vocabulary_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public vocabulary groups" ON vocabulary_groups
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own vocabulary groups" ON vocabulary_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary groups" ON vocabulary_groups
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary groups" ON vocabulary_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Vocabulary RLS
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocabulary" ON vocabulary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary" ON vocabulary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary" ON vocabulary
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary" ON vocabulary
    FOR DELETE USING (auth.uid() = user_id);

-- Vocabulary Group Items RLS
ALTER TABLE vocabulary_group_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vocabulary group items they own" ON vocabulary_group_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vocabulary_groups vg
            WHERE vg.id = vocabulary_group_items.vocabulary_group_id
            AND vg.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vocabulary group items they own" ON vocabulary_group_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vocabulary_groups vg
            WHERE vg.id = vocabulary_group_items.vocabulary_group_id
            AND vg.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update vocabulary group items they own" ON vocabulary_group_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vocabulary_groups vg
            WHERE vg.id = vocabulary_group_items.vocabulary_group_id
            AND vg.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vocabulary group items they own" ON vocabulary_group_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vocabulary_groups vg
            WHERE vg.id = vocabulary_group_items.vocabulary_group_id
            AND vg.user_id = auth.uid()
        )
    );

-- Objectives RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own objectives" ON objectives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view template objectives" ON objectives
    FOR SELECT USING (is_template = true);

CREATE POLICY "Users can insert their own objectives" ON objectives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives" ON objectives
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objectives" ON objectives
    FOR DELETE USING (auth.uid() = user_id);

-- Methods RLS
ALTER TABLE methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own methods" ON methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view template methods" ON methods
    FOR SELECT USING (is_template = true);

CREATE POLICY "Users can insert their own methods" ON methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own methods" ON methods
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own methods" ON methods
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view template tasks" ON tasks
    FOR SELECT USING (is_template = true);

CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Schedules RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules" ON schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON schedules
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Lessons RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons from their schedules" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = lessons.schedule_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lessons to their schedules" ON lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = lessons.schedule_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update lessons in their schedules" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = lessons.schedule_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete lessons from their schedules" ON lessons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = lessons.schedule_id
            AND s.user_id = auth.uid()
        )
    );

-- Course Books RLS
ALTER TABLE course_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view course books they own" ON course_books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = course_books.course_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage course books they own" ON course_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = course_books.course_id
            AND c.user_id = auth.uid()
        )
    );

-- Course Vocabulary Groups RLS
ALTER TABLE course_vocabulary_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view course vocabulary groups they own" ON course_vocabulary_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = course_vocabulary_groups.course_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage course vocabulary groups they own" ON course_vocabulary_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = course_vocabulary_groups.course_id
            AND c.user_id = auth.uid()
        )
    );

-- Lesson Objectives RLS
ALTER TABLE lesson_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson objectives they own" ON lesson_objectives
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_objectives.lesson_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson objectives they own" ON lesson_objectives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_objectives.lesson_id
            AND s.user_id = auth.uid()
        )
    );

-- Lesson Methods RLS
ALTER TABLE lesson_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson methods they own" ON lesson_methods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_methods.lesson_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson methods they own" ON lesson_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_methods.lesson_id
            AND s.user_id = auth.uid()
        )
    );

-- Lesson Tasks RLS
ALTER TABLE lesson_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson tasks they own" ON lesson_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_tasks.lesson_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson tasks they own" ON lesson_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_tasks.lesson_id
            AND s.user_id = auth.uid()
        )
    );

-- Lesson Books RLS
ALTER TABLE lesson_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson books they own" ON lesson_books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_books.lesson_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson books they own" ON lesson_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_books.lesson_id
            AND s.user_id = auth.uid()
        )
    );

-- Lesson Vocabulary RLS
ALTER TABLE lesson_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lesson vocabulary they own" ON lesson_vocabulary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_vocabulary.lesson_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson vocabulary they own" ON lesson_vocabulary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN schedules s ON s.id = l.schedule_id
            WHERE l.id = lesson_vocabulary.lesson_id
            AND s.user_id = auth.uid()
        )
    );

-- Content RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view store content" ON content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = content.category_id
            AND c.name IN ('Decoders', 'Complete Study Packages', 'Standardizers', 'LEX')
        )
    );

CREATE POLICY "Public can view library content" ON content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = content.category_id
            AND c.name IN ('Virtual Library', 'Physical Library')
        )
    );

CREATE POLICY "Users can view their own content" ON content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON content
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON content
    FOR DELETE USING (auth.uid() = user_id);

-- Public Links RLS
ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active public links" ON public_links
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can manage their own public links" ON public_links
    FOR ALL USING (
        CASE entity_type
            WHEN 'course' THEN EXISTS (SELECT 1 FROM courses WHERE id = entity_id AND user_id = auth.uid())
            WHEN 'book' THEN EXISTS (SELECT 1 FROM books WHERE id = entity_id AND user_id = auth.uid())
            WHEN 'vocabulary_group' THEN EXISTS (SELECT 1 FROM vocabulary_groups WHERE id = entity_id AND user_id = auth.uid())
            ELSE false
        END
    );
