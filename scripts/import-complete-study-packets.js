// Script to import Complete Study Packets from share.igpsedu.com
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const CATEGORY_ID = 'b8531503-d131-4ec2-8ff9-be05fe57f09c'; // Complete Study Packages category
const USER_ID = '4ef526fd-43a0-44fd-82e4-2ab404ef673c';
const SHARED_USER_ID = 'd5369e6a-0859-4ccc-b75a-d966c8eb3da0';
const BASE_URL = 'https://share.igpsedu.com/Proprietary%20Products/Standardizers/Complete%20Study%20Packet/';

// Extract clean title from filename
function extractTitle(filename) {
  // Remove .pdf extension
  let title = filename.replace('.pdf', '');
  
  // Decode URL encoding
  title = decodeURIComponent(title);
  
  // Handle special cases
  title = title.replace(' - Complete Study Packet', '');
  title = title.replace(' -Complete Study Packet', '');
  title = title.replace(' - COMPLETE STUDY PACKET', '');
  title = title.replace(' - Complete Study Plan', '');
  title = title.replace(' - Complelet Study Packet', ''); // Fix typo
  title = title.replace(' - Complete Srtudy Packet', ''); // Fix typo
  title = title.replace(' - COMPELTE STUDY PACKET', ''); // Fix typo
  title = title.replace(' - Complete Study Habits', ''); // Different naming
  
  // Clean up extra spaces
  title = title.trim();
  
  return title;
}

// Extract book title from the study packet title
function extractBookTitle(title) {
  // Remove common suffixes that are not part of the book title
  let bookTitle = title;
  
  // Remove lesson/syllabus/study plan indicators
  bookTitle = bookTitle.replace(/ - \d+-Lesson Syllabus$/, '');
  bookTitle = bookTitle.replace(/ – \d+-Lesson Syllabus$/, '');
  bookTitle = bookTitle.replace(/ - Discussion Questions$/, '');
  bookTitle = bookTitle.replace(/ - Sample Lesson Plans.*$/, '');
  bookTitle = bookTitle.replace(/ - Themes & Quotes$/, '');
  bookTitle = bookTitle.replace(/ - Weekly Plans$/, '');
  bookTitle = bookTitle.replace(/ - Syllabus$/, '');
  bookTitle = bookTitle.replace(/^Study Plan for /, '');
  bookTitle = bookTitle.replace(/ by .*$/, ''); // Remove author info
  bookTitle = bookTitle.replace(/^Themes & Vocabulary for /, '');
  bookTitle = bookTitle.replace(/^Literary Techniques & Themes of /, '');
  bookTitle = bookTitle.replace(/^Key Terms & Definitions from /, '');
  bookTitle = bookTitle.replace(/^10 Essay Topics for /, '');
  bookTitle = bookTitle.replace(/^Outline of Study for /, '');
  bookTitle = bookTitle.replace(/^Prompts and Passages for Close Reading of /, '');
  bookTitle = bookTitle.replace(/^30-Week AP English Literature Syllabus$/, ''); // Not a book
  
  return bookTitle.trim();
}

// Generate content description
function generateContent(title, bookTitle, url) {
  let content = `# ${title}\n\n`;
  
  if (bookTitle && bookTitle !== title) {
    content += `## Study Guide for "${bookTitle}"\n\n`;
  }
  
  content += `This comprehensive study packet provides educators and students with essential resources for studying this literary work.\n\n`;
  
  content += `### What's Included:\n\n`;
  content += `- **Character Analysis**: In-depth exploration of main and supporting characters\n`;
  content += `- **Theme Exploration**: Detailed examination of central themes and motifs\n`;
  content += `- **Discussion Questions**: Thought-provoking questions for classroom discussion\n`;
  content += `- **Activities & Assignments**: Engaging exercises to deepen understanding\n`;
  content += `- **Assessment Materials**: Quizzes and tests to evaluate comprehension\n`;
  content += `- **Teaching Resources**: Lesson plans and instructional strategies\n\n`;
  
  content += `### Resource Information:\n\n`;
  content += `- **Format**: PDF Document\n`;
  content += `- **Suitable for**: High School and College Literature Courses\n`;
  content += `- **Duration**: Approximately 30-40 hours of instructional content\n\n`;
  
  if (url) {
    content += `### Download Link:\n\n`;
    content += `[Download Study Packet](${url})\n`;
  }
  
  return content;
}

async function importStudyPackets() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // List of all study packet URLs from the scrape
  const studyPacketUrls = [
    "10%20Essay%20Topics%20for%20A%20Confederacy%20of%20Dunces%20.pdf",
    "30-Week%20AP%20English%20Literature%20Syllabus.pdf",
    "A%20Clockwork%20Orange%20%E2%80%93%2030-Lesson%20Syllabus.pdf",
    "A%20Confederacy%20of%20Dunces%20-%20Discussion%20Questions.pdf",
    "A%20GOOD%20MAN%20IS%20HARD%20TO%20FIND%20-%20Sample%20Lesson%20Plans%20(30%20lessons).pdf",
    "A%20Good%20Man%20Is%20Hard%20to%20Find%20-%20Themes%20%26%20Quotes.pdf",
    "A%20History%20fo%20Seven%20Killings%20-%20Weekly%20Plans.pdf",
    "A%20Midsummer%20Night's%20Dream%20-%20Complete%20Study%20Packet.pdf",
    "A%20Passage%20to%20India%20-%20Complete%20Study%20Packet.pdf",
    "A%20Portrait%20of%20the%20Artist%20as%20a%20Young%20Man%20%20-%20COMPLETE%20STUDY%20PACKET.pdf",
    "A%20River%20Runs%20Through%20It%20-%20COMPLETE%20STUDY%20PACKET.pdf",
    "A%20Scanner%20Darkly%20-%20Complete%20Study%20Packet.pdf",
    "A%20Single%20Man%20-%20Complete%20Study%20Packet.pdf",
    "A%20Streetcar%20Named%20Desire%20-%20Complete%20Study%20Packet.pdf",
    "A%20Tale%20for%20the%20Time%20Being%20%20-%20Complete%20Study%20Packet.pdf",
    "A%20Thousand%20Years%20of%20Good%20Prayers%20-%20Complete%20Study%20Packet.pdf",
    "A%20Tree%20Grows%20in%20Brooklyn%20-%20Complete%20Study%20Packet.pdf",
    "A%20Very%20Old%20Man%20with%20Enormous%20Wings%20-%20Complete%20Study%20Packet.pdf",
    "A%20Vindication%20of%20the%20Rights%20of%20Woman%20-%20Complete%20Study%20Packet.pdf",
    "A%20Visit%20from%20the%20Goon%20Squad%20-%20Complete%20Study%20Packet.pdf",
    "A%20Walk%20in%20the%20Woods%20-%20Complete%20Study%20Packet.pdf",
    "Absalom%2C%20Absalom%20-%20Complete%20Study%20Packet.pdf",
    "All%20Summer%20in%20a%20Day%20-%20Complete%20Study%20Packet.pdf",
    "All%20the%20Kings%20Men%20-%20Syllabus.pdf",
    "All's%20Well%20that%20Ends%20Well%20-%20Complete%20Study%20Packet.pdf",
    "American%20Psycho%20-%20Complete%20Study%20Packet.pdf",
    "Amsterdam%20-%20Complete%20Study%20Packet.pdf",
    "An%20Artist%20in%20the%20Floating%20World%20-%20Complete%20Study%20Packet.pdf",
    "An%20Occurrence%20at%20Owl%20Creek%20Bridge%20-%20Complete%20Study%20Packet.pdf",
    "Anil's%20Ghost%20-%20Complete%20Study%20Packet.pdf",
    "Animal%20Farm%20-%20Complete%20Study%20Packet.pdf",
    "Anna%20Karenina%20-%20Complete%20Study%20Packet.pdf",
    "Antony%20and%20Cleopatra%20%20-%20Complete%20Study%20Packet.pdf",
    "Arch%20of%20Triumph%20-%20Complete%20Study%20Habits.pdf",
    "Around%20the%20World%20in%2080%20Days%20-%20Complete%20Study%20Packet.pdf",
    "As%20I%20Lay%20Dying%20-%20Complete%20Study%20Packet.pdf",
    "Atonement%20-%20Complete%20Study%20Packet.pdf",
    "Barney's%20Version%20-%20Complete%20Study%20Packet.pdf",
    "Bartleby%20%26%20Co.%20-%20Complete%20Study%20Packet.pdf",
    "Beloved%20-%20Complete%20Study%20Packet.pdf",
    "Beowulf%20-%20Complete%20Study%20Packet.pdf",
    "Billy%20Budd%20-%20Complete%20Study%20Packet.pdf",
    "Billy%20Lynn%20Long%20Halftime%20Walk%20-%20Complete%20Study%20Packet.pdf",
    "Bleak%20House%20%20-%20Complete%20Study%20Packet.pdf",
    "Blindness%20-%20Complete%20Study%20Packet.pdf",
    "Blood%20Meridian%20-%20Complete%20Study%20Packet.pdf",
    "Brave%20New%20World%20%20-%20Complete%20Study%20Plan.pdf",
    "Breakfast%20at%20Tiffany%20-%20Complete%20Study%20Packet.pdf",
    "Brideshead%20Revisited%20%20-%20Complete%20Study%20Packet.pdf",
    "Brooklyn%20-%20Complete%20Study%20Plan.pdf",
    "Bud%2C%20Not%20Buddy%20-%20Complete%20Study%20Plan.pdf",
    "Burial%20Rites%20-%20Complete%20Study%20Plan.pdf",
    "Cannery%20Row%20%20-%20Complete%20Study%20Packet.pdf",
    "CARRIE%20-%20COMPLETE%20STUDY%20PACKET.pdf",
    "Cat's%20Cradle%20-%20Complete%20Study%20Packet.pdf",
    "Catch-22%20-%20Complete%20Study%20Packet.pdf",
    "Ceremony%20-%20Complete%20Study%20Packet.pdf",
    "CHARLIE%20AND%20THE%20CHOCOLATE%20FACTORY%20-%20Complete%20Study%20Packet.pdf",
    "Charlotte's%20Web%20-%20Complelet%20Study%20Packet.pdf",
    "Coming%20Through%20Slaughter%20-%20COMPELTE%20STUDY%20PACKET.pdf",
    "Coriolanus%20-%20Complete%20Study%20Packet.pdf",
    "Cry%2C%20the%20Beloved%20Country%20-%20Complete%20Study%20Packet%20.pdf",
    "Cymbeline%20-%20Complete%20Study%20Packet.pdf",
    "Daisy%20Miller%20-%20Complete%20Study%20Packet.pdf",
    "Darkness%20at%20Noon%20-%20Complete%20Study%20Packet.pdf",
    "David%20Copperfield%20-%20Complete%20Study%20Packet.pdf",
    "Death%20Comes%20for%20the%20Archbishop%20-%20Complete%20Study%20Packet.pdf",
    "Death%20in%20Venice%20-%20Complete%20Study%20Packet.pdf",
    "Death%20of%20a%20Salesman%20-%20Complete%20Study%20Packet.pdf",
    "Deliverance%20-%20Complete%20Study%20Packet.pdf",
    "Department%20of%20Speculation%20-%20Complete%20Study%20Packet.pdf",
    "Disgrace%20-%20Complete%20Study%20Packet.pdf",
    "Do%20Androids%20Dream%20of%20Electric%20Sheep%20-%20Complete%20Study%20Packet.pdf",
    "Don%20Quixote%20-%20Complete%20Study%20Packet.pdf",
    "Down%20and%20Out%20in%20Paris%20and%20London%20%20-%20Complete%20Study%20Packet.pdf",
    "Dracula%20-%20Complete%20Study%20Packet.pdf",
    "Dubliners%20-%20Complete%20Study%20Packet.pdf",
    "Emma%20-%20Complete%20Study%20Packet.pdf",
    "Empire%20of%20the%20Sun%20-%20Complete%20Study%20Packet.pdf",
    "Erasure%20-%20Complete%20Study%20Packet.pdf",
    "Ethan%20Frome%20-%20Complete%20Study%20Packet.pdf",
    "Evelina%20-%20Complete%20Study%20Packet.pdf",
    "Fahrenheit%20451%20-%20Complete%20Study%20Packet.pdf",
    "Far%20from%20the%20Madding%20Crowd%20-%20Complete%20Study%20Packet.pdf",
    "Fates%20and%20Furies%20-%20Complete%20Study%20Packet.pdf",
    "Fifteen%20Dogs%20-%20Complete%20Study%20Packet.pdf",
    "Finnegans%20Wake%20-%20Complete%20Study%20Packet%20.pdf",
    "Frankenstein%20-%20Complete%20Study%20Packet.pdf",
    "Freckle%20Juice%20-%20Complete%20Study%20Packet.pdf",
    "GARGANTUA%20AND%20PANTAGRUEL-%20Complete%20Study%20Packet.pdf",
    "Girl%20-%20Complete%20Study%20Packet.pdf",
    "Gone%20with%20the%20Wind%20-%20Complete%20Study%20Packet.pdf",
    "Goodbye%2C%20Columbus%20-%20Complete%20Study%20Packet.pdf",
    "Gulliver%E2%80%99s%20Travels%20-%20Complete%20Study%20Packet.pdf",
    "Hamlet%20-%20Complete%20Study%20Packet.pdf",
    "Harrison%20Bergeron%20-%20Complete%20Study%20Packet.pdf",
    "Heart%20of%20Darkness%20-%20Complete%20Study%20Packet.pdf",
    "Henderson%20the%20Rain%20King%20-%20Complete%20Study%20Packet.pdf",
    "Henry%20IV%20-%20Complete%20Study%20Packet.pdf",
    "Henry%20V%20-%20Complete%20Study%20Packet.pdf",
    "Herzog%20-%20Complete%20Study%20Packet.pdf",
    "Hillbilly%20Elegy%20-%20Complete%20Study%20Packet.pdf",
    "House%20Made%20of%20Dawn%20-%20Complete%20Study%20Packet.pdf",
    "House%20of%20the%20Spirits%20-%20Complete%20Study%20Packet.pdf",
    "Housekeeping%20-%20Complete%20Study%20Packet.pdf",
    "How%20Emotions%20Are%20Made%20by%20Lisa%20Feldman%20Barrett%20-%20Complete%20Study%20Packet.pdf",
    "How%20Should%20a%20Person%20Be%20-Complete%20Study%20Packet.pdf",
    "Howards%20End%20-%20Complete%20Study%20Packet.pdf",
    "I%2C%20Claudius%20-%20Complete%20Study%20Packet.pdf",
    "If%20on%20a%20Winter's%20Night%20a%20Traveler%20-%20Complete%20Study%20Packet%20.pdf",
    "If%20This%20Is%20a%20Man%20by%20Primo%20Levi%20-%20Complete%20Study%20Packet.pdf",
    "In%20Cold%20Blood%20-%20Complete%20Study%20Packet%20.pdf",
    "In%20Praise%20of%20Folly%20-%20Complete%20Study%20Packet.pdf",
    "In%20the%20Skin%20of%20a%20Lion%20-%20Complete%20Study%20Packet.pdf",
    "Indian%20Education%20by%20Sherman%20-%20Complete%20Study%20Packet.pdf",
    "Infinite%20Jest%20-%20Complete%20Study%20Packet.pdf",
    "Into%20the%20Wild%20%20-%20Complete%20Srtudy%20Packet%20.pdf",
    "Invisible%20Cities%20%20-%20Complete%20Study%20Packet.pdf",
    "Invisible%20Man%20-%20Complete%20Study%20Packet.pdf",
    "Ironweed%20-%20Complete%20Study%20Packet.pdf",
    "Journey%20to%20the%20End%20of%20the%20Night%20%20-%20Complete%20Study%20Packet.pdf",
    "Julius%20Caesar%20-%20Complete%20Study%20Packet.pdf",
    "Kafka%20on%20the%20Shore%20-%20Complete%20Study%20Packet.pdf",
    "Key%20Terms%20%26%20Definitions%20from%20A%20Confederacy%20of%20Dunces%20.pdf",
    "King%20John%20-%20Complete%20Study%20Packet.pdf",
    "Kiss%20of%20the%20Spider%20Woman%20-%20Complete%20Study%20Packet.pdf",
    "Lather%20and%20Nothing%20Else%20-%20Complete%20Study%20Packet.pdf",
    "Leonardo%20da%20Vinci%20%20-%20Complete%20Study%20Packet.pdf",
    "Les%20Mis%C3%A9rables%20-%20Complete%20Study%20Packet.pdf",
    "Let%20the%20Great%20World%20Spin%20-%20Complete%20Study%20Packet.pdf",
    "Life%20After%20Life%20%20-%20Complete%20Study%20Packet.pdf",
    "Life%20of%20Pi%20%20-%20Complete%20Study%20Packet%20.pdf",
    "Light%20in%20August%20-%20Complete%20Study%20Packet.pdf",
    "Lincoln%20in%20the%20Bardo%20%20-%20Complete%20Study%20Packet.pdf",
    "Literary%20Techniques%20%26%20Themes%20of%20A%20Little%20Life%20.pdf",
    "Little%20Women%20-%20Complete%20Study%20Packet.pdf",
    "Lolita%20-%20Complete%20Study%20Packet.pdf",
    "Long%20Day's%20Journey%20Into%20Night%20%20-%20Complete%20Study%20Packet.pdf",
    "Lord%20Jim%20-%20Complete%20Study%20Packet.pdf",
    "Love%20in%20the%20Time%20of%20Cholera%20-%20Complete%20Study%20Packet.pdf",
    "Love's%20Labour's%20Lost%20-%20Complete%20Study%20Packet.pdf",
    "Madame%20Bovary%20-%20Complete%20Study%20Packet.pdf",
    "Man%20and%20the%20Natural%20World%20-%20Complete%20Study%20Packet.pdf",
    "Mansfield%20Park%20-%20Complete%20Study%20Packet.pdf",
    "MATILDA%20-%20Complete%20Study%20Packet.pdf",
    "Measure%20for%20Measure%20-%20Complete%20Study%20Packet.pdf",
    "Middlemarch%20-%20Complete%20Study%20Packet.pdf",
    "Middlesex%20-%20Complete%20Study%20Packet.pdf",
    "MIDNIGHT'S%20CHILDREN%20-%20Complete%20Study%20Packet.pdf",
    "Mrs.%20Dalloway%20-%20Complete%20Study%20Packet.pdf",
    "My%20Brilliant%20Friend%20-%20Complete%20Study%20Packet.pdf",
    "My%20Name%20Is%20Lucy%20Barton%20-%20Complete%20Study%20Packet.pdf",
    "Native%20Son%20-%20Complete%20Study%20Packet.pdf",
    "Nausea%20-%20Complete%20Study%20Packet.pdf",
    "Neuromancer%20-%20Complete%20Study%20Packet.pdf",
    "Never%20Let%20Me%20Go%20-%20Complete%20Study%20Packet.pdf",
    "No%20Country%20for%20Old%20Men%20-%20Complete%20Study%20Packet.pdf",
    "North%20and%20South%20-%20Complete%20Study%20Packet.pdf",
    "Northanger%20Abbey%20-%20Complete%20Study%20Packet.pdf",
    "Notes%20from%20the%20Underground%20%20-%20Complete%20Study%20Packet.pdf",
    "Oedipus%20Rex%20-%20Complete%20Study%20Packet.pdf",
    "Of%20Human%20Bondage%20-%20Complete%20Study%20Packet.pdf",
    "Of%20Mice%20and%20Men%20-%20Complete%20Study%20Packet.pdf",
    "Oliver%20Twist%20%20-%20Complete%20Study%20Packet.pdf",
    "On%20Chesil%20Beach%20%20-%20Complete%20Study%20Packet.pdf",
    "One%20Flew%20Over%20the%20Cuckoo's%20Nest%20-%20Complete%20Study%20Packet.pdf",
    "One%20Hundred%20Years%20of%20Solitude%20-%20Complete%20Study%20Packet.pdf",
    "Oranges%20Are%20Not%20the%20Only%20Fruit%20%20-%20Complete%20Study%20Packet.pdf",
    "Orlando%20-%20Complete%20Study%20Packet.pdf",
    "Othello%20-%20Complete%20Study%20Packet.pdf",
    "Outline%20of%20Study%20for%20A%20Confederacy%20of%20Dunces%20.pdf",
    "Out%20of%20the%20Dust%20-%20Complete%20Study%20Packet.pdf",
    "Pale%20Fire%20-%20Complete%20Study%20Packet.pdf",
    "Paradise%20Lost%20-%20Complete%20Study%20Packet.pdf",
    "Persuasion%20-%20Complete%20Study%20Packet.pdf",
    "Play%20It%20As%20It%20Lays%20-%20Complete%20Study%20Packet.pdf",
    "Portnoy's%20Complaint%20-%20Complete%20Study%20Packet.pdf",
    "Possession%20-%20Complete%20Study%20Packet.pdf",
    "Pride%20and%20Prejudice%20-%20Complete%20Study%20Packet.pdf",
    "Prompts%20and%20Passages%20for%20Close%20Reading%20of%20Canticle%20for%20Leibowitz.pdf",
    "Purity%20-%20Complete%20Study%20Packet.pdf",
    "Pygmalion%20-%20Complete%20Study%20Packet%20.pdf",
    "Rabbit%2C%20Run%20%20-%20Complete%20Study%20Packet.pdf",
    "Ragtime%20-%20Complete%20Study%20Packet.pdf",
    "Raymond's%20Run%20-%20Complete%20Study%20Packet.pdf",
    "Rayuela%20-%20Complete%20Study%20Packet.pdf",
    "Revolutionary%20Road%20-%20Complete%20Study%20Packet.pdf",
    "RICHARD%20II%20-%20Complete%20Study%20Packet.pdf",
    "Study%20Plan%20for%20A%20Fine%20Balance%20by%20Rohinton%20Mistry.pdf",
    "The%20Architecture%20of%20Happiness%20-%20Complete%20Study%20Packet.pdf",
    "The%20Decline%20and%20Fall%20of%20the%20Roman%20Empire%20-%20Complete%20Study%20Packet.pdf",
    "The%20Groves%20of%20Academe.pdf",
    "The%20Heart%20of%20a%20Dog%20-%20Complete%20Study%20Packet.pdf",
    "Themes%20%26%20Vocabulary%20for%20A%20Man%20for%20All%20Seasons.pdf",
    "Twenty%20Thousand%20Leagues%20Under%20the%20Sea%20-%20Complete%20Study%20Packet.pdf",
    "Out%20of%20the%20Dust%20-%20Complete%20Study%20Packet.pdf"
  ];

  // First, get all books from our database for matching
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, title')
    .order('title');

  if (booksError) {
    console.error('Failed to fetch books:', booksError);
    return;
  }

  // Create a map for easier book matching
  const bookMap = new Map();
  books.forEach(book => {
    bookMap.set(book.title.toLowerCase(), book.id);
    // Also add variations
    if (book.title.includes(':')) {
      const shortTitle = book.title.split(':')[0].trim();
      bookMap.set(shortTitle.toLowerCase(), book.id);
    }
  });

  console.log(`Found ${books.length} books in database`);
  console.log(`Processing ${studyPacketUrls.length} study packets...`);

  let successCount = 0;
  let errorCount = 0;

  for (const filename of studyPacketUrls) {
    try {
      const title = extractTitle(filename);
      const bookTitle = extractBookTitle(title);
      const url = BASE_URL + filename;
      
      // Skip non-book items
      if (!bookTitle || bookTitle === '30-Week AP English Literature Syllabus') {
        console.log(`⏭️  Skipping: ${title} (not a book-specific packet)`);
        continue;
      }

      // Try to find matching book
      let bookId = null;
      if (bookTitle) {
        bookId = bookMap.get(bookTitle.toLowerCase());
        
        // Try variations
        if (!bookId && bookTitle.includes("'")) {
          // Try with straight quotes
          const altTitle = bookTitle.replace(/'/g, "'");
          bookId = bookMap.get(altTitle.toLowerCase());
        }
        
        if (!bookId && bookTitle.includes("'")) {
          // Try with curly quotes
          const altTitle = bookTitle.replace(/'/g, "'");
          bookId = bookMap.get(altTitle.toLowerCase());
        }
      }

      // Generate content description
      const content = generateContent(title, bookTitle, url);

      const contentData = {
        name: title,
        content: content,
        category_id: CATEGORY_ID,
        user_id: USER_ID,
        is_public: false,
        featured: true,
        status: 'active',
        tags: ['study-guide', 'complete-packet', 'teaching-resource', 'literature'],
        content_data: {
          type: 'complete-study-packages',
          duration_hours: 30,
          level: 'intermediate',
          resource_url: url,
          book_title: bookTitle,
          package_contents: [
            { title: 'Introduction & Overview', type: 'document', order: 1 },
            { title: 'Character Analysis', type: 'document', order: 2 },
            { title: 'Theme Exploration', type: 'document', order: 3 },
            { title: 'Discussion Questions', type: 'document', order: 4 },
            { title: 'Activities & Assignments', type: 'assignment', order: 5 },
            { title: 'Assessment Materials', type: 'quiz', order: 6 }
          ]
        }
      };

      // Create the content
      const { data: newContent, error: contentError } = await supabase
        .from('content')
        .insert(contentData)
        .select()
        .single();

      if (contentError) {
        console.error(`❌ Failed to create "${title}":`, contentError);
        errorCount++;
        continue;
      }

      // If we found a matching book, create the association
      if (bookId && newContent) {
        const { error: bookError } = await supabase
          .from('content_books')
          .insert({
            content_id: newContent.id,
            book_id: bookId,
            is_primary: true,
            position: 0
          });

        if (bookError) {
          console.error(`⚠️  Failed to associate book for "${title}":`, bookError);
        } else {
          console.log(`✅ Created: ${title} (linked to book: ${bookTitle})`);
        }
      } else {
        console.log(`✅ Created: ${title} (no book match found for: ${bookTitle})`);
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`✅ Successfully imported: ${successCount} study packets`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⏭️  Skipped: ${studyPacketUrls.length - successCount - errorCount}`);
}

// Run the import
if (require.main === module) {
  importStudyPackets()
    .then(() => {
      console.log('\n✨ Import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importStudyPackets };