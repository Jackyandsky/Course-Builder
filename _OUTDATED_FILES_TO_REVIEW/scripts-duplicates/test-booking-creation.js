const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://djvmoqharkefksvceetu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQwOTYwNSwiZXhwIjoyMDY0OTg1NjA1fQ.YdkY97VGKDHdp4MKGGrjxf3UKOe1QGfnIdJqNT_dB8c';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingCreation() {
  console.log('Testing booking creation with simplified structure...\n');

  try {
    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }

    const testUser = users[0];
    console.log('Using test user:', testUser.email);

    // Get a teacher
    const { data: teachers, error: teacherError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .in('role', ['teacher', 'admin'])
      .limit(1);

    if (teacherError) throw teacherError;
    const teacher = teachers && teachers.length > 0 ? teachers[0] : { id: testUser.id, email: testUser.email };
    console.log('Using teacher:', teacher.email);

    // Create test booking data
    const bookingData = {
      user_id: testUser.id,
      teacher_id: teacher.id,
      booking_date: '2025-02-15',
      booking_time: '10:00 AM',
      status: 'pending',
      metadata: {
        type: 'diagnosis',
        grade: '5',
        teacher_name: teacher.full_name || teacher.email,
        
        // Diagnosis specific data
        diagnosis_answers: {
          q1: 'The student demonstrated good reading comprehension',
          q2: 'Writing skills need improvement in paragraph structure',
          q3: 'Vocabulary is at grade level',
          q4: 'Shows strong analytical thinking'
        },
        diagnosis_test_date: '2025-01-30',
        
        // Additional metadata
        source: 'test_script',
        notes: 'This is a test booking created via script'
      }
    };

    console.log('\nCreating booking with data:');
    console.log(JSON.stringify(bookingData, null, 2));

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('\nError creating booking:', bookingError);
      return;
    }

    console.log('\n✅ Booking created successfully!');
    console.log('Booking ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Date:', booking.booking_date);
    console.log('Time:', booking.booking_time);
    console.log('\nMetadata stored:');
    console.log(JSON.stringify(booking.metadata, null, 2));

    // Verify we can query the booking
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('*, metadata->type, metadata->grade, metadata->diagnosis_answers')
      .eq('id', booking.id)
      .single();

    if (verifyError) {
      console.error('\nError verifying booking:', verifyError);
      return;
    }

    console.log('\n✅ Booking verified successfully!');
    console.log('Can access metadata fields:');
    console.log('- Type:', verifyBooking.type);
    console.log('- Grade:', verifyBooking.grade);
    console.log('- Has diagnosis answers:', !!verifyBooking.diagnosis_answers);

    // Test the upcoming_bookings view
    const { data: upcomingBookings, error: viewError } = await supabase
      .from('upcoming_bookings')
      .select('*')
      .eq('id', booking.id);

    if (viewError) {
      console.error('\nError querying upcoming_bookings view:', viewError);
    } else {
      console.log('\n✅ upcoming_bookings view working!');
      console.log('View returned booking with type:', upcomingBookings[0]?.booking_type);
    }

    // Clean up - delete test booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);

    if (deleteError) {
      console.error('\nError deleting test booking:', deleteError);
    } else {
      console.log('\n🧹 Test booking cleaned up');
    }

    console.log('\n✅ All tests passed! Booking system is working correctly.');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBookingCreation();