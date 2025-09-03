#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Course data parser for HTML files
class CourseParser {
  constructor() {
    this.courses = [];
    this.allBooks = new Map(); // Track unique books
    this.allMethods = new Map(); // Track unique methods
  }

  parseHtmlFile(filePath) {
    try {
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      // Extract course title
      const titleElement = document.querySelector('h1');
      const title = titleElement ? titleElement.textContent.trim() : path.basename(filePath, '.html');

      // Extract course overview/description
      const overviewSection = this.findSectionAfterHeading(document, 'Course Overview');
      const description = overviewSection ? overviewSection.textContent.trim() : '';

      // Extract books from Literary Explorations section
      const books = this.extractBooks(document);
      
      // Extract teaching methods from Educational Approach section  
      const methods = this.extractMethods(document);

      // Determine course category and difficulty based on filename/title
      const { category, difficulty } = this.inferCourseMetadata(title, filePath);

      const course = {
        title,
        description,
        short_description: this.generateShortDescription(description),
        category,
        difficulty,
        status: 'published',
        is_public: true,
        books,
        methods,
        sourceFile: path.basename(filePath)
      };

      // Add books to global collection
      books.forEach(book => {
        const key = `${book.title}||${book.author}`;
        if (!this.allBooks.has(key)) {
          this.allBooks.set(key, book);
        }
      });

      // Add methods to global collection
      methods.forEach(method => {
        if (!this.allMethods.has(method.name)) {
          this.allMethods.set(method.name, method);
        }
      });

      return course;
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return null;
    }
  }

  findSectionAfterHeading(document, headingText) {
    const headings = document.querySelectorAll('h2, h3');
    let targetHeading = null;
    
    for (const heading of headings) {
      if (heading.textContent.trim().toLowerCase().includes(headingText.toLowerCase())) {
        targetHeading = heading;
        break;
      }
    }
    
    if (!targetHeading) return null;
    
    // Find the next paragraph after this heading
    let nextElement = targetHeading.nextElementSibling;
    while (nextElement && nextElement.tagName !== 'P') {
      nextElement = nextElement.nextElementSibling;
    }
    
    return nextElement;
  }

  extractBooks(document) {
    const books = [];
    
    // Look for Literary Explorations section
    const bookSection = this.findBookSection(document);
    if (!bookSection) return books;

    // Find all book entries (usually in div.book or similar structure)
    const bookElements = bookSection.querySelectorAll('.book, .grid > div');
    
    bookElements.forEach(bookEl => {
      const titleEl = bookEl.querySelector('h3');
      const authorEl = bookEl.querySelector('p');
      
      if (titleEl) {
        const title = titleEl.textContent.trim();
        const author = authorEl ? authorEl.textContent.trim() : 'Unknown Author';
        
        // Skip if it's not a real book (like section headers)
        if (title && !title.toLowerCase().includes('approach') && !title.toLowerCase().includes('method')) {
          books.push({
            title,
            author: author === 'GVL Original Story' ? 'GVL Pedagogical Team' : author,
            is_required: true
          });
        }
      }
    });

    return books;
  }

  findBookSection(document) {
    // Look for sections with books
    const sections = document.querySelectorAll('.grid, .books');
    for (const section of sections) {
      // Check if this section contains book-like content
      const hasBooks = section.querySelector('.book, h3');
      if (hasBooks) {
        return section;
      }
    }
    
    // Fallback: look for any grid after "Literary Explorations" heading
    const headings = document.querySelectorAll('h2');
    for (const heading of headings) {
      if (heading.textContent.toLowerCase().includes('literary') || 
          heading.textContent.toLowerCase().includes('exploration')) {
        let nextEl = heading.nextElementSibling;
        while (nextEl) {
          if (nextEl.classList.contains('grid')) {
            return nextEl;
          }
          nextEl = nextEl.nextElementSibling;
        }
      }
    }
    
    return null;
  }

  extractMethods(document) {
    const methods = [];
    
    // Look for Educational Approach section
    const methodSection = this.findMethodSection(document);
    if (!methodSection) return methods;

    // Find all method entries (usually in div.feature)
    const methodElements = methodSection.querySelectorAll('.feature, .approach > div');
    
    methodElements.forEach(methodEl => {
      const titleEl = methodEl.querySelector('h3');
      const descEl = methodEl.querySelector('p');
      
      if (titleEl) {
        const name = titleEl.textContent.trim();
        const description = descEl ? descEl.textContent.trim() : '';
        
        methods.push({
          name,
          description,
          category_type: 'pedagogical'
        });
      }
    });

    return methods;
  }

  findMethodSection(document) {
    // Look for Educational Approach section
    const headings = document.querySelectorAll('h2');
    for (const heading of headings) {
      if (heading.textContent.toLowerCase().includes('approach') || 
          heading.textContent.toLowerCase().includes('method')) {
        let nextEl = heading.nextElementSibling;
        while (nextEl) {
          if (nextEl.classList.contains('approach') || nextEl.classList.contains('feature')) {
            return nextEl;
          }
          nextEl = nextEl.nextElementSibling;
        }
      }
    }
    
    return null;
  }

  inferCourseMetadata(title, filePath) {
    const filename = path.basename(filePath, '.html').toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Determine difficulty based on grade or course level
    let difficulty = 'standard';
    if (filename.includes('grade_1') || filename.includes('grade_2') || filename.includes('grade_3')) {
      difficulty = 'basic';
    } else if (filename.includes('advanced') || filename.includes('ap_') || titleLower.includes('advanced')) {
      difficulty = 'premium';
    } else if (filename.includes('10-12') || filename.includes('11-12')) {
      difficulty = 'premium';
    }

    // Determine category
    let category = 'Reading & Writing';
    if (titleLower.includes('writing') && !titleLower.includes('reading')) {
      category = 'Systematic Writing';
    } else if (titleLower.includes('cinema') || titleLower.includes('film')) {
      category = 'Foreign Languages';
    } else if (titleLower.includes('ap ') || filename.includes('ap_')) {
      category = 'Standardized Testing';
    } else if (titleLower.includes('close reading') || filename.includes('close_reading')) {
      category = 'Close Reading';
    }

    return { category, difficulty };
  }

  generateShortDescription(description) {
    if (!description) return '';
    
    // Take first sentence or first 150 characters
    const firstSentence = description.split('.')[0];
    if (firstSentence.length > 150) {
      return firstSentence.substring(0, 147) + '...';
    }
    return firstSentence + '.';
  }

  parseAllFiles(coursesDir) {
    const files = fs.readdirSync(coursesDir)
      .filter(file => file.endsWith('.html'))
      .sort();

    console.log(`Found ${files.length} HTML files to parse`);

    files.forEach(file => {
      const filePath = path.join(coursesDir, file);
      const course = this.parseHtmlFile(filePath);
      if (course) {
        this.courses.push(course);
        console.log(`✓ Parsed: ${course.title}`);
      } else {
        console.log(`✗ Failed: ${file}`);
      }
    });

    return {
      courses: this.courses,
      books: Array.from(this.allBooks.values()),
      methods: Array.from(this.allMethods.values())
    };
  }

  generateSupabaseInserts(data) {
    const { courses, books, methods } = data;
    
    return {
      books: books.map(book => ({
        title: book.title,
        author: book.author,
        language: 'en',
        is_public: true,
        tags: ['curriculum', 'literature']
      })),
      methods: methods.map(method => ({
        name: method.name,
        description: method.description,
        category_type: method.category_type || 'pedagogical',
        is_template: true,
        tags: ['pedagogy', 'teaching']
      })),
      courses: courses.map(course => ({
        title: course.title,
        description: course.description,
        short_description: course.short_description,
        difficulty: course.difficulty,
        status: course.status,
        is_public: course.is_public,
        tags: ['literature', 'curriculum', course.category.toLowerCase().replace(' & ', '-').replace(' ', '-')],
        metadata: {
          sourceFile: course.sourceFile,
          bookCount: course.books.length,
          methodCount: course.methods.length
        }
      }))
    };
  }
}

// Main execution
async function main() {
  const coursesDir = path.join(__dirname, '../sample/courses');
  
  if (!fs.existsSync(coursesDir)) {
    console.error('Courses directory not found:', coursesDir);
    process.exit(1);
  }

  const parser = new CourseParser();
  console.log('Starting course parsing...\n');
  
  const data = parser.parseAllFiles(coursesDir);
  
  console.log('\n=== PARSING SUMMARY ===');
  console.log(`Courses parsed: ${data.courses.length}`);
  console.log(`Unique books: ${data.books.length}`);
  console.log(`Unique methods: ${data.methods.length}`);

  // Generate Supabase-ready data
  const supabaseData = parser.generateSupabaseInserts(data);
  
  // Write results to JSON files
  const outputDir = path.join(__dirname, '../sample');
  fs.writeFileSync(
    path.join(outputDir, 'parsed-courses.json'), 
    JSON.stringify(data, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, 'supabase-ready.json'), 
    JSON.stringify(supabaseData, null, 2)
  );

  console.log('\n=== OUTPUT FILES ===');
  console.log('Full data: sample/parsed-courses.json');
  console.log('Supabase ready: sample/supabase-ready.json');
  
  // Display sample data
  console.log('\n=== SAMPLE COURSE ===');
  console.log(JSON.stringify(data.courses[0], null, 2));
  
  console.log('\n=== SAMPLE BOOK ===');
  console.log(JSON.stringify(data.books[0], null, 2));
  
  console.log('\n=== SAMPLE METHOD ===');
  console.log(JSON.stringify(data.methods[0], null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CourseParser;