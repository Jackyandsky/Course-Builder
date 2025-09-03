const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function restructureCategories() {
  try {
    console.log('Starting category restructuring...\n');

    // Step 1: Get the proprietary parent category
    const proprietaryId = '04474b55-bc42-4065-acf6-2d6817d93fe7';
    
    // Step 2: Get all content subcategories currently under proprietary
    const { data: contentSubcategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', proprietaryId)
      .eq('type', 'content');

    if (fetchError) {
      console.error('Error fetching subcategories:', fetchError);
      return;
    }

    console.log(`Found ${contentSubcategories?.length || 0} content subcategories under proprietary\n`);

    // Step 3: Find the Standardizers category
    const { data: standardizers, error: stdError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Standardizers')
      .eq('type', 'content')
      .single();

    if (stdError || !standardizers) {
      console.error('Standardizers category not found:', stdError);
      return;
    }

    console.log(`Found Standardizers category: ${standardizers.id}\n`);

    // Step 4: Update categories to be direct parents (remove proprietary parent)
    const categoriesToUpdate = ['Decoders', 'LEX', 'Standardizers'];
    
    for (const catName of categoriesToUpdate) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ parent_id: null })
        .eq('name', catName)
        .eq('type', 'content');

      if (updateError) {
        console.error(`Error updating ${catName}:`, updateError);
      } else {
        console.log(`✅ Updated ${catName} to be a root category`);
      }
    }

    // Step 5: Move Complete Study Packages under Standardizers
    const { error: moveError } = await supabase
      .from('categories')
      .update({ parent_id: standardizers.id })
      .eq('name', 'Complete Study Packages')
      .eq('type', 'content');

    if (moveError) {
      console.error('Error moving Complete Study Packages:', moveError);
    } else {
      console.log('✅ Moved Complete Study Packages under Standardizers');
    }

    // Step 6: Check if proprietary category has any remaining children
    const { count: remainingCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', proprietaryId);

    console.log(`\nRemaining children under proprietary: ${remainingCount || 0}`);

    // Step 7: Check if any content items are using the proprietary category
    const { count: contentCount } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', proprietaryId);

    console.log(`Content items using proprietary category: ${contentCount || 0}`);

    if ((remainingCount === 0 || remainingCount === null) && (contentCount === 0 || contentCount === null)) {
      // Step 8: Delete the proprietary category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', proprietaryId);

      if (deleteError) {
        console.error('Error deleting proprietary category:', deleteError);
      } else {
        console.log('✅ Deleted proprietary category');
      }
    } else {
      console.log('⚠️  Cannot delete proprietary category - it still has children or content items');
    }

    // Step 9: Verify final structure
    console.log('\n📊 Final structure verification:\n');
    
    const { data: allContent, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'content')
      .order('parent_id', { nullsFirst: true })
      .order('name');

    if (verifyError) {
      console.error('Error verifying structure:', verifyError);
      return;
    }

    const rootCategories = allContent?.filter(c => !c.parent_id) || [];
    console.log('Root content categories:');
    
    for (const root of rootCategories) {
      console.log(`\n📁 ${root.name} (ID: ${root.id})`);
      
      const children = allContent?.filter(c => c.parent_id === root.id) || [];
      if (children.length > 0) {
        console.log(`   └─ Subcategories:`);
        children.forEach(child => {
          console.log(`      ├─ ${child.name}`);
        });
      }
    }

    console.log('\n✅ Category restructuring complete!');

  } catch (error) {
    console.error('Script error:', error);
  }
}

restructureCategories();