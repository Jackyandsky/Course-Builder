-- Fix Essay RLS Policies
-- Remove references to non-existent users table and simplify policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow users to manage own essays" ON essay_content;
DROP POLICY IF EXISTS "Allow admins full access" ON essay_content;

-- Create working policies without referencing users table
CREATE POLICY "Allow users to manage own essays" ON essay_content
    FOR ALL
    USING (auth.uid() = created_by);

-- Allow users to insert their own essays (need this for essay creation)
CREATE POLICY "Allow users to insert own essays" ON essay_content
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Allow users to read published essays and their own essays
CREATE POLICY "Allow read essays" ON essay_content
    FOR SELECT
    USING (is_published = true OR auth.uid() = created_by);