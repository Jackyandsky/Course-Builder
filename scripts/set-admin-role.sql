-- Script to set admin role for a user
-- Replace 'your-email@example.com' with the actual email address

-- First, check if the profile exists
DO $$
DECLARE
    user_email TEXT := 'your-email@example.com'; -- CHANGE THIS
    user_id UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found in auth.users', user_email;
        RETURN;
    END IF;
    
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        -- Update existing profile
        UPDATE public.profiles 
        SET 
            role = 'admin',
            updated_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE 'Updated profile for % to admin role', user_email;
    ELSE
        -- Create new profile with admin role
        INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
        VALUES (
            user_id,
            user_email,
            'admin',
            split_part(user_email, '@', 1), -- Use email prefix as name
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created admin profile for %', user_email;
    END IF;
END $$;

-- Verify the change
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE email = 'your-email@example.com'; -- CHANGE THIS