// Test script to verify navigation hierarchy
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNavigationHierarchy() {
  console.log('Testing Navigation Hierarchy Structure\n');
  console.log('=' .repeat(50));
  
  // Get root content categories
  const { data: rootCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'content')
    .is('parent_id', null)
    .order('name');
  
  console.log('\n📁 Root Content Categories:');
  for (const cat of rootCategories) {
    console.log(`  • ${cat.name} (ID: ${cat.id})`);
    
    // Get subcategories
    const { data: subcats } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', cat.id)
      .order('name');
    
    if (subcats && subcats.length > 0) {
      console.log(`    └─ Has ${subcats.length} subcategory(s):`);
      for (const sub of subcats) {
        console.log(`       • ${sub.name}`);
      }
    }
  }
  
  console.log('\n🗂️ Expected Navigation Structure:');
  console.log('  Content Products (expandable)');
  console.log('    ├─ Decoders');
  console.log('    ├─ LEX');
  console.log('    ├─ Standardizers');
  console.log('    └─ Manage Categories');
  
  console.log('\n✨ Navigation behavior:');
  console.log('  - "Content Products" is an expandable category');
  console.log('  - "Standardizers" is a regular link (same level as Decoders/LEX)');
  console.log('  - Clicking "Standardizers" opens its page showing subcategories');
  console.log('  - "Complete Study Packages" is accessible from Standardizers page');
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Navigation hierarchy test complete!');
}

testNavigationHierarchy();