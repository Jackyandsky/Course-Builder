-- Create user profiles table with role and verification support
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    grade_level INTEGER,
    date_of_birth DATE,
    parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    parent_email TEXT,
    needs_verification BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_needs_verification ON user_profiles(needs_verification);
CREATE INDEX idx_user_profiles_parent_id ON user_profiles(parent_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin' AND verified_at IS NOT NULL
        )
    );

-- Admins can update all profiles (for verification)
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin' AND verified_at IS NOT NULL
        )
    );

-- Teachers can view students in their groups
CREATE POLICY "Teachers can view students" ON user_profiles
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM user_profiles teacher
            WHERE teacher.id = auth.uid() 
            AND teacher.role = 'teacher' 
            AND teacher.verified_at IS NOT NULL
        )
    );

-- Parents can view their children
CREATE POLICY "Parents can view children" ON user_profiles
    FOR SELECT USING (parent_id = auth.uid());

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        role,
        needs_verification,
        verified_at,
        metadata
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'parent') THEN false
            ELSE COALESCE((NEW.raw_user_meta_data->>'needs_verification')::boolean, true)
        END,
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'parent') THEN NOW()
            ELSE NULL
        END,
        NEW.raw_user_meta_data
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();