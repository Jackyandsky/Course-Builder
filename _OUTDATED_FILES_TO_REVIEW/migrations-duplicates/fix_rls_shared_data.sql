-- Fix RLS policies to allow viewing shared data for tasks, objectives, methods, and vocabulary

-- Drop existing policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view template tasks" ON tasks;

-- Create new policies for tasks that include shared data
CREATE POLICY "Users can view their own and shared tasks" ON tasks
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'
        OR is_template = true
    );

-- Drop existing policies for objectives
DROP POLICY IF EXISTS "Users can view their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can view template objectives" ON objectives;

-- Create new policies for objectives that include shared data
CREATE POLICY "Users can view their own and shared objectives" ON objectives
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'
        OR is_template = true
    );

-- Drop existing policies for methods
DROP POLICY IF EXISTS "Users can view their own methods" ON methods;
DROP POLICY IF EXISTS "Users can view template methods" ON methods;

-- Create new policies for methods that include shared data
CREATE POLICY "Users can view their own and shared methods" ON methods
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'
        OR is_template = true
    );

-- Drop existing policy for vocabulary
DROP POLICY IF EXISTS "Users can view their own vocabulary" ON vocabulary;

-- Create new policy for vocabulary that includes shared data
CREATE POLICY "Users can view their own and shared vocabulary" ON vocabulary
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'
    );

-- Drop existing policy for vocabulary groups
DROP POLICY IF EXISTS "Users can view their own vocabulary groups" ON vocabulary_groups;
DROP POLICY IF EXISTS "Users can view public vocabulary groups" ON vocabulary_groups;

-- Create new policy for vocabulary groups that includes shared data
CREATE POLICY "Users can view their own, shared and public vocabulary groups" ON vocabulary_groups
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'
        OR is_public = true
    );