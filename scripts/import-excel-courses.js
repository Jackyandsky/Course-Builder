#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configuration
const CLOSE_READING_CATEGORY_ID = '37b52902-0873-4c16-8428-e4370fe66116'; // From database
const USER_ID = '4ef526fd-43a0-44fd-82e4-2ab404ef673c'; // As specified
const PRICE = 7000;
const CURRENCY = 'CAD';
const DURATION_HOURS = 90;

// Read the Excel file
const filePath = path.join(__dirname, '..', 'sample', 'course_list', 'i-GPS Comprehensive Courselist.xlsx');

try {
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Filter for courses containing "Reading" in the title (first 7 matching courses)
  // Skip first 2 rows (header rows)
  const courses = [];
  
  for (let i = 2; i < data.length && courses.length < 7; i++) {
    const row = data[i];
    if (!row || !row[0] || !row[1]) continue;
    
    const title = row[0].trim();
    const description = row[1].trim();
    
    // Match courses with "Reading" in the title (Close Reading related)
    if (title.toLowerCase().includes('reading')) {
      courses.push({
        title,
        description,
        short_description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        category_id: CLOSE_READING_CATEGORY_ID,
        status: 'published',
        difficulty: 'standard',
        duration_hours: DURATION_HOURS,
        is_public: true,
        user_id: USER_ID,
        price: PRICE,
        currency: CURRENCY
      });
    }
  }
  
  // Display found courses
  console.log(`Found ${courses.length} courses matching "Reading":\n`);
  courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.title}`);
    console.log(`   ${course.short_description}\n`);
  });
  
  // Generate SQL migration
  const migrationSQL = `-- Insert 7 Reading courses from Excel spreadsheet
-- Generated on ${new Date().toISOString()}

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
${courses.map((course, index) => `(
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
)`).join(',\n')}
ON CONFLICT (title) DO NOTHING;
`;

  // Save migration file
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'insert_reading_courses_from_excel.sql');
  fs.writeFileSync(migrationPath, migrationSQL);
  
  console.log(`\nMigration SQL saved to: ${migrationPath}`);
  console.log('\nTo apply the migration, run the SQL against your database.');
  
  // Also save as JSON for reference
  const jsonPath = path.join(__dirname, 'parsed-reading-courses.json');
  fs.writeFileSync(jsonPath, JSON.stringify(courses, null, 2));
  console.log(`\nCourse data saved to: ${jsonPath}`);
  
} catch (error) {
  console.error('Error processing Excel file:', error.message);
}