// Test script to verify Standardizers page access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStandardizersAccess() {
  console.log('Testing Standardizers Page Access\n');
  console.log('=' .repeat(50));
  
  // Get Standardizers category
  const { data: standardizers } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'content')
    .eq('name', 'Standardizers')
    .single();
  
  if (!standardizers) {
    console.error('❌ Standardizers category not found');
    return;
  }
  
  console.log(`✅ Standardizers category found (ID: ${standardizers.id})`);
  
  // Get subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', standardizers.id);
  
  console.log(`   Subcategories: ${subcategories?.length || 0}`);
  
  if (subcategories && subcategories.length > 0) {
    for (const sub of subcategories) {
      const { count } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', sub.id);
      
      console.log(`   • ${sub.name}: ${count || 0} items`);
    }
  }
  
  console.log('\n📱 User Navigation Flow:');
  console.log('1. Click "Content Products" in sidebar to expand');
  console.log('2. Click "Standardizers" (appears at same level as Decoders/LEX)');
  console.log('3. Standardizers page opens showing:');
  console.log('   - "All Standardizers" card');
  console.log('   - "Complete Study Packages" card');
  console.log('4. Click on a card to view its content');
  
  console.log('\n🔗 Direct URLs:');
  console.log('   • /admin/standardizers - Main page with subcategory cards');
  console.log('   • /admin/standardizers?subcategory=' + (subcategories?.[0]?.id || 'ID') + ' - Direct to subcategory');
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Standardizers access test complete!');
}

testStandardizersAccess();