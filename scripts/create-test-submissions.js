const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTestSubmissions() {
  try {
    // First, get some tasks to create submissions for
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title')
      .limit(3);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found. Creating test tasks first...');
      
      // Create test tasks
      const { data: newTasks, error: createTasksError } = await supabase
        .from('tasks')
        .insert([
          {
            title: '📝 Essay on Climate Change',
            description: 'Write a 500-word essay discussing the impacts of climate change on coastal communities.',
            points: 100,
            submission_type: 'text_only',
            text_submission_enabled: true,
            text_submission_instructions: 'Please provide a well-structured essay with introduction, body paragraphs, and conclusion.'
          },
          {
            title: '🎨 Design a Logo',
            description: 'Create a logo for a new eco-friendly startup company.',
            points: 50,
            submission_type: 'media_only',
            media_required: true,
            allowed_media_types: ['image/png', 'image/jpeg', 'image/svg+xml'],
            max_file_size_mb: 10,
            max_files_count: 3
          },
          {
            title: '📊 Data Analysis Project',
            description: 'Analyze the provided dataset and create a presentation with your findings.',
            points: 150,
            submission_type: 'both',
            text_submission_enabled: true,
            media_required: true,
            text_submission_instructions: 'Include your analysis methodology and key findings.',
            allowed_media_types: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            max_file_size_mb: 20,
            max_files_count: 5
          }
        ])
        .select();

      if (createTasksError) {
        console.error('Error creating tasks:', createTasksError);
        return;
      }

      console.log('Created test tasks:', newTasks);
    }

    // Get all tasks again
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('id, title, submission_type')
      .limit(3);

    // Get a test user (or create one)
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .limit(2);

    if (!users || users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // Create test submissions
    const submissions = [];
    
    for (const task of allTasks) {
      for (const user of users) {
        const statusOptions = ['pending', 'submitted', 'approved', 'rejected'];
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        let submissionData = {
          task_id: task.id,
          user_id: user.id,
          status: randomStatus,
          submitted_at: new Date().toISOString()
        };

        // Add text submission for text-enabled tasks
        if (task.submission_type === 'text_only' || task.submission_type === 'both' || task.submission_type === 'either') {
          submissionData.submission_text = `This is a test submission for ${task.title} by ${user.full_name || user.email}. 
          
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Key points:
1. First important observation
2. Second key finding
3. Third critical insight

In conclusion, this submission demonstrates the student's understanding of the task requirements.`;
        }

        // Add review data for reviewed submissions
        if (randomStatus === 'approved' || randomStatus === 'rejected') {
          submissionData.reviewed_at = new Date().toISOString();
          submissionData.review_notes = `This submission has been reviewed. ${randomStatus === 'approved' ? 'Good work!' : 'Needs improvement.'}`;
          submissionData.score = randomStatus === 'approved' ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20;
        }

        submissions.push(submissionData);
      }
    }

    const { data: createdSubmissions, error: submissionsError } = await supabase
      .from('task_submissions')
      .insert(submissions)
      .select();

    if (submissionsError) {
      console.error('Error creating submissions:', submissionsError);
      return;
    }

    console.log(`Successfully created ${createdSubmissions.length} test submissions!`);
    
    // Create some test media files for media-enabled submissions
    const mediaSubmissions = createdSubmissions.filter((sub, index) => {
      const task = allTasks[Math.floor(index / users.length)];
      return task.submission_type === 'media_only' || task.submission_type === 'both' || task.submission_type === 'either';
    });

    for (const submission of mediaSubmissions.slice(0, 3)) {
      const { error: mediaError } = await supabase
        .from('task_media')
        .insert({
          task_id: submission.task_id,
          user_id: submission.user_id,
          submission_id: submission.id,
          file_name: 'test-document.pdf',
          file_type: 'application/pdf',
          file_size: 1024 * 500, // 500KB
          file_url: 'https://example.com/test-document.pdf',
          is_active: true
        });

      if (mediaError) {
        console.error('Error creating media entry:', mediaError);
      }
    }

    console.log('Test data creation complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestSubmissions();