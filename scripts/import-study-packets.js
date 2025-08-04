// Script to import Complete Study Packets
const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');

const CATEGORY_ID = 'b8531503-d131-4ec2-8ff9-be05fe57f09c'; // Complete Study Packages category
const USER_ID = '4ef526fd-43a0-44fd-82e4-2ab404ef673c';

// Study packets data from the shared URL
const studyPackets = [
  {
    title: "Hamlet - Complete Study Packet",
    bookTitle: "Hamlet",
    description: "Comprehensive study guide for Shakespeare's Hamlet including character analysis, themes, discussion questions, and teaching resources.",
    url: "https://share.igpsedu.com/Proprietary%20Products/Standardizers/Complete%20Study%20Packet/Hamlet%20-%20Complete%20Study%20Packet.pdf"
  },
  {
    title: "A Midsummer Night's Dream - Complete Study Packet",
    bookTitle: "A Midsummer Night's Dream",
    description: "Complete teaching resources for A Midsummer Night's Dream including lesson plans, activities, and assessment materials.",
    url: "https://share.igpsedu.com/Proprietary%20Products/Standardizers/Complete%20Study%20Packet/A%20Midsummer%20Night's%20Dream%20-%20Complete%20Study%20Packet.pdf"
  },
  {
    title: "A Streetcar Named Desire - Complete Study Packet",
    bookTitle: "A Streetcar Named Desire", 
    description: "In-depth study materials for Tennessee Williams' classic play, featuring scene analysis, character studies, and thematic exploration.",
    url: "https://share.igpsedu.com/Proprietary%20Products/Standardizers/Complete%20Study%20Packet/A%20Streetcar%20Named%20Desire%20-%20Complete%20Study%20Packet.pdf"
  },
  {
    title: "Brave New World - Complete Study Packet",
    bookTitle: "Brave New World",
    description: "Comprehensive teaching guide for Aldous Huxley's dystopian novel with discussion topics, essay prompts, and vocabulary exercises.",
    url: null // Will be added if found
  },
  {
    title: "Twenty Thousand Leagues Under the Sea - Complete Study Packet",
    bookTitle: "Twenty Thousand Leagues under the Sea",
    description: "Adventure-filled study guide for Jules Verne's classic, including scientific concepts, character maps, and creative activities.",
    url: null
  },
  {
    title: "One Flew Over the Cuckoo's Nest - Complete Study Packet",
    bookTitle: "One Flew Over the Cuckoo's Nest",
    description: "Detailed analysis guide for Ken Kesey's novel, exploring themes of individuality, authority, and mental health.",
    url: null
  },
  {
    title: "Out of the Dust - Complete Study Packet",
    bookTitle: "Out of the Dust",
    description: "Study materials for Karen Hesse's Newbery Medal winner, including historical context and poetic analysis.",
    url: null
  }
];

// Book mapping from the database query results
const bookMapping = {
  "Hamlet": "bbd2a6a0-26f7-4027-96ec-fa0572ddb298",
  "A Midsummer Night's Dream": "b21e1489-3fdf-4c0a-968c-245b3ea33d2a",
  "A Streetcar Named Desire": "95a5ca6a-c86e-4698-9e6e-d5e73f2618a2",
  "Brave New World": "ed6a2697-9519-4d22-a9b8-62078cbc2d14",
  "Twenty Thousand Leagues under the Sea": "2a23d4b9-ddc5-4f00-9860-2a382e14eb1f",
  "One Flew Over the Cuckoo's Nest": "afc5d639-7b85-48a1-a5bb-a9f41e9b59d7",
  "Out of the Dust": "bf646785-64e0-4afb-a802-f4c576d0bbfc"
};

async function importStudyPackets() {
  const supabase = createClientComponentClient();
  
  for (const packet of studyPackets) {
    try {
      const bookId = bookMapping[packet.bookTitle];
      
      const contentData = {
        name: packet.title,
        content: packet.description,
        category_id: CATEGORY_ID,
        user_id: USER_ID,
        is_public: false,
        featured: true,
        status: 'active',
        tags: ['study-guide', 'complete-packet', 'teaching-resource'],
        content_data: {
          type: 'complete-study-packages',
          duration_hours: 30, // Default 30 hours for a complete study packet
          level: 'intermediate',
          resource_url: packet.url,
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
      const { data: content, error: contentError } = await supabase
        .from('content')
        .insert(contentData)
        .select()
        .single();

      if (contentError) {
        console.error(`Failed to create ${packet.title}:`, contentError);
        continue;
      }

      // If we have a matching book, create the association
      if (bookId) {
        const { error: bookError } = await supabase
          .from('content_books')
          .insert({
            content_id: content.id,
            book_id: bookId,
            is_primary: true,
            position: 0
          });

        if (bookError) {
          console.error(`Failed to associate book for ${packet.title}:`, bookError);
        }
      }

      console.log(`✓ Created: ${packet.title}`);
    } catch (error) {
      console.error(`Error processing ${packet.title}:`, error);
    }
  }
}

// Export for use in other scripts
module.exports = { studyPackets, bookMapping, importStudyPackets };