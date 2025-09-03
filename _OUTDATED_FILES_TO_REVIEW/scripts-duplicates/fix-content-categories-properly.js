const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixContentCategoriesType() {
  try {
    console.log('Fixing content categories type issue...\n');

    // Option 1: Update the parent category to be of type 'content'
    const parentId = '04474b55-bc42-4065-acf6-2d6817d93fe7';
    
    // First, let's check the parent
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', parentId)
      .single();

    if (parentError || !parentCategory) {
      console.error('Parent category not found!');
      return;
    }

    console.log(`Current parent: ${parentCategory.name} (Type: ${parentCategory.type})`);

    // Check if we should update the parent type or create a new content root
    const { data: existingContentRoot } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .is('parent_id', null)
      .single();

    if (!existingContentRoot) {
      console.log('\nOption 1: Update parent category type to "content"');
      console.log('Option 2: Create new root content category and update subcategories');
      
      // Let's go with Option 1: Update the parent to be type 'content'
      console.log('\nExecuting Option 1: Updating parent category type...');
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({ type: 'content' })
        .eq('id', parentId);

      if (updateError) {
        console.error('Error updating parent category:', updateError);
        return;
      }

      console.log('✅ Updated parent category type to "content"');
    } else {
      console.log('Content root already exists:', existingContentRoot.name);
    }

    // Verify the structure
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

    console.log(`\n✅ Final structure:`);
    console.log(`Total content categories: ${allContent?.length || 0}`);
    
    const roots = allContent?.filter(c => !c.parent_id) || [];
    console.log(`\nRoot categories (${roots.length}):`);
    
    roots.forEach(root => {
      console.log(`\n📁 ${root.name} (ID: ${root.id})`);
      
      const children = allContent?.filter(c => c.parent_id === root.id) || [];
      if (children.length > 0) {
        console.log(`   Subcategories (${children.length}):`);
        children.forEach(child => {
          console.log(`   ├─ ${child.name}`);
        });
      }
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

fixContentCategoriesType();