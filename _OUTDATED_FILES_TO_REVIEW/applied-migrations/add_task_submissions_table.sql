-- Create task_submissions table to track when users complete tasks
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL, -- Optional: which course context
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL, -- Optional: which lesson context
  status text NOT NULL DEFAULT 'pending', -- pending, submitted, approved, rejected
  submission_text text, -- Optional text submission
  submission_data jsonb DEFAULT '{}', -- Additional submission data
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text,
  score integer, -- Optional score out of task.points
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure one submission per user per task (can be modified if multiple attempts allowed)
  UNIQUE(task_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_at ON task_submissions(submitted_at);

-- Add RLS policies
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON task_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create own submissions" ON task_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions" ON task_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins and instructors can manage all submissions
CREATE POLICY "Admins can manage all submissions" ON task_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'instructor')
    )
  );

-- Add comment
COMMENT ON TABLE task_submissions IS 'Tracks user submissions for tasks including media uploads';
COMMENT ON COLUMN task_submissions.status IS 'Submission status: pending, submitted, approved, rejected';
COMMENT ON COLUMN task_submissions.submission_data IS 'JSON data including media file references and other metadata';