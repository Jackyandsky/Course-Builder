const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAdmin() {
  const email = 'testadmin@coursebuilder.com';
  const password = 'TestAdmin123!';
  
  try {
    // First, try to sign up a new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Admin',
          full_name: 'Test Admin',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError.message);
      
      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error('Sign in error:', signInError.message);
        } else {
          console.log('Successfully signed in existing user:', email);
        }
      }
    } else {
      console.log('Successfully created new admin user:', email);
      console.log('Password:', password);
      console.log('User ID:', signUpData.user?.id);
      
      // Now update the user profile to set admin role
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: signUpData.user.id,
            email: email,
            first_name: 'Test',
            last_name: 'Admin',
            full_name: 'Test Admin',
            role: 'admin'
          });
        
        if (profileError) {
          console.error('Profile update error:', profileError.message);
        } else {
          console.log('Profile updated with admin role');
        }
      }
    }
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

createTestAdmin();