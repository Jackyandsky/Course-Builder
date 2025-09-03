-- Remove RLS from user_profiles table
-- This migration removes Row Level Security policies from the user_profiles table

-- Drop all existing RLS policies on the user_profiles table (if any exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON user_profiles;
DROP POLICY IF EXISTS "Parents can view their children profiles" ON user_profiles;

-- Disable Row Level Security on the user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users on user_profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;