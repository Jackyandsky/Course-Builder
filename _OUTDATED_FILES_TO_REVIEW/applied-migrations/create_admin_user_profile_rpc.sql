-- Create RPC function for admin user creation
-- This is separate from the automatic trigger function
CREATE OR REPLACE FUNCTION admin_create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_role user_role,
    p_grade_level INTEGER DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_parent_email TEXT DEFAULT NULL,
    p_group_ids UUID[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id UUID;
    group_id UUID;
BEGIN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can create user profiles';
    END IF;

    -- Insert the user profile
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role,
        grade_level,
        phone,
        parent_email
    ) VALUES (
        p_user_id,
        p_email,
        p_full_name,
        p_role,
        p_grade_level,
        p_phone,
        p_parent_email
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        grade_level = EXCLUDED.grade_level,
        phone = EXCLUDED.phone,
        parent_email = EXCLUDED.parent_email,
        updated_at = NOW()
    RETURNING id INTO profile_id;

    -- Add user to groups if provided
    IF p_group_ids IS NOT NULL THEN
        FOREACH group_id IN ARRAY p_group_ids
        LOOP
            INSERT INTO group_members (group_id, user_id)
            VALUES (group_id, p_user_id)
            ON CONFLICT (group_id, user_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN profile_id;
END;
$$;