const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://djvmoqharkefksvceetu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPackagesAccess() {
  console.log('Testing packages table access...\n');
  
  // Test with anon key (subject to RLS)
  if (supabaseAnonKey) {
    console.log('1. Testing with anon key (RLS enforced):');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('packages')
      .select('*');
    
    if (anonError) {
      console.log('   Error:', anonError.message);
    } else {
      console.log('   Found packages:', anonData?.length || 0);
      if (anonData && anonData.length > 0) {
        console.log('   First package:', anonData[0].title);
      }
    }
  } else {
    console.log('1. Anon key not found in environment');
  }
  
  // Test with service role key (bypasses RLS)
  if (supabaseServiceKey) {
    console.log('\n2. Testing with service role key (bypasses RLS):');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('packages')
      .select('*');
    
    if (serviceError) {
      console.log('   Error:', serviceError.message);
    } else {
      console.log('   Found packages:', serviceData?.length || 0);
      if (serviceData && serviceData.length > 0) {
        serviceData.forEach(pkg => {
          console.log(`   - ${pkg.title}: $${pkg.price} (${pkg.is_active ? 'active' : 'inactive'})`);
        });
      }
    }
    
    // Test RLS policies
    console.log('\n3. Testing RLS policies:');
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'packages');
    
    if (policyError) {
      console.log('   Error fetching policies:', policyError.message);
    } else {
      console.log('   Found policies:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }
  } else {
    console.log('\n2. Service role key not found in environment');
  }
  
  // Test public API endpoint
  console.log('\n4. Testing API endpoint:');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/packages`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('   API returned packages:', Array.isArray(data) ? data.length : 0);
    } else {
      console.log('   API error:', data.error);
    }
  } catch (error) {
    console.log('   Failed to call API:', error.message);
  }
}

testPackagesAccess().catch(console.error);