#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Environment variables or config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

class CourseImporter {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    this.createdBooks = new Map();
    this.createdMethods = new Map();
    this.createdCategories = new Map();
  }

  async createCategories() {
    console.log('Creating categories...');
    
    const categories = [
      { name: 'Reading & Writing', type: 'course', description: 'Foundational reading and writing courses' },
      { name: 'Close Reading', type: 'course', description: 'Advanced close reading analysis courses' },
      { name: 'Systematic Writing', type: 'course', description: 'Structured writing methodology courses' },
      { name: 'Foreign Languages', type: 'course', description: 'Foreign language and culture courses' },
      { name: 'Standardized Testing', type: 'course', description: 'AP and standardized test preparation' },
      { name: 'Customized Programs', type: 'course', description: 'Specialized and custom curriculum' }
    ];

    for (const category of categories) {
      try {
        const { data, error } = await this.supabase
          .from('categories')
          .insert(category)
          .select()
          .single();

        if (error) {
          console.error(`Error creating category ${category.name}:`, error.message);
        } else {
          this.createdCategories.set(category.name, data);
          console.log(`✓ Created category: ${category.name}`);
        }
      } catch (err) {
        console.error(`Failed to create category ${category.name}:`, err.message);
      }
    }
  }

  async createBooks(books) {
    console.log(`\nCreating ${books.length} books...`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const book of books) {
      try {
        // Check if book already exists
        const { data: existing } = await this.supabase
          .from('books')
          .select('id, title, author')
          .eq('title', book.title)
          .eq('author', book.author)
          .single();

        if (existing) {
          this.createdBooks.set(`${book.title}||${book.author}`, existing);
          skipCount++;
          continue;
        }

        const bookData = {
          title: book.title,
          author: book.author,
          language: 'en',
          is_public: true,
          tags: ['curriculum', 'literature']
        };

        const { data, error } = await this.supabase
          .from('books')
          .insert(bookData)
          .select()
          .single();

        if (error) {
          console.error(`Error creating book "${book.title}":`, error.message);
        } else {
          this.createdBooks.set(`${book.title}||${book.author}`, data);
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`✓ Created ${successCount} books...`);
          }
        }
      } catch (err) {
        console.error(`Failed to create book "${book.title}":`, err.message);
      }
    }
    
    console.log(`✓ Books: ${successCount} created, ${skipCount} already existed`);
  }

  async createMethods(methods) {
    console.log(`\nCreating ${methods.length} methods...`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const method of methods) {
      try {
        // Check if method already exists
        const { data: existing } = await this.supabase
          .from('methods')
          .select('id, name')
          .eq('name', method.name)
          .single();

        if (existing) {
          this.createdMethods.set(method.name, existing);
          skipCount++;
          continue;
        }

        const methodData = {
          name: method.name,
          description: method.description,
          is_template: true,
          tags: ['pedagogy', 'teaching']
        };

        const { data, error } = await this.supabase
          .from('methods')
          .insert(methodData)
          .select()
          .single();

        if (error) {
          console.error(`Error creating method "${method.name}":`, error.message);
        } else {
          this.createdMethods.set(method.name, data);
          successCount++;
          if (successCount % 20 === 0) {
            console.log(`✓ Created ${successCount} methods...`);
          }
        }
      } catch (err) {
        console.error(`Failed to create method "${method.name}":`, err.message);
      }
    }
    
    console.log(`✓ Methods: ${successCount} created, ${skipCount} already existed`);
  }

  async createCoursesWithRelationships(courses) {
    console.log(`\nCreating ${courses.length} courses with relationships...`);
    
    let successCount = 0;
    
    for (const course of courses) {
      try {
        // Get category ID
        let categoryId = null;
        const category = this.createdCategories.get(course.category);
        if (category) {
          categoryId = category.id;
        }

        // Create course
        const courseData = {
          title: course.title,
          description: course.description,
          short_description: course.short_description,
          difficulty: course.difficulty,
          status: course.status,
          is_public: course.is_public,
          category_id: categoryId,
          tags: course.tags || ['literature', 'curriculum'],
          metadata: course.metadata || {}
        };

        const { data: createdCourse, error: courseError } = await this.supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (courseError) {
          console.error(`Error creating course "${course.title}":`, courseError.message);
          continue;
        }

        console.log(`✓ Created course: ${course.title}`);
        
        // Create course-book relationships
        if (course.books && course.books.length > 0) {
          await this.createCourseBookRelationships(createdCourse.id, course.books);
        }

        // Create course-method relationships
        if (course.methods && course.methods.length > 0) {
          await this.createCourseMethodRelationships(createdCourse.id, course.methods);
        }

        successCount++;
        
      } catch (err) {
        console.error(`Failed to create course "${course.title}":`, err.message);
      }
    }
    
    console.log(`✓ Created ${successCount} courses with all relationships`);
  }

  async createCourseBookRelationships(courseId, books) {
    const relationships = [];
    
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const createdBook = this.createdBooks.get(`${book.title}||${book.author}`);
      
      if (createdBook) {
        relationships.push({
          course_id: courseId,
          book_id: createdBook.id,
          is_required: book.is_required || true,
          position: i
        });
      }
    }

    if (relationships.length > 0) {
      const { error } = await this.supabase
        .from('course_books')
        .insert(relationships);

      if (error) {
        console.error(`Error creating course-book relationships:`, error.message);
      }
    }
  }

  async createCourseMethodRelationships(courseId, methods) {
    const relationships = [];
    
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const createdMethod = this.createdMethods.get(method.name);
      
      if (createdMethod) {
        relationships.push({
          course_id: courseId,
          method_id: createdMethod.id,
          position: i
        });
      }
    }

    if (relationships.length > 0) {
      const { error } = await this.supabase
        .from('course_methods')
        .insert(relationships);

      if (error) {
        console.error(`Error creating course-method relationships:`, error.message);
      }
    }
  }

  async importAll(dataFile) {
    try {
      console.log('=== STARTING SUPABASE IMPORT ===\n');
      
      // Load parsed data
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      
      console.log('Data loaded:');
      console.log(`- ${data.courses.length} courses`);
      console.log(`- ${data.books.length} books`);
      console.log(`- ${data.methods.length} methods\n`);

      // Step 1: Create categories
      await this.createCategories();

      // Step 2: Create books
      await this.createBooks(data.books);

      // Step 3: Create methods
      await this.createMethods(data.methods);

      // Step 4: Create courses with relationships
      await this.createCoursesWithRelationships(data.courses);

      console.log('\n=== IMPORT COMPLETE ===');
      console.log('✓ All courses, books, methods, and relationships have been imported!');
      
      // Summary stats
      console.log('\n=== FINAL SUMMARY ===');
      console.log(`Categories: ${this.createdCategories.size}`);
      console.log(`Books: ${this.createdBooks.size}`);
      console.log(`Methods: ${this.createdMethods.size}`);
      console.log(`Courses: Successfully imported with all relationships`);

    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const dataFile = path.join(__dirname, '../sample/parsed-courses.json');
  
  if (!fs.existsSync(dataFile)) {
    console.error('Parsed data file not found. Run parse-sample-courses.js first.');
    process.exit(1);
  }

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease set these in your .env.local file or environment');
    process.exit(1);
  }

  const importer = new CourseImporter();
  await importer.importAll(dataFile);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CourseImporter;