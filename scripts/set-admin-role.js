#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setAdminRole(email) {
  try {
    // First, check if the user exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return;
    }

    if (!existingProfile) {
      console.log(`Profile with email ${email} not found.`);
      
      // Try to find by auth.users table
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
      }

      const user = authUser.users.find(u => u.email === email);
      
      if (!user) {
        console.error(`User with email ${email} not found in auth.users`);
        return;
      }

      // Create profile with admin role
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: 'admin',
          full_name: user.user_metadata?.full_name || email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return;
      }

      console.log('✅ Profile created with admin role:', newProfile);
    } else {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }

      console.log('✅ Profile updated with admin role:', updatedProfile);
    }

    console.log(`\n🎉 Successfully set admin role for ${email}`);
    console.log('You can now access the admin panel and orders management.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/set-admin-role.js <email>');
  console.log('Example: node scripts/set-admin-role.js admin@example.com');
  process.exit(1);
}

console.log(`Setting admin role for: ${email}`);
setAdminRole(email).then(() => {
  process.exit(0);
});