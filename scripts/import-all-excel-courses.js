#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Category mappings based on database
const CATEGORY_MAPPINGS = {
  'Close Reading': '37b52902-0873-4c16-8428-e4370fe66116',
  'Critical Analysis': 'ab452de7-4e54-4195-943d-f5c7f89429fa',
  'Drama': '64ad894c-1577-447b-bacc-506c4baa02d7',
  'Essays': 'f15fcfcc-c3fd-46a6-8b24-1c4ee81d6008',
  'Foreign Language': 'ff42cfa0-f4f3-473b-a98f-7dbfb60914b3',
  'History': '77e6a949-4790-4bc8-8e18-b65236b13e0c',
  'Language Arts & Disciplines': '5d234369-69cd-459f-ae22-846ad4deb03e',
  'Literature Analysis': 'c199ad8c-b875-4e33-9d3c-47fc82ae7a92',
  'Philosophy': '72a9959c-235b-44fd-aa6c-c1a6908696ea',
  'Poetry': '41afc9cf-28e9-49a3-81e3-f73a8940d419',
  'Reading': 'bfbcadda-bf31-4fe1-867f-c8abdd4d05b7',
  'Reading & Writing': '3703f08f-5641-4778-9813-4a818bbfd859',
  'SAT (Educational test)': '800484b9-fa8c-4509-a904-a97aa9bc0b5e',
  'Science': 'dfad98ca-4a87-4315-adba-c95b6df248cf',
  'Standardized Testing': 'eff0be81-15fd-4bdf-9c13-10ea9f72a97d',
  'Vocabulary Enrichment': '41213d59-748a-4d0f-aa48-5e06f6d5abb9',
  'Writing Practice': 'b24667ac-c601-464f-8420-38156ec85a16'
};

// Configuration
const USER_ID = '4ef526fd-43a0-44fd-82e4-2ab404ef673c';
const PRICE = 7000;
const CURRENCY = 'CAD';
const DURATION_HOURS = 90;

// Main 7 categories to distribute courses across
const MAIN_CATEGORIES = [
  { name: 'Close Reading', id: '37b52902-0873-4c16-8428-e4370fe66116' },
  { name: 'Writing Practice', id: 'b24667ac-c601-464f-8420-38156ec85a16' },
  { name: 'Reading & Writing', id: '3703f08f-5641-4778-9813-4a818bbfd859' },
  { name: 'Vocabulary Enrichment', id: '41213d59-748a-4d0f-aa48-5e06f6d5abb9' },
  { name: 'Critical Analysis', id: 'ab452de7-4e54-4195-943d-f5c7f89429fa' },
  { name: 'Literature Analysis', id: 'c199ad8c-b875-4e33-9d3c-47fc82ae7a92' },
  { name: 'Essays', id: 'f15fcfcc-c3fd-46a6-8b24-1c4ee81d6008' }
];

// Function to determine category based on course title and description
function determineCategory(title, description) {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = titleLower + ' ' + descLower;
  
  // Specific matching based on course title patterns
  
  // 1. Close Reading - for "Reading" courses
  if (titleLower.includes('reading') && !titleLower.includes('writing')) {
    if (titleLower.includes('advanced reading') || titleLower.includes('fundamentals of reading') || 
        titleLower.includes('university reading') || descLower.includes('close reading')) {
      return MAIN_CATEGORIES[0].id; // Close Reading
    }
  }
  
  // 2. Writing Practice - for pure writing courses
  if (titleLower.includes('writing') && !titleLower.includes('reading')) {
    if (titleLower.includes('systematic writing') || titleLower.includes('structured writing') ||
        titleLower.includes('essay writing') || titleLower.includes('creative writing')) {
      return MAIN_CATEGORIES[1].id; // Writing Practice
    }
  }
  
  // 3. Reading & Writing - for combined courses
  if (titleLower.includes('reading') && titleLower.includes('writing')) {
    return MAIN_CATEGORIES[2].id; // Reading & Writing
  }
  if (titleLower.includes('r&w') || titleLower.includes('reading and writing')) {
    return MAIN_CATEGORIES[2].id; // Reading & Writing
  }
  
  // 4. Vocabulary Enrichment
  if (titleLower.includes('vocabulary') || titleLower.includes('vocab') || 
      titleLower.includes('word') || descLower.includes('vocabulary')) {
    return MAIN_CATEGORIES[3].id; // Vocabulary Enrichment
  }
  
  // 5. Critical Analysis
  if (titleLower.includes('critical') || titleLower.includes('analysis') || 
      titleLower.includes('critique') || titleLower.includes('analytical')) {
    return MAIN_CATEGORIES[4].id; // Critical Analysis
  }
  
  // 6. Literature Analysis - for literature focused courses
  if (titleLower.includes('literature') || titleLower.includes('literary') || 
      titleLower.includes('novel') || titleLower.includes('poetry') || 
      titleLower.includes('shakespeare') || titleLower.includes('drama')) {
    return MAIN_CATEGORIES[5].id; // Literature Analysis
  }
  
  // 7. Essays - for essay and composition focused courses
  if (titleLower.includes('essay') || titleLower.includes('composition') || 
      titleLower.includes('academic writing') || descLower.includes('essay')) {
    return MAIN_CATEGORIES[6].id; // Essays
  }
  
  // Additional pattern matching based on description
  if (descLower.includes('comprehension') || descLower.includes('reading tactics')) {
    return MAIN_CATEGORIES[0].id; // Close Reading
  }
  
  if (descLower.includes('writing skills') || descLower.includes('composition')) {
    return MAIN_CATEGORIES[1].id; // Writing Practice
  }
  
  if (descLower.includes('literary analysis') || descLower.includes('literature')) {
    return MAIN_CATEGORIES[5].id; // Literature Analysis
  }
  
  // Grade-based distribution
  if (titleLower.match(/\d+-\d+/) || titleLower.match(/grade \d+/)) {
    // Distribute grade-based courses across categories
    const gradeMatch = titleLower.match(/(\d+)-(\d+)|grade (\d+)/);
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[1] || gradeMatch[3] || '0');
      if (gradeNum <= 7) {
        return MAIN_CATEGORIES[0].id; // Close Reading for younger grades
      } else if (gradeNum <= 9) {
        return MAIN_CATEGORIES[2].id; // Reading & Writing for middle grades
      } else {
        return MAIN_CATEGORIES[4].id; // Critical Analysis for higher grades
      }
    }
  }
  
  // SAT/Test Prep goes to Critical Analysis
  if (titleLower.includes('sat') || titleLower.includes('test') || titleLower.includes('prep')) {
    return MAIN_CATEGORIES[4].id; // Critical Analysis
  }
  
  // Default distribution based on hash to ensure variety
  // Use title length to distribute among categories
  const hashValue = title.length % 7;
  return MAIN_CATEGORIES[hashValue].id;
}

// Read the Excel file
const filePath = path.join(__dirname, '..', 'sample', 'course_list', 'i-GPS Comprehensive Courselist.xlsx');

try {
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Skip header rows and already imported courses
  const alreadyImported = [
    'University Reading',
    'Advanced Reading I',
    'Advanced Reading II',
    'Advanced Reading III',
    'Fundamentals of Reading I (6-7)',
    'Fundamentals of Reading I (8-9)',
    'Fundamentals of Reading I (10-12)'
  ];
  
  const courses = [];
  
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || !row[1]) continue;
    
    const title = row[0].trim();
    const description = row[1].trim();
    
    // Skip already imported courses
    if (alreadyImported.includes(title)) {
      console.log(`Skipping already imported: ${title}`);
      continue;
    }
    
    // Skip if it's not a course (e.g., category headers)
    if (title.length > 100 || !description || description.length < 10) {
      continue;
    }
    
    const categoryId = determineCategory(title, description);
    
    courses.push({
      title,
      description,
      short_description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
      category_id: categoryId,
      status: 'published',
      difficulty: 'standard',
      duration_hours: DURATION_HOURS,
      is_public: true,
      user_id: USER_ID,
      price: PRICE,
      currency: CURRENCY
    });
  }
  
  console.log(`Found ${courses.length} new courses to import\n`);
  
  // Display courses by category
  const categoryCounts = {};
  courses.forEach(course => {
    const category = MAIN_CATEGORIES.find(cat => cat.id === course.category_id);
    const categoryName = category ? category.name : 'Unknown';
    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
  });
  
  console.log('Courses by category:');
  Object.keys(categoryCounts).forEach(cat => {
    console.log(`  ${cat}: ${categoryCounts[cat]} courses`);
  });
  
  // Split into batches of 20 courses to avoid timeout
  const BATCH_SIZE = 20;
  const batches = [];
  
  for (let i = 0; i < courses.length; i += BATCH_SIZE) {
    batches.push(courses.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`\nCreating ${batches.length} migration files (${BATCH_SIZE} courses each)...\n`);
  
  // Generate SQL migrations for each batch
  batches.forEach((batch, batchIndex) => {
    const migrationSQL = `-- Insert batch ${batchIndex + 1} of courses from Excel spreadsheet
-- Generated on ${new Date().toISOString()}
-- Courses ${batchIndex * BATCH_SIZE + 1} to ${Math.min((batchIndex + 1) * BATCH_SIZE, courses.length)}

INSERT INTO courses (
  title,
  description,
  short_description,
  category_id,
  status,
  difficulty,
  duration_hours,
  is_public,
  user_id,
  price,
  currency,
  created_at,
  updated_at
) VALUES
${batch.map((course, index) => `(
  '${course.title.replace(/'/g, "''")}',
  '${course.description.replace(/'/g, "''")}',
  '${course.short_description.replace(/'/g, "''")}',
  '${course.category_id}',
  '${course.status}',
  '${course.difficulty}',
  ${course.duration_hours},
  ${course.is_public},
  '${course.user_id}',
  ${course.price},
  '${course.currency}',
  NOW(),
  NOW()
)`).join(',\n')};
`;

    // Save migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', `insert_courses_batch_${batchIndex + 1}.sql`);
    fs.writeFileSync(migrationPath, migrationSQL);
    console.log(`Migration batch ${batchIndex + 1} saved to: ${migrationPath}`);
  });
  
  // Save all courses as JSON for reference
  const jsonPath = path.join(__dirname, 'all-courses-parsed.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    total: courses.length,
    categoryCounts,
    courses
  }, null, 2));
  console.log(`\nAll course data saved to: ${jsonPath}`);
  
  console.log(`\nTotal courses to import: ${courses.length}`);
  console.log(`Migration files created: ${batches.length}`);
  console.log('\nTo apply migrations, run each SQL file against your database.');
  
} catch (error) {
  console.error('Error processing Excel file:', error.message);
}