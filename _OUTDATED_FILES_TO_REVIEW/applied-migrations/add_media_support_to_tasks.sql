-- Add media support fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS media_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_media_types text[] DEFAULT ARRAY['image', 'video', 'audio', 'document'],
ADD COLUMN IF NOT EXISTS max_file_size_mb integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_files_count integer DEFAULT 5;

-- Create task_media table for file references
CREATE TABLE IF NOT EXISTS task_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,          -- Relative path: /uploads/tasks/2025/01/task_id/file.jpg
  file_name text NOT NULL,          -- Original filename
  display_name text,                -- User-friendly name
  file_type text NOT NULL,          -- image/video/audio/document
  file_size bigint NOT NULL,        -- Size in bytes
  mime_type text,                    -- MIME type for serving
  thumbnail_path text,              -- Path to thumbnail (for images/videos)
  upload_date timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}',      -- Additional metadata (dimensions, duration, etc.)
  is_active boolean DEFAULT true,   -- Soft delete flag
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_media_task_id ON task_media(task_id);
CREATE INDEX IF NOT EXISTS idx_task_media_user_id ON task_media(user_id);
CREATE INDEX IF NOT EXISTS idx_task_media_upload_date ON task_media(upload_date);
CREATE INDEX IF NOT EXISTS idx_task_media_is_active ON task_media(is_active);

-- Add RLS policies for task_media
ALTER TABLE task_media ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view own task media" ON task_media
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upload media for tasks they have access to
CREATE POLICY "Users can insert task media" ON task_media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update own task media" ON task_media
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete own task media" ON task_media
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all media
CREATE POLICY "Admins can manage all task media" ON task_media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE task_media IS 'Stores references to uploaded media files for tasks';
COMMENT ON COLUMN task_media.file_path IS 'Relative path to the file in the public/uploads directory';
COMMENT ON COLUMN task_media.file_type IS 'Type category: image, video, audio, or document';
COMMENT ON COLUMN task_media.metadata IS 'JSON metadata like image dimensions, video duration, etc.';