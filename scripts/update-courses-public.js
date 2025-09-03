const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateCoursesPublicStatus() {
  try {
    // First, check current status of courses
    console.log('Checking current status of courses...');
    const { data: currentCourses, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, is_public, show_on_menu')
      .order('title');

    if (fetchError) {
      console.error('Error fetching courses:', fetchError);
      return;
    }

    console.log(`\nTotal courses found: ${currentCourses.length}`);
    
    // Count current status
    const publicCount = currentCourses.filter(c => c.is_public).length;
    const privateCount = currentCourses.filter(c => !c.is_public).length;
    const onMenuCount = currentCourses.filter(c => c.show_on_menu).length;
    
    console.log(`Currently public: ${publicCount}`);
    console.log(`Currently private: ${privateCount}`);
    console.log(`Currently shown on menu: ${onMenuCount}`);
    
    // Show some examples of private courses
    const privateCourses = currentCourses.filter(c => !c.is_public);
    if (privateCourses.length > 0) {
      console.log('\nSample of private courses that will be made public:');
      privateCourses.slice(0, 5).forEach(course => {
        console.log(`  - ${course.title} (show_on_menu: ${course.show_on_menu})`);
      });
      if (privateCourses.length > 5) {
        console.log(`  ... and ${privateCourses.length - 5} more`);
      }
    }

    // Update all courses to be public
    console.log('\n--- Updating all courses to is_public = true ---');
    
    const { data: updatedCourses, error: updateError } = await supabase
      .from('courses')
      .update({ is_public: true })
      .select('id');

    if (updateError) {
      console.error('Error updating courses:', updateError);
      return;
    }

    console.log(`✅ Successfully updated ${updatedCourses.length} courses to public`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('courses')
      .select('is_public, show_on_menu')
      .order('title');

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }

    const newPublicCount = verifyData.filter(c => c.is_public).length;
    const newOnMenuCount = verifyData.filter(c => c.show_on_menu).length;
    
    console.log('\n--- Final Status ---');
    console.log(`All courses are now public: ${newPublicCount}/${verifyData.length}`);
    console.log(`Courses shown on menu: ${newOnMenuCount}`);
    console.log('\nYou can now control course visibility in the menu using only the show_on_menu flag.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update
updateCoursesPublicStatus();