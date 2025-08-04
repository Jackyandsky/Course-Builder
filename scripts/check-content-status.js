// Script to check the current status of study packet content
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkContentStatus() {
  console.log('🔍 Checking content status...\n');

  try {
    // Get the Complete Study Packages category
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Complete Study Packages')
      .single();

    if (!category) {
      console.error('❌ Complete Study Packages category not found');
      return;
    }

    // Get content items with pagination to avoid timeouts
    const PAGE_SIZE = 10;
    let page = 0;
    let hasMore = true;
    let totalItems = 0;
    let itemsWithGenericContent = 0;
    let itemsWithSpecificContent = 0;
    let itemsWithUrls = 0;

    while (hasMore) {
      const { data: contentItems, error } = await supabase
        .from('content')
        .select('id, name, content')
        .eq('category_id', category.id)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching content:', error);
        break;
      }

      if (!contentItems || contentItems.length === 0) {
        hasMore = false;
        break;
      }

      // Analyze each item
      contentItems.forEach(item => {
        totalItems++;
        
        if (item.content) {
          // Check if content has a URL
          if (item.content.includes('https://share.igpsedu.com')) {
            itemsWithUrls++;
          }
          
          // Check if content is generic or specific
          if (item.content.includes('This comprehensive study packet provides educators')) {
            itemsWithGenericContent++;
            console.log(`📄 Generic content: ${item.name}`);
          } else {
            itemsWithSpecificContent++;
          }
        }
      });

      console.log(`  Processed page ${page + 1} (${contentItems.length} items)`);
      
      if (contentItems.length < PAGE_SIZE) {
        hasMore = false;
      }
      
      page++;
    }

    console.log('\n📊 Summary:');
    console.log(`Total items: ${totalItems}`);
    console.log(`Items with specific content: ${itemsWithSpecificContent}`);
    console.log(`Items with generic content: ${itemsWithGenericContent}`);
    console.log(`Items with URLs: ${itemsWithUrls}`);

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the check
if (require.main === module) {
  checkContentStatus()
    .then(() => {
      console.log('\n✅ Check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Check failed:', error);
      process.exit(1);
    });
}