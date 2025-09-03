// Quick test to check schedule filtering
const fetch = require('node-fetch');

async function testScheduleFiltering() {
  console.log('Testing schedule filtering logic...\n');
  
  // The IDs we're interested in
  const week15Id = '865ca447-492a-49c6-baf7-dbf4670f4589';
  const week30Id = '583d9d7b-4a8a-4334-a67e-2419c674e5a4';
  const courseId = '461e5e40-4268-4b14-a051-e3586cd2fbed'; // 8-9 Reading & Writing Course
  
  try {
    // Test 1: Get all schedules for the course
    console.log('TEST 1: Getting schedules for 8-9 Reading & Writing Course');
    const schedulesUrl = `https://builder.vanboss.work/api/schedules?course_id=${courseId}`;
    const schedulesResponse = await fetch(schedulesUrl, {
      headers: {
        'Cookie': 'sb-djvmoqharkefksvceetu-auth-token=base64-encoded-jwt-token-here',
        'Content-Type': 'application/json'
      }
    });
    
    if (schedulesResponse.ok) {
      const data = await schedulesResponse.json();
      console.log(`Found ${data.schedules?.length || 0} schedules for this course:`);
      data.schedules?.forEach(s => {
        console.log(`  - ${s.name} (ID: ${s.id})`);
        if (s.id === week15Id) console.log('    ✓ This is our week15!');
        if (s.id === week30Id) console.log('    ✓ This is our week30!');
      });
    } else {
      console.log('Failed to fetch schedules:', schedulesResponse.status);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Check lessons for week15
    console.log('TEST 2: Getting lessons for week15 schedule');
    const week15Url = `https://builder.vanboss.work/api/lessons/admin-list?schedule_id=${week15Id}&page=1&perPage=5`;
    const week15Response = await fetch(week15Url, {
      headers: {
        'Cookie': 'sb-djvmoqharkefksvceetu-auth-token=base64-encoded-jwt-token-here',
        'Content-Type': 'application/json'
      }
    });
    
    if (week15Response.ok) {
      const data = await week15Response.json();
      console.log(`API returned ${data.data?.length || 0} lessons:`);
      data.data?.slice(0, 3).forEach(lesson => {
        console.log(`  - ${lesson.title}`);
        console.log(`    Course: ${lesson.schedule?.course?.title}`);
        console.log(`    Schedule: ${lesson.schedule?.name} (${lesson.schedule_id})`);
      });
    } else {
      console.log('Failed to fetch week15 lessons:', week15Response.status);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Check lessons for week30
    console.log('TEST 3: Getting lessons for week30 schedule');
    const week30Url = `https://builder.vanboss.work/api/lessons/admin-list?schedule_id=${week30Id}&page=1&perPage=5`;
    const week30Response = await fetch(week30Url, {
      headers: {
        'Cookie': 'sb-djvmoqharkefksvceetu-auth-token=base64-encoded-jwt-token-here',
        'Content-Type': 'application/json'
      }
    });
    
    if (week30Response.ok) {
      const data = await week30Response.json();
      console.log(`API returned ${data.data?.length || 0} lessons:`);
      data.data?.slice(0, 3).forEach(lesson => {
        console.log(`  - ${lesson.title}`);
        console.log(`    Course: ${lesson.schedule?.course?.title}`);
        console.log(`    Schedule: ${lesson.schedule?.name} (${lesson.schedule_id})`);
      });
    } else {
      console.log('Failed to fetch week30 lessons:', week30Response.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testScheduleFiltering();