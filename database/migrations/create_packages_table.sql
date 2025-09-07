-- Create packages table for course enrollment
CREATE TABLE IF NOT EXISTS packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommended_level VARCHAR(100), -- e.g., 'Beginner', 'Intermediate', 'Advanced'
    services JSONB NOT NULL DEFAULT '[]', -- Array of services with order
    price DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('direct', 'booking')), -- 'direct' for immediate purchase, 'booking' for form->booking flow
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]', -- Additional features/benefits
    duration_months INTEGER, -- Package duration in months (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active packages
CREATE INDEX idx_packages_active ON packages(is_active, display_order);

-- Create index for payment type
CREATE INDEX idx_packages_payment_type ON packages(payment_type);

-- Add RLS policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow public to read active packages
CREATE POLICY "Public can view active packages" ON packages
    FOR SELECT USING (is_active = true);

-- Allow authenticated users with admin role to manage packages
CREATE POLICY "Admins can manage packages" ON packages
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create course_packages junction table to link courses with packages
CREATE TABLE IF NOT EXISTS course_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false, -- Mark default package for a course
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, package_id)
);

-- Index for quick lookups
CREATE INDEX idx_course_packages_course ON course_packages(course_id);
CREATE INDEX idx_course_packages_package ON course_packages(package_id);

-- Add RLS policies for course_packages
ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;

-- Allow public to read course packages
CREATE POLICY "Public can view course packages" ON course_packages
    FOR SELECT USING (true);

-- Allow admins to manage course packages
CREATE POLICY "Admins can manage course packages" ON course_packages
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for initial packages (you can remove this in production)
INSERT INTO packages (title, description, recommended_level, services, price, payment_type, display_order, features, duration_months) VALUES
('Basic Package', 'Perfect for beginners starting their learning journey', 'Beginner', 
 '[
   {"order": 1, "name": "Course Access", "description": "Full access to course materials"},
   {"order": 2, "name": "Basic Support", "description": "Email support within 48 hours"},
   {"order": 3, "name": "Downloadable Resources", "description": "PDF worksheets and guides"}
 ]'::jsonb, 
 99.99, 'direct', 1, 
 '["Self-paced learning", "Certificate of completion", "Mobile access"]'::jsonb, 3),

('Professional Package', 'Comprehensive package for serious learners', 'Intermediate', 
 '[
   {"order": 1, "name": "Course Access", "description": "Full access to course materials"},
   {"order": 2, "name": "Priority Support", "description": "24-hour response time"},
   {"order": 3, "name": "1-on-1 Sessions", "description": "Two 30-minute sessions per month"},
   {"order": 4, "name": "Practice Exercises", "description": "Additional practice materials"},
   {"order": 5, "name": "Progress Tracking", "description": "Detailed progress reports"}
 ]'::jsonb, 
 199.99, 'booking', 2, 
 '["Personalized learning path", "Priority certificate", "Lifetime access", "Group discussions"]'::jsonb, 6),

('Premium Package', 'Ultimate learning experience with personal coaching', 'Advanced', 
 '[
   {"order": 1, "name": "Course Access", "description": "Full access to all materials"},
   {"order": 2, "name": "Dedicated Support", "description": "Direct access to instructors"},
   {"order": 3, "name": "Weekly 1-on-1", "description": "Weekly 60-minute sessions"},
   {"order": 4, "name": "Custom Curriculum", "description": "Tailored to your goals"},
   {"order": 5, "name": "Project Review", "description": "Detailed feedback on projects"},
   {"order": 6, "name": "Career Guidance", "description": "Job preparation support"}
 ]'::jsonb, 
 499.99, 'booking', 3, 
 '["White-glove service", "Guaranteed results", "Industry connections", "Portfolio development", "Interview preparation"]'::jsonb, 12);