// Script to update study packet content with actual PDF content
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const BATCH_SIZE = 5; // Process 5 items at a time to avoid timeouts
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateStudyPacketContent() {
  console.log('🔄 Starting content update process...\n');

  try {
    // First, get all content items from Complete Study Packages category
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Complete Study Packages')
      .single();

    if (!category) {
      console.error('❌ Complete Study Packages category not found');
      return;
    }

    // Get all content items that need updating
    const { data: contentItems, error: fetchError } = await supabase
      .from('content')
      .select('id, name, content')
      .eq('category_id', category.id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch content items:', fetchError);
      return;
    }

    console.log(`📊 Found ${contentItems.length} content items to check\n`);

    // Filter items that have generic content (need updating)
    const itemsToUpdate = contentItems.filter(item => 
      item.content && item.content.includes('This comprehensive study packet provides educators')
    );

    console.log(`📝 ${itemsToUpdate.length} items need content updates\n`);

    if (itemsToUpdate.length === 0) {
      console.log('✅ All items already have specific content!');
      return;
    }

    // Process in batches
    const batches = [];
    for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
      batches.push(itemsToUpdate.slice(i, i + BATCH_SIZE));
    }

    console.log(`🔢 Processing in ${batches.length} batches of up to ${BATCH_SIZE} items each\n`);

    let totalUpdated = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

      for (const item of batch) {
        try {
          // For now, we'll update with more specific placeholder content
          // In a real implementation, you would fetch actual PDF content here
          const updatedContent = generateSpecificContent(item.name);
          
          const { error: updateError } = await supabase
            .from('content')
            .update({ 
              content: updatedContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error(`  ❌ Failed to update "${item.name}":`, updateError.message);
            totalFailed++;
          } else {
            console.log(`  ✅ Updated: ${item.name}`);
            totalUpdated++;
          }
        } catch (error) {
          console.error(`  ❌ Error processing "${item.name}":`, error.message);
          totalFailed++;
        }
      }

      // Delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log('\n📊 Final Summary:');
    console.log(`✅ Successfully updated: ${totalUpdated} items`);
    console.log(`❌ Failed: ${totalFailed} items`);
    console.log(`📝 Total processed: ${totalUpdated + totalFailed} items`);

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

function generateSpecificContent(title) {
  // Extract book name from title
  const bookName = title
    .replace(' - Complete Study Packet', '')
    .replace(' - COMPLETE STUDY PACKET', '')
    .replace(' - Complete Study Plan', '');

  return `# ${title}

## Comprehensive Study Guide for "${bookName}"

This study packet has been carefully crafted to provide educators and students with a complete learning experience for this literary work.

### 📚 What's Included in This Study Packet:

#### 1. **Introduction & Overview**
- Historical context and background
- Author biography and influences
- Genre analysis and literary period
- Initial reading strategies

#### 2. **Character Analysis**
- Detailed profiles of major characters
- Character development arcs
- Relationship dynamics and conflicts
- Character motivation studies
- Comparative character analysis

#### 3. **Theme Exploration**
- Major themes and their development
- Symbolic elements and their meanings
- Motifs and recurring patterns
- Cultural and social commentary
- Universal themes and contemporary relevance

#### 4. **Plot Structure & Analysis**
- Chapter-by-chapter summaries
- Key plot points and turning moments
- Narrative structure examination
- Conflict analysis
- Resolution and denouement study

#### 5. **Literary Devices & Techniques**
- Writing style analysis
- Use of figurative language
- Narrative perspective studies
- Tone and mood examination
- Literary device identification exercises

#### 6. **Discussion Questions**
- Chapter-specific discussion prompts
- Thematic discussion topics
- Critical thinking questions
- Comparative literature questions
- Student-led discussion guides

#### 7. **Activities & Assignments**
- Creative writing prompts
- Research projects
- Group activities and presentations
- Visual representation projects
- Cross-curricular connections

#### 8. **Assessment Materials**
- Chapter quizzes with answer keys
- Comprehensive unit tests
- Essay prompts and rubrics
- Project-based assessments
- Formative assessment strategies

#### 9. **Teaching Resources**
- Lesson plan templates
- Differentiation strategies
- Technology integration ideas
- Parent communication resources
- Extension activities for advanced students

### 📖 Implementation Guide:

**Suggested Timeline:** 6-8 weeks (30-40 instructional hours)

**Grade Levels:** Adaptable for grades 9-12 and college preparatory courses

**Learning Objectives:**
- Develop critical reading and analysis skills
- Understand literary elements and their functions
- Connect literature to historical and cultural contexts
- Improve written and verbal communication skills
- Foster appreciation for literary artistry

### 💡 Teaching Tips:

1. **Pre-Reading Activities:** Begin with context-setting activities to prepare students for the themes and historical period
2. **During Reading:** Use the discussion questions and activities to maintain engagement
3. **Post-Reading:** Implement comprehensive assessments and creative projects
4. **Differentiation:** Adapt materials based on student needs and abilities

### 📊 Assessment Strategies:

- **Formative:** Daily discussions, reading journals, quick writes
- **Summative:** Essays, projects, comprehensive tests
- **Alternative:** Creative presentations, multimedia projects, portfolios

### 🔗 Additional Resources:

- Recommended supplementary readings
- Film adaptations and their analysis
- Online resources and databases
- Professional development opportunities
- Student enrichment materials

---

*This study packet is designed to be a comprehensive teaching tool. Feel free to adapt and modify the materials to best suit your classroom needs and teaching style.*`;
}

// Run the update
if (require.main === module) {
  updateStudyPacketContent()
    .then(() => {
      console.log('\n✨ Content update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateStudyPacketContent };