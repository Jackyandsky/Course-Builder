const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCategoryStructure() {
  try {
    console.log('Testing category structure after changes...\n');
    console.log('=' .repeat(50));

    // Test 1: Check root content categories
    console.log('\n📋 Test 1: Root Content Categories');
    const { data: rootCategories, error: rootError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .is('parent_id', null)
      .order('name');

    if (rootError) {
      console.error('❌ Error fetching root categories:', rootError);
      return;
    }

    console.log(`✅ Found ${rootCategories?.length || 0} root content categories:`);
    rootCategories?.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });

    // Test 2: Check if Standardizers has Complete Study Packages as child
    console.log('\n📋 Test 2: Standardizers Subcategories');
    const standardizers = rootCategories?.find(c => c.name === 'Standardizers');
    
    if (standardizers) {
      const { data: stdChildren, error: stdError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', standardizers.id)
        .order('name');

      if (stdError) {
        console.error('❌ Error fetching Standardizers children:', stdError);
      } else {
        console.log(`✅ Standardizers has ${stdChildren?.length || 0} subcategories:`);
        stdChildren?.forEach(child => {
          console.log(`   - ${child.name}`);
        });
      }
    } else {
      console.log('⚠️  Standardizers category not found');
    }

    // Test 3: Check that proprietary category is deleted
    console.log('\n📋 Test 3: Proprietary Category Removal');
    const proprietaryId = '04474b55-bc42-4065-acf6-2d6817d93fe7';
    const { data: proprietary, error: propError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', proprietaryId)
      .single();

    if (propError && propError.code === 'PGRST116') {
      console.log('✅ Proprietary category successfully removed');
    } else if (proprietary) {
      console.log('❌ Proprietary category still exists');
    }

    // Test 4: Check content items distribution
    console.log('\n📋 Test 4: Content Items Distribution');
    for (const cat of rootCategories || []) {
      // Get all descendants
      const { data: allDescendants } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', cat.id);

      const categoryIds = [cat.id, ...(allDescendants?.map(d => d.id) || [])];
      
      const { count } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .in('category_id', categoryIds);

      console.log(`   ${cat.name}: ${count || 0} content items`);
    }

    // Test 5: API endpoints
    console.log('\n📋 Test 5: API Endpoints');
    
    // Test categories API
    try {
      const response = await fetch('http://localhost:3000/api/categories?type=content');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Categories API working - returned ${data.length} categories`);
      } else {
        console.log('❌ Categories API returned error:', response.status);
      }
    } catch (err) {
      console.log('⚠️  Could not test API (server may not be running)');
    }

    // Test 6: Complete hierarchy
    console.log('\n📋 Test 6: Complete Hierarchy');
    const { data: allCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .order('parent_id', { nullsFirst: true })
      .order('name');

    const buildTree = (parentId = null, indent = '') => {
      const children = allCategories?.filter(c => c.parent_id === parentId) || [];
      children.forEach(child => {
        console.log(`${indent}${parentId ? '├─' : '📁'} ${child.name}`);
        buildTree(child.id, indent + '   ');
      });
    };

    buildTree();

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testCategoryStructure();