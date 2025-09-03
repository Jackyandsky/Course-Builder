const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixContentCategories() {
  try {
    console.log('Fixing content categories...\n');

    // Check if the parent exists
    const parentId = '04474b55-bc42-4065-acf6-2d6817d93fe7';
    
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', parentId)
      .single();

    if (parentError || !parentCategory) {
      console.log('Parent category not found. Creating root "Content" category...');
      
      // Create the missing parent category
      const { data: newParent, error: createError } = await supabase
        .from('categories')
        .insert({
          id: parentId,
          name: 'Content',
          description: 'Main content category for proprietary products',
          type: 'content',
          parent_id: null,
          user_id: '00000000-0000-0000-0000-000000000000' // Default system user
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating parent category:', createError);
        return;
      }

      console.log('✅ Created root Content category');
    } else {
      console.log('Parent category exists:', parentCategory.name, `(Type: ${parentCategory.type})`);
    }

    // Verify the fix
    const { data: allContent, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .order('parent_id', { nullsFirst: true })
      .order('name');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return;
    }

    console.log(`\n✅ Total content categories: ${allContent?.length || 0}`);
    
    const root = allContent?.find(c => !c.parent_id);
    const children = allContent?.filter(c => c.parent_id === parentId) || [];
    
    console.log(`✅ Root category: ${root?.name || 'None'}`);
    console.log(`✅ Subcategories: ${children.length}`);
    children.forEach(child => {
      console.log(`   - ${child.name}`);
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

fixContentCategories();