const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testContentAccess() {
  try {
    console.log('Testing content category access...\n');
    console.log('=' .repeat(50));

    // Test 1: Get Standardizers and its subcategories
    console.log('\n📋 Test 1: Standardizers Structure');
    
    const { data: standardizers, error: stdError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .eq('name', 'Standardizers')
      .single();

    if (stdError || !standardizers) {
      console.error('❌ Standardizers not found:', stdError);
      return;
    }

    console.log(`✅ Found Standardizers (ID: ${standardizers.id})`);

    // Get subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', standardizers.id);

    if (subError) {
      console.error('❌ Error fetching subcategories:', subError);
      return;
    }

    console.log(`   Subcategories: ${subcategories?.length || 0}`);
    subcategories?.forEach(sub => {
      console.log(`   └─ ${sub.name} (ID: ${sub.id})`);
    });

    // Test 2: Check Complete Study Packages
    console.log('\n📋 Test 2: Complete Study Packages Access');
    
    const completeStudyPackages = subcategories?.find(s => s.name === 'Complete Study Packages');
    
    if (completeStudyPackages) {
      console.log(`✅ Complete Study Packages found (ID: ${completeStudyPackages.id})`);
      
      // Count content items
      const { count: cspCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', completeStudyPackages.id);
      
      console.log(`   Content items: ${cspCount || 0}`);
      
      // Get sample items
      const { data: sampleItems } = await supabase
        .from('content')
        .select('id, name')
        .eq('category_id', completeStudyPackages.id)
        .limit(3);
      
      if (sampleItems && sampleItems.length > 0) {
        console.log('   Sample items:');
        sampleItems.forEach(item => {
          console.log(`   - ${item.name}`);
        });
      }
    } else {
      console.log('❌ Complete Study Packages not found under Standardizers');
    }

    // Test 3: Test all content categories access
    console.log('\n📋 Test 3: All Content Categories Access');
    
    const contentCategories = ['Decoders', 'LEX', 'Standardizers'];
    
    for (const catName of contentCategories) {
      const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'content')
        .eq('name', catName)
        .single();
      
      if (category) {
        // Get all category IDs (including subcategories)
        const { data: subCats } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', category.id);
        
        const allIds = [category.id, ...(subCats?.map(s => s.id) || [])];
        
        const { count } = await supabase
          .from('content')
          .select('*', { count: 'exact', head: true })
          .in('category_id', allIds);
        
        console.log(`   ${catName}: ✅ Accessible (${count || 0} total items)`);
      } else {
        console.log(`   ${catName}: ❌ Not found`);
      }
    }

    // Test 4: Navigation paths
    console.log('\n📋 Test 4: Admin Navigation Paths');
    const paths = [
      '/admin/decoders',
      '/admin/lex',
      '/admin/standardizers',
      '/admin/settings/categories'
    ];
    
    console.log('   Expected admin routes:');
    paths.forEach(path => {
      console.log(`   - ${path}`);
    });

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed!');
    console.log('\nNote: Complete Study Packages should be accessible via:');
    console.log('  1. /admin/standardizers -> Click on "Complete Study Packages"');
    console.log('  2. Direct category ID in content queries');

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testContentAccess();