// Debug the admin-list API endpoint directly
// This simulates exactly what the frontend is doing

const https = require('https');

async function testAdminAPI() {
  console.log('🧪 Testing /api/lessons/admin-list endpoint\n');

  // Test 1: week15 schedule
  const week15Id = '865ca447-492a-49c6-baf7-dbf4670f4589';
  console.log('TEST 1: week15 schedule ID:', week15Id);
  
  const url1 = `https://builder.vanboss.work/api/lessons/admin-list?schedule_id=${week15Id}&page=1&perPage=10`;
  console.log('🌐 URL:', url1);
  
  try {
    const response1 = await fetch(url1, {
      headers: {
        'Cookie': 'your-auth-cookie-here', // This would need to be set for auth
        'Content-Type': 'application/json'
      }
    });
    
    if (!response1.ok) {
      console.log('❌ Response not OK:', response1.status, response1.statusText);
      return;
    }
    
    const data1 = await response1.json();
    console.log(`📊 Response: ${data1.data?.length || 0} lessons found`);
    
    if (data1.data?.length > 0) {
      console.log('📋 First few lessons:');
      data1.data.slice(0, 3).forEach(lesson => {
        console.log(`  - ${lesson.title}`);
        console.log(`    schedule_id: ${lesson.schedule_id}`);
        console.log(`    schedule_name: ${lesson.schedule?.name}`);
      });
      
      // Check if any lesson doesn't match the requested schedule
      const mismatches = data1.data.filter(lesson => lesson.schedule_id !== week15Id);
      if (mismatches.length > 0) {
        console.log(`⚠️  ${mismatches.length} lessons don't match requested schedule!`);
        mismatches.forEach(lesson => {
          console.log(`    Expected: ${week15Id}, Got: ${lesson.schedule_id} (${lesson.schedule?.name})`);
        });
      } else {
        console.log('✅ All lessons match the requested schedule ID');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing week15:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: week30 schedule  
  const week30Id = '583d9d7b-4a8a-4334-a67e-2419c674e5a4';
  console.log('TEST 2: week30 schedule ID:', week30Id);
  
  const url2 = `https://builder.vanboss.work/api/lessons/admin-list?schedule_id=${week30Id}&page=1&perPage=10`;
  console.log('🌐 URL:', url2);
  
  try {
    const response2 = await fetch(url2);
    
    if (!response2.ok) {
      console.log('❌ Response not OK:', response2.status, response2.statusText);
      return;
    }
    
    const data2 = await response2.json();
    console.log(`📊 Response: ${data2.data?.length || 0} lessons found`);
    
    if (data2.data?.length > 0) {
      console.log('📋 First few lessons:');
      data2.data.slice(0, 3).forEach(lesson => {
        console.log(`  - ${lesson.title}`);
        console.log(`    schedule_id: ${lesson.schedule_id}`);
        console.log(`    schedule_name: ${lesson.schedule?.name}`);
      });
      
      // Check if any lesson doesn't match the requested schedule
      const mismatches = data2.data.filter(lesson => lesson.schedule_id !== week30Id);
      if (mismatches.length > 0) {
        console.log(`⚠️  ${mismatches.length} lessons don't match requested schedule!`);
        mismatches.forEach(lesson => {
          console.log(`    Expected: ${week30Id}, Got: ${lesson.schedule_id} (${lesson.schedule?.name})`);
        });
      } else {
        console.log('✅ All lessons match the requested schedule ID');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing week30:', error.message);
  }
  
  console.log('\n✅ API test complete!');
}

// Need to polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAdminAPI().catch(console.error);