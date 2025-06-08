# Course Builder Database Schema Documentation

## Overview
The Course Builder database schema has been successfully created with all required tables, relationships, indexes, and Row Level Security (RLS) policies.

## Tables Created

### Core Entity Tables
1. **categories** - Organize all entities (courses, books, vocabulary, etc.)
2. **courses** - Main course information
3. **books** - Learning materials library
4. **vocabulary_groups** - Groups of vocabulary items
5. **vocabulary** - Individual vocabulary items
6. **objectives** - Teaching objectives library
7. **methods** - Teaching methods library
8. **tasks** - Tasks/activities library
9. **schedules** - Teaching schedules
10. **lessons** - Individual lessons within schedules

### Relationship Tables (Many-to-Many)
1. **course_books** - Links courses to books
2. **course_vocabulary_groups** - Links courses to vocabulary groups
3. **vocabulary_group_items** - Links vocabulary items to groups
4. **lesson_objectives** - Links lessons to objectives
5. **lesson_methods** - Links lessons to methods
6. **lesson_tasks** - Links lessons to tasks
7. **lesson_books** - Links lessons to books
8. **lesson_vocabulary** - Links lessons to vocabulary items

### Additional Tables
1. **public_links** - For sharing entities publicly with secure tokens

## Custom Types Created
- **course_status**: 'draft', 'published', 'archived'
- **lesson_status**: 'draft', 'scheduled', 'completed', 'cancelled'
- **difficulty_level**: 'beginner', 'intermediate', 'advanced', 'expert'
- **content_type**: 'text', 'video', 'audio', 'pdf', 'image', 'interactive'

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only view/edit their own data
- Public courses, books, and vocabulary groups are viewable by all
- Template objectives, methods, and tasks are viewable by all
- Proper cascading permissions for related data

### Indexes
Performance indexes created for:
- Foreign key relationships
- Frequently searched fields (user_id, status, tags)
- Full-text search on titles, descriptions, and content
- GIN indexes for array fields (tags)

## Database Functions Created

1. **generate_unique_slug(base_text, table_name)** - Generates unique public slugs
2. **calculate_course_progress(course_id, user_id)** - Calculates course completion percentage
3. **get_vocabulary_stats(user_id)** - Returns vocabulary statistics by difficulty and language
4. **clone_template(template_id, template_type, new_user_id)** - Clones template entities
5. **search_all_entities(search_query, user_id, entity_types[])** - Full-text search across all entities

## Views Created

1. **course_overview** - Provides course statistics including counts of books, vocabulary groups, and schedules
2. **upcoming_lessons** - Shows upcoming lessons with course information

## Triggers
- Automatic **updated_at** timestamp updates on all tables

## Key Features

### Multi-tenancy
- All data is isolated by user through RLS policies
- Users can only access their own data

### Public Sharing
- Courses, books, and vocabulary groups can be made public
- Public sharing links with optional expiration and password protection

### Templates
- Objectives, methods, and tasks can be marked as templates
- Templates are viewable by all users and can be cloned

### Flexible Relationships
- Many-to-many relationships allow maximum flexibility
- Lessons can use any combination of objectives, methods, tasks, books, and vocabulary
- Courses can include multiple books and vocabulary groups

### Search Capabilities
- Full-text search indexes on major entities
- Tag-based filtering
- Advanced search function across all entity types

### Metadata Support
- JSONB metadata fields on all major tables for extensibility
- Allows storing additional custom data without schema changes

## Next Steps

The database schema is now ready for use. Task 3 is complete. The next steps would be:
1. Create the UI components (Task 4)
2. Implement the course management module (Task 5)
3. Build the other management modules (Tasks 6-11)
