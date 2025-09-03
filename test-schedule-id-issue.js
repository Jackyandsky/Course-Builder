// Test to understand the schedule_id filtering issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://djvmoqharkefksvceetu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQwOTYwNSwiZXhwIjoyMDY0OTg1NjA1fQ.YdkY97VGKDHdp4MKGGrjxf3UKOe1QGfnIdJqNT_dB8c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugScheduleFiltering() {
  console.log('🔍 Debugging Schedule ID Filtering Issue\n');
  
  // Get the specific schedules we're testing
  const week15Id = '865ca447-492a-49c6-baf7-dbf4670f4589';
  const week30Id = '583d9d7b-4a8a-4334-a67e-2419c674e5a4';
  
  console.log('🎯 Target Schedule IDs:');
  console.log(`  week15: ${week15Id}`);
  console.log(`  week30: ${week30Id}\n`);
  
  // Step 1: Verify these schedules exist
  console.log('📋 Step 1: Verify schedules exist');
  const { data: schedules, error: schedError } = await supabase
    .from('schedules')
    .select('id, name, course_id')
    .in('id', [week15Id, week30Id]);
    
  if (schedError) {
    console.error('❌ Error fetching schedules:', schedError);
    return;
  }
  
  console.log(`Found ${schedules?.length || 0} schedules:`);
  schedules?.forEach(s => console.log(`  - ${s.name} (${s.id})`));
  console.log('');
  
  // Step 2: Check how many lessons exist for each schedule
  console.log('📋 Step 2: Count lessons by schedule_id');
  
  for (const scheduleId of [week15Id, week30Id]) {
    const scheduleName = schedules?.find(s => s.id === scheduleId)?.name;
    
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, schedule_id')
      .eq('schedule_id', scheduleId);
      
    if (error) {
      console.error(`❌ Error for ${scheduleName}:`, error);
      continue;
    }
    
    console.log(`${scheduleName} (${scheduleId}): ${lessons?.length || 0} lessons`);
    if (lessons?.length > 0) {
      console.log(`  Sample titles: ${lessons.slice(0, 2).map(l => l.title).join(', ')}`);
    }
  }
  console.log('');
  
  // Step 3: Test the exact query structure used by admin-list API
  console.log('📋 Step 3: Test admin-list query structure');
  
  for (const scheduleId of [week15Id, week30Id]) {
    const scheduleName = schedules?.find(s => s.id === scheduleId)?.name;
    console.log(`\n🧪 Testing ${scheduleName} query...`);
    
    let query = supabase
      .from('lessons')
      .select(`
        id,
        title,
        description,
        lesson_number,
        date,
        start_time,
        end_time,
        duration_minutes,
        status,
        location,
        created_at,
        updated_at,
        schedule_id,
        schedule:schedules(id, name, course_id, course:courses(id, title))
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    // Apply schedule filter
    query = query.eq('schedule_id', scheduleId);
    
    const { data: lessons, error } = await query.limit(5);
    
    if (error) {
      console.error(`❌ Query error for ${scheduleName}:`, error);
      continue;
    }
    
    console.log(`📊 Query returned ${lessons?.length || 0} lessons`);
    
    if (lessons?.length > 0) {
      console.log('📋 Results:');
      lessons.forEach((lesson, index) => {
        const matches = lesson.schedule_id === scheduleId;
        const status = matches ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${lesson.title}`);
        console.log(`     schedule_id: ${lesson.schedule_id}`);
        console.log(`     schedule.name: ${lesson.schedule?.name}`);
        console.log(`     schedule.id: ${lesson.schedule?.id}`);
        if (!matches) {
          console.log(`     ⚠️  MISMATCH! Expected: ${scheduleId}`);
        }
      });
    }
  }
  
  // Step 4: Double-check by querying without any filter first
  console.log('\n📋 Step 4: Sample of all lessons to see pattern');
  const { data: allLessons, error: allError } = await supabase
    .from('lessons')
    .select('id, title, schedule_id, schedule:schedules(name)')
    .limit(10)
    .order('created_at', { ascending: false });
    
  if (allError) {
    console.error('❌ Error fetching all lessons:', allError);
    return;
  }
  
  console.log(`Sample of ${allLessons?.length || 0} recent lessons:`);
  allLessons?.forEach(lesson => {
    console.log(`  - ${lesson.title}`);
    console.log(`    schedule_id: ${lesson.schedule_id}`);
    console.log(`    schedule_name: ${lesson.schedule?.name}`);
  });
  
  console.log('\n✅ Debug complete!');
}

debugScheduleFiltering().catch(console.error);