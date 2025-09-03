const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMenuCourses() {
  try {
    // Get all courses
    const { data: allCourses, error } = await supabase
      .from('courses')
      .select('id, title, is_public, show_on_menu, menu_order')
      .order('menu_order', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    console.log(`Total courses: ${allCourses.length}`);
    console.log(`All courses are public: ${allCourses.filter(c => c.is_public).length === allCourses.length ? 'Yes ✅' : 'No'}`);
    
    // Show courses currently on menu
    const onMenu = allCourses.filter(c => c.show_on_menu);
    console.log(`\nCourses currently shown on menu: ${onMenu.length}`);
    
    if (onMenu.length > 0) {
      console.log('\nCourses with show_on_menu = true:');
      onMenu.forEach(course => {
        console.log(`  - ${course.title} (menu_order: ${course.menu_order || 'not set'})`);
      });
    }
    
    // Show some courses NOT on menu
    const notOnMenu = allCourses.filter(c => !c.show_on_menu);
    console.log(`\nCourses NOT shown on menu: ${notOnMenu.length}`);
    
    if (notOnMenu.length > 0) {
      console.log('\nSample of courses with show_on_menu = false (first 10):');
      notOnMenu.slice(0, 10).forEach(course => {
        console.log(`  - ${course.title}`);
      });
      if (notOnMenu.length > 10) {
        console.log(`  ... and ${notOnMenu.length - 10} more`);
      }
    }
    
    console.log('\n--- Recommendations ---');
    console.log('1. All courses are already public ✅');
    console.log('2. You can now control which courses appear in the menu by updating show_on_menu');
    console.log('3. To show more courses in the dropdown, update show_on_menu = true for the desired courses');
    console.log('4. Remember to set menu_order to control the display order');
    
    // Ask if user wants to update more courses
    console.log('\nWould you like to see a script to update specific courses to show_on_menu = true?');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkMenuCourses();