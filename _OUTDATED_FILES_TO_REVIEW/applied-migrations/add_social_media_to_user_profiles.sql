-- Add social media field to user_profiles table
-- This stores social media contact information as JSONB

-- Add social_media column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.social_media IS 'Social media contact information stored as JSONB. Example: {"teams": "user@example.com", "wechat": "username123", "whatsapp": "+1234567890", "telegram": "@username"}';

-- Create an index for better performance when querying social media data
CREATE INDEX IF NOT EXISTS idx_user_profiles_social_media ON user_profiles USING gin(social_media);

-- Update existing rows to have empty social_media object if NULL
UPDATE user_profiles 
SET social_media = '{}'::jsonb 
WHERE social_media IS NULL;