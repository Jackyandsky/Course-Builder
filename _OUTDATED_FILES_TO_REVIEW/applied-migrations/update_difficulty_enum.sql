-- Update difficulty_level enum to use 'basic', 'standard', 'premium'
-- First, we need to create a new enum type
CREATE TYPE difficulty_level_new AS ENUM ('basic', 'standard', 'premium');

-- Update the courses table to use the new enum
ALTER TABLE courses 
  ALTER COLUMN difficulty DROP DEFAULT,
  ALTER COLUMN difficulty TYPE difficulty_level_new 
    USING CASE 
      WHEN difficulty = 'beginner' THEN 'basic'::difficulty_level_new
      WHEN difficulty = 'intermediate' THEN 'standard'::difficulty_level_new
      WHEN difficulty IN ('advanced', 'expert') THEN 'premium'::difficulty_level_new
      ELSE 'basic'::difficulty_level_new
    END,
  ALTER COLUMN difficulty SET DEFAULT 'basic';

-- Update the vocabulary_groups table to use the new enum
ALTER TABLE vocabulary_groups 
  ALTER COLUMN difficulty DROP DEFAULT,
  ALTER COLUMN difficulty TYPE difficulty_level_new 
    USING CASE 
      WHEN difficulty = 'beginner' THEN 'basic'::difficulty_level_new
      WHEN difficulty = 'intermediate' THEN 'standard'::difficulty_level_new
      WHEN difficulty IN ('advanced', 'expert') THEN 'premium'::difficulty_level_new
      ELSE 'basic'::difficulty_level_new
    END,
  ALTER COLUMN difficulty SET DEFAULT 'basic';

-- Update the vocabulary table to use the new enum
ALTER TABLE vocabulary 
  ALTER COLUMN difficulty DROP DEFAULT,
  ALTER COLUMN difficulty TYPE difficulty_level_new 
    USING CASE 
      WHEN difficulty = 'beginner' THEN 'basic'::difficulty_level_new
      WHEN difficulty = 'intermediate' THEN 'standard'::difficulty_level_new
      WHEN difficulty IN ('advanced', 'expert') THEN 'premium'::difficulty_level_new
      ELSE 'basic'::difficulty_level_new
    END,
  ALTER COLUMN difficulty SET DEFAULT 'basic';

-- Drop the old enum type
DROP TYPE difficulty_level;

-- Rename the new enum type to the original name
ALTER TYPE difficulty_level_new RENAME TO difficulty_level;