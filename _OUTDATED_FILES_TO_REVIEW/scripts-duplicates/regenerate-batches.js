#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Function to escape single quotes for SQL
function escapeSQLString(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Function to truncate description for short_description
function truncateDescription(desc, maxLength = 155) {
  if (!desc || desc.length <= maxLength) return desc;
  return desc.substring(0, maxLength) + '...';
}

// Main categories with their IDs
const MAIN_CATEGORIES = [
  { name: 'Close Reading', id: '37b52902-0873-4c16-8428-e4370fe66116', keywords: ['reading', 'close reading', 'foundations', 'fundamentals', 'pre-reading'] },
  { name: 'Writing Practice', id: 'b24667ac-c601-464f-8420-38156ec85a16', keywords: ['writing', 'effective writing', 'paragraph', 'essay writing'] },
  { name: 'Reading & Writing', id: '3703f08f-5641-4778-9813-4a818bbfd859', keywords: ['reading & writing', 'reading and writing', 'integrated'] },
  { name: 'Vocabulary Enrichment', id: '41213d59-748a-4d0f-aa48-5e06f6d5abb9', keywords: ['vocabulary', 'words', 'word study'] },
  { name: 'Critical Analysis', id: 'ab452de7-4e54-4195-943d-f5c7f89429fa', keywords: ['critical', 'analysis', 'analytical', 'criticism'] },
  { name: 'Literature Analysis', id: 'c199ad8c-b875-4e33-9d3c-47fc82ae7a92', keywords: ['literature', 'literary', 'poetry', 'shakespeare', 'dante', 'canon', 'novel'] },
  { name: 'Essays', id: 'f15fcfcc-c3fd-46a6-8b24-1c4ee81d6008', keywords: ['essay', 'essays', 'academic writing', 'research'] }
];

// Function to match category based on course title and description
function matchCategory(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  
  // Check each category
  for (const category of MAIN_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return category.id;
      }
    }
  }
  
  // Default to Literature Analysis for author-specific courses
  if (combined.match(/shakespeare|dante|austen|dickens|bronte|wilde|goethe/i)) {
    return 'c199ad8c-b875-4e33-9d3c-47fc82ae7a92'; // Literature Analysis
  }
  
  // Default to Close Reading
  return '37b52902-0873-4c16-8428-e4370fe66116';
}

// Parse Excel file
const workbook = xlsx.readFile(path.join(__dirname, '..', 'sample', 'course_list', 'i-GPS Comprehensive Courselist.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Total courses in Excel: ${data.length}`);

// Skip the first 7 that were already imported
const coursesToImport = data.slice(7);
console.log(`Courses to import: ${coursesToImport.length}`);

// Process courses
const courses = coursesToImport.map((row, index) => {
  const title = row['Course Title'] || row['Title'] || '';
  const description = row['Short course description'] || row['Description'] || '';
  const category_id = matchCategory(title, description);
  
  return {
    title: escapeSQLString(title),
    description: escapeSQLString(description),
    short_description: escapeSQLString(truncateDescription(description)),
    category_id,
    status: 'published',
    difficulty: 'standard',
    duration_hours: 90,
    is_public: true,
    user_id: '4ef526fd-43a0-44fd-82e4-2ab404ef673c',
    price: 7000,
    currency: 'CAD'
  };
});

// Generate SQL in batches
const BATCH_SIZE = 20;
const totalBatches = Math.ceil(courses.length / BATCH_SIZE);

for (let i = 0; i < totalBatches; i++) {
  const batchNum = i + 2; // Start from batch 2 (batch 1 already done)
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, courses.length);
  const batchCourses = courses.slice(start, end);
  
  const sql = `-- Insert batch ${batchNum} of courses from Excel spreadsheet
-- Generated on ${new Date().toISOString()}
-- Courses ${start + 8} to ${end + 7}

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
${batchCourses.map((course, idx) => `(
  '${course.title}',
  '${course.description}',
  '${course.short_description}',
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

  const filename = `insert_courses_batch_${batchNum}.sql`;
  const filepath = path.join(__dirname, '..', 'database', 'migrations', filename);
  
  fs.writeFileSync(filepath, sql, 'utf8');
  console.log(`✅ Generated ${filename} (${batchCourses.length} courses)`);
}

console.log(`\n✅ All batch files regenerated with properly escaped apostrophes`);