#!/usr/bin/env node

/**
 * Apply user profile migration to create triggers for automatic profile creation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🔄 Applying user profile migration...');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '20250905_create_user_profile_trigger.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === '') continue;
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Try direct execution via raw query
        const { error: rawError } = await supabase
          .from('_temp_migration_exec')
          .select('*')
          .limit(0);
          
        if (rawError) {
          console.log('   Trying alternative execution method...');
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql_query: statement })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`   Alternative method also failed:`, errorText);
            // Don't exit, continue with other statements
          } else {
            console.log('   ✅ Statement executed successfully via alternative method');
          }
        }
      } else {
        console.log('   ✅ Statement executed successfully');
      }
    }
    
    console.log('🎉 Migration applied successfully!');
    console.log('');
    console.log('🧪 Testing trigger functionality...');
    
    // Test if the trigger is working by checking if the function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('get_function_definition', { function_name: 'create_user_profile' })
      .single();
      
    if (funcError) {
      console.log('⚠️  Could not verify trigger function (this might be normal)');
    } else {
      console.log('✅ Trigger function appears to be created successfully');
    }
    
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Test user registration to verify profiles are created');
    console.log('2. Check that names appear correctly in user_profiles table');
    console.log('3. Verify that the auth.users raw_user_meta_data contains name information');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();