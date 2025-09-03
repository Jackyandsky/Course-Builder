-- Drop existing bookings table and related objects if they exist
DROP VIEW IF EXISTS upcoming_bookings CASCADE;
DROP VIEW IF EXISTS teacher_schedules CASCADE;
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS booking_status_change ON bookings;
DROP FUNCTION IF EXISTS update_bookings_updated_at();
DROP FUNCTION IF EXISTS handle_booking_status_change();
DROP TABLE IF EXISTS bookings CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS booking_type CASCADE;

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create simplified bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Essential booking info
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    status booking_status DEFAULT 'pending',
    
    -- All business data in metadata
    metadata JSONB DEFAULT '{}' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Ensure booking uniqueness per teacher per slot
    UNIQUE(booking_date, booking_time, teacher_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Create GIN index for JSONB metadata queries
CREATE INDEX idx_bookings_metadata ON bookings USING GIN (metadata);

-- Create a composite index for common queries
CREATE INDEX idx_bookings_date_time_teacher ON bookings(booking_date, booking_time, teacher_id);

-- Add RLS policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending bookings
CREATE POLICY "Users can update own pending bookings" ON bookings
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Policy: Teachers can view bookings assigned to them
CREATE POLICY "Teachers can view assigned bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = teacher_id);

-- Policy: Teachers can update bookings assigned to them
CREATE POLICY "Teachers can update assigned bookings" ON bookings
    FOR UPDATE
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to bookings" ON bookings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- Create a function to handle status changes
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set appropriate timestamp based on status change
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        NEW.confirmed_at = NOW();
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
CREATE TRIGGER booking_status_change
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_booking_status_change();

-- Create a view for upcoming bookings with metadata
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT 
    b.id,
    b.user_id,
    b.teacher_id,
    b.booking_date,
    b.booking_time,
    b.status,
    b.metadata,
    b.metadata->>'type' as booking_type,
    b.metadata->>'grade' as grade,
    b.metadata->>'teacher_name' as teacher_name,
    b.created_at,
    up_user.full_name as user_full_name,
    up_user.email as user_email,
    up_teacher.full_name as teacher_full_name,
    up_teacher.email as teacher_email
FROM bookings b
LEFT JOIN user_profiles up_user ON b.user_id = up_user.id
LEFT JOIN user_profiles up_teacher ON b.teacher_id = up_teacher.id
WHERE b.status IN ('pending', 'confirmed')
    AND b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date, b.booking_time;

-- Create a view for teacher schedules with metadata
CREATE OR REPLACE VIEW teacher_schedules AS
SELECT 
    b.teacher_id,
    b.booking_date,
    b.booking_time,
    b.status,
    b.metadata,
    b.metadata->>'type' as booking_type,
    b.metadata->>'grade' as grade,
    b.metadata->>'student_name' as student_name,
    b.metadata->>'teacher_name' as teacher_name,
    up.full_name as teacher_full_name,
    up.email as teacher_email
FROM bookings b
LEFT JOIN user_profiles up ON b.teacher_id = up.id
WHERE b.status IN ('confirmed', 'completed')
ORDER BY b.booking_date, b.booking_time;

-- Add comments
COMMENT ON TABLE bookings IS 'Simplified bookings table with all business data in metadata';
COMMENT ON COLUMN bookings.metadata IS 'Stores all booking-specific data including type, diagnosis answers, review details, etc.';

/*
Example metadata structure:
{
  "type": "diagnosis",
  "grade": "5",
  "teacher_name": "John Smith",
  
  // For diagnosis bookings
  "diagnosis_answers": {
    "q1": "answer1",
    "q2": "answer2"
  },
  "diagnosis_test_date": "2024-01-10",
  
  // For progress review bookings
  "student_name": "Jane Doe",
  "parent_name": "John Doe",
  "phone": "(123) 456-7890",
  "duration_since_enrollment": "3-6 months",
  "review_type": "Comprehensive Academic Review",
  "areas_of_concern": "Writing skills need improvement",
  
  // Common optional fields
  "notes": "User notes",
  "internal_notes": "Admin/teacher notes",
  "cancelled_reason": "Reason for cancellation"
}
*/