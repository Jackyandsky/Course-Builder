const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.log('You can find it in your Supabase project settings under API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'jackyandsky@gmail.com';
  const newPassword = 'Jacky789';
  
  try {
    // Update the user's password using the service role key
    const { data, error } = await supabase.auth.admin.updateUserById(
      '4ef526fd-43a0-44fd-82e4-2ab404ef673c', // User ID from the database
      { password: newPassword }
    );

    if (error) {
      console.error('Error resetting password:', error.message);
    } else {
      console.log('Password successfully reset for:', email);
      console.log('New password:', newPassword);
    }
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

resetPassword();