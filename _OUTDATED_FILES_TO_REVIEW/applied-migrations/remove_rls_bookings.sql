-- Remove RLS from bookings table only
-- This migration removes Row Level Security policies from the bookings table

-- Drop all existing RLS policies on the bookings table (if any exist)
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Teachers can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Teachers can manage their bookings" ON bookings;

-- Disable Row Level Security on the bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users on bookings table
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;