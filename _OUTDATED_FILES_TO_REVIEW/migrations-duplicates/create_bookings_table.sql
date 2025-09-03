-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create booking type enum
CREATE TYPE booking_type AS ENUM ('diagnosis', 'progress_review', 'consultation', 'tutoring');

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Booking basic info
    booking_type booking_type NOT NULL,
    status booking_status DEFAULT 'pending',
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    grade VARCHAR(10),
    
    -- User information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255),
    parent_name VARCHAR(255),
    phone VARCHAR(50),
    
    -- Teacher assignment
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255),
    
    -- Metadata for different booking types
    metadata JSONB DEFAULT '{}',
    
    -- Diagnosis specific data
    diagnosis_answers JSONB, -- Store the test answers
    diagnosis_test_date DATE, -- Original test date from diagnosis form
    
    -- Progress review specific data
    duration_since_enrollment VARCHAR(50), -- e.g., "3-6 months"
    review_type VARCHAR(100), -- e.g., "Comprehensive Academic Review"
    areas_of_concern TEXT,
    
    -- Additional fields
    notes TEXT,
    internal_notes TEXT, -- For admin/teacher use only
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    
    -- Ensure booking uniqueness per user per slot
    UNIQUE(booking_date, booking_time, teacher_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_type ON bookings(booking_type);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

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

-- Create a view for upcoming bookings
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT 
    b.*,
    up_student.full_name as student_full_name,
    up_teacher.full_name as teacher_full_name,
    up_teacher.email as teacher_email
FROM bookings b
LEFT JOIN user_profiles up_student ON b.user_id = up_student.id
LEFT JOIN user_profiles up_teacher ON b.teacher_id = up_teacher.id
WHERE b.status IN ('pending', 'confirmed')
    AND b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date, b.booking_time;

-- Create a view for teacher schedules
CREATE OR REPLACE VIEW teacher_schedules AS
SELECT 
    b.teacher_id,
    b.teacher_name,
    b.booking_date,
    b.booking_time,
    b.status,
    b.booking_type,
    b.student_name,
    b.grade,
    up.full_name as teacher_full_name
FROM bookings b
LEFT JOIN user_profiles up ON b.teacher_id = up.id
WHERE b.status IN ('confirmed', 'completed')
ORDER BY b.booking_date, b.booking_time;

-- Add comment to table
COMMENT ON TABLE bookings IS 'Stores all booking appointments including diagnosis tests and progress reviews';
COMMENT ON COLUMN bookings.metadata IS 'Flexible JSONB field for storing additional booking-specific data';
COMMENT ON COLUMN bookings.diagnosis_answers IS 'Stores the answers from diagnosis tests as JSONB';
COMMENT ON COLUMN bookings.internal_notes IS 'Notes visible only to teachers and admins';