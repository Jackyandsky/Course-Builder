-- Create admin profile for existing user
-- Replace the user ID with your actual user ID from auth.users table

-- First, check if the user exists
SELECT id, email FROM auth.users WHERE email = 'jackyandsky@gmail.com';

-- Create or update the user profile
INSERT INTO user_profiles (
    id,
    email,
    role,
    full_name,
    first_name,
    last_name,
    verified_at,
    needs_verification,
    created_at,
    updated_at
) 
SELECT 
    id,
    email,
    'admin',
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(raw_user_meta_data->>'last_name', 'User'),
    NOW(), -- Set as verified
    false,  -- No verification needed
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'jackyandsky@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    verified_at = NOW(),
    needs_verification = false,
    updated_at = NOW();

-- Verify the profile was created/updated
SELECT * FROM user_profiles WHERE email = 'jackyandsky@gmail.com';