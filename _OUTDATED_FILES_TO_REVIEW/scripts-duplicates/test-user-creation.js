const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testUserCreation() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // First, sign in as the admin user
  console.log('Signing in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'jackyandsky@gmail.com',
    password: 'changenow2025' // You'll need to update this with the actual password
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('Successfully signed in as admin');
  
  // Test creating a teacher via the RPC function
  console.log('\nTesting teacher creation via RPC...');
  const { data, error } = await supabase.rpc('invite_user', {
    p_email: 'test.teacher@example.com',
    p_full_name: 'Test Teacher',
    p_role: 'teacher',
    p_grade_level: null,
    p_phone: '+1234567890',
    p_parent_email: null,
    p_group_ids: null
  });
  
  if (error) {
    console.error('Error creating teacher:', error);
  } else {
    console.log('Teacher created successfully:', data);
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\nSigned out');
}

testUserCreation().catch(console.error);