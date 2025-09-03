const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkContentCategories() {
  try {
    console.log('Checking content categories...\n');

    // Get all categories of type 'content'
    const { data: contentCategories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .order('parent_id', { nullsFirst: true })
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    console.log(`Found ${contentCategories?.length || 0} content categories\n`);

    // Group by parent_id
    const rootCategories = contentCategories?.filter(c => !c.parent_id) || [];
    console.log(`Root content categories: ${rootCategories.length}`);
    
    rootCategories.forEach(root => {
      console.log(`\n📁 ${root.name} (ID: ${root.id})`);
      if (root.description) console.log(`   Description: ${root.description}`);
      
      // Find children
      const children = contentCategories?.filter(c => c.parent_id === root.id) || [];
      if (children.length > 0) {
        console.log(`   └─ ${children.length} subcategories:`);
        children.forEach(child => {
          console.log(`      ├─ ${child.name} (ID: ${child.id})`);
          
          // Find grandchildren
          const grandchildren = contentCategories?.filter(c => c.parent_id === child.id) || [];
          if (grandchildren.length > 0) {
            grandchildren.forEach(gc => {
              console.log(`         └─ ${gc.name} (ID: ${gc.id})`);
            });
          }
        });
      } else {
        console.log(`   └─ No subcategories`);
      }
    });

    // Check for orphaned categories (with parent_id but parent doesn't exist)
    const allIds = new Set(contentCategories?.map(c => c.id) || []);
    const orphaned = contentCategories?.filter(c => c.parent_id && !allIds.has(c.parent_id)) || [];
    
    if (orphaned.length > 0) {
      console.log('\n⚠️  Orphaned categories (parent doesn\'t exist):');
      orphaned.forEach(o => {
        console.log(`   - ${o.name} (Parent ID: ${o.parent_id})`);
      });
    }

    // Check content items using these categories
    console.log('\n📊 Content items by category:');
    for (const cat of contentCategories || []) {
      const { count } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id);
      
      if (count && count > 0) {
        console.log(`   ${cat.name}: ${count} items`);
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkContentCategories();