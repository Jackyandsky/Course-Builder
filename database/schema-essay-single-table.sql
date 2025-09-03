-- Simplified Single-Table Design for Essay Examples
-- Using hierarchical structure with single content table

-- ============================================
-- MAIN CONTENT TABLE (Single Table Approach)
-- ============================================

CREATE TABLE essay_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Hierarchical Structure
    parent_id UUID REFERENCES essay_content(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('essay', 'paragraph', 'sentence')),
    content_level INTEGER NOT NULL, -- 1=essay, 2=paragraph, 3=sentence
    
    -- Position & Organization
    position_order INTEGER, -- Order within parent (1-5 for both paragraphs and sentences)
    
    -- Content
    content_text TEXT, -- The actual text content
    thesis_statement TEXT, -- Only for essay level
    
    -- Classification (using codes instead of multiple tables)
    paragraph_type VARCHAR(20), -- 'introduction', 'body1', 'body2', 'body3', 'conclusion'
    sentence_function VARCHAR(30), -- 'hook', 'lead-in', 'thesis', etc.
    
    -- Book Reference
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    book_title VARCHAR(255), -- Denormalized for performance
    book_author VARCHAR(255), -- Denormalized for performance
    
    -- Metadata
    word_count INTEGER,
    difficulty_level VARCHAR(20),
    grade VARCHAR(5),
    version INTEGER DEFAULT 1,
    draft_type VARCHAR(10), -- 'draft1', 'draft2', 'final'
    
    -- Usage & Analytics
    reference_count INTEGER DEFAULT 0, -- How many times this has been referenced
    usage_count INTEGER DEFAULT 0, -- How many times used in practice
    last_referenced TIMESTAMP WITH TIME ZONE,
    
    -- Rich Content (JSONB for flexibility)
    metadata JSONB DEFAULT '{}', -- Flexible storage for additional data
    /*
    Example metadata structure:
    {
        "vocabulary": ["indubitable", "oligarchy", "purview"],
        "techniques": ["parallel structure", "metaphor"],
        "quotes": [{"text": "...", "page": 123}],
        "notes": "Teacher notes here",
        "tags": ["racial justice", "memoir"],
        "focus_point": "Main argument about...",
        "refinements": ["improved word choice", "better transition"]
    }
    */
    
    -- Status & Visibility
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false, -- If this is a template/starter
    
    -- Audit Fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_parent (parent_id, position_order),
    INDEX idx_content_type (content_type, content_level),
    INDEX idx_book (book_id),
    INDEX idx_paragraph_type (paragraph_type),
    INDEX idx_sentence_function (sentence_function),
    INDEX idx_published (is_published, is_featured),
    INDEX idx_reference_count (reference_count DESC),
    INDEX idx_metadata_gin (metadata) USING GIN,
    INDEX idx_content_fts USING GIN (to_tsvector('english', content_text))
);

-- ============================================
-- CATEGORY/LOOKUP TABLES (Fixed Values)
-- ============================================

-- Fixed paragraph types
CREATE TABLE paragraph_types (
    code VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER,
    sentence_count INTEGER DEFAULT 5
);

INSERT INTO paragraph_types (code, display_name, description, display_order) VALUES
('introduction', 'Introduction', 'Opening paragraph with hook, context, and thesis', 1),
('body1', 'Body Paragraph 1', 'First main argument', 2),
('body2', 'Body Paragraph 2', 'Second main argument', 3),
('body3', 'Body Paragraph 3', 'Third main argument', 4),
('conclusion', 'Conclusion', 'Summary and closing thoughts', 5);

-- Fixed sentence functions
CREATE TABLE sentence_functions (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    paragraph_type VARCHAR(20) REFERENCES paragraph_types(code),
    position_hint INTEGER, -- Suggested position in paragraph
    description TEXT,
    starter_templates TEXT[] -- Array of sentence starters
);

INSERT INTO sentence_functions (code, display_name, paragraph_type, position_hint, description, starter_templates) VALUES
-- Introduction functions
('hook', 'Hook', 'introduction', 1, 'Eye-catching opening', ARRAY['In [Author]''s [work]...', 'The essence of...']),
('lead-in', 'Lead-in', 'introduction', 2, 'Context bridge', ARRAY['Throughout the book...', 'The author makes clear...']),
('thesis', 'Thesis', 'introduction', 3, 'Main argument', ARRAY['This work demonstrates...', 'The novel reveals...']),
('elaboration', 'Elaboration', 'introduction', 4, 'Complexity layer', ARRAY['The author presents...', 'Within this framework...']),
('roadmap', 'Roadmap', 'introduction', 5, 'Three-part preview', ARRAY['First...; second...; finally...', 'The essay will explore...']),

-- Body paragraph functions
('topic', 'Topic Sentence', NULL, 1, 'Paragraph main point', ARRAY['The first aspect...', 'Central to...']),
('evidence', 'Evidence/Quote', NULL, 2, 'Supporting evidence', ARRAY['As stated in the text...', 'The author argues...']),
('interpretation', 'Interpretation', NULL, 3, 'Analysis of evidence', ARRAY['This demonstrates...', 'The significance of...']),
('transition', 'Transition', NULL, 4, 'Connection to next', ARRAY['Furthermore...', 'However...']),
('implication', 'Implication', NULL, 5, 'Deeper significance', ARRAY['Ultimately...', 'This reveals...']),

-- Conclusion functions
('restatement', 'Restatement', 'conclusion', 1, 'Thesis revisited', ARRAY['The work provides...', 'In summary...']),
('summary', 'Summary', 'conclusion', 2, 'Key points synthesis', ARRAY['Through examination of...', 'The analysis shows...']),
('closing', 'Closing Thought', 'conclusion', 3, 'Initial impact', ARRAY['The author effectively...', 'One cannot ignore...']),
('universality', 'Universality', 'conclusion', 4, 'Broader scope', ARRAY['Beyond the immediate...', 'In the larger context...']),
('resonance', 'Resonance', 'conclusion', 5, 'Lasting impact', ARRAY['The work continues...', 'Ultimately, the legacy...']);

-- Difficulty levels
CREATE TABLE difficulty_levels (
    code VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    min_vocabulary_count INTEGER,
    min_word_count INTEGER,
    description TEXT
);

INSERT INTO difficulty_levels (code, display_name, min_vocabulary_count, min_word_count, description) VALUES
('beginner', 'Beginner', 5, 300, 'Basic structure with simple vocabulary'),
('intermediate', 'Intermediate', 10, 400, 'Good structure with some sophisticated vocabulary'),
('advanced', 'Advanced', 15, 500, 'Complex structure with extensive sophisticated vocabulary');

-- Book genres (fixed categories)
CREATE TABLE book_genres (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description TEXT
);

INSERT INTO book_genres (code, display_name, description) VALUES
('fiction', 'Fiction', 'Novels and fictional works'),
('non-fiction', 'Non-Fiction', 'Factual and informational works'),
('memoir', 'Memoir', 'Personal narratives and life stories'),
('biography', 'Biography', 'Life stories of others'),
('classic', 'Classic Literature', 'Timeless literary works'),
('contemporary', 'Contemporary', 'Modern literature'),
('historical', 'Historical', 'Historical fiction or non-fiction'),
('science', 'Science', 'Scientific works and explorations');

-- Vocabulary categories
CREATE TABLE vocabulary_categories (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description TEXT
);

INSERT INTO vocabulary_categories (code, display_name, description) VALUES
('analysis', 'Analysis', 'Words for literary analysis'),
('social', 'Social Critique', 'Words for social commentary'),
('literary', 'Literary', 'Literary and artistic terms'),
('philosophical', 'Philosophical', 'Philosophical concepts'),
('historical', 'Historical', 'Historical terminology'),
('scientific', 'Scientific', 'Scientific vocabulary'),
('transitional', 'Transitional', 'Transition words and phrases');

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Complete essay view
CREATE VIEW v_essays AS
SELECT 
    e.id,
    e.content_text as title,
    e.thesis_statement,
    e.book_title,
    e.book_author,
    e.difficulty_level,
    e.grade,
    e.word_count,
    e.reference_count,
    e.metadata->>'tags' as tags,
    e.created_at
FROM essay_content e
WHERE e.content_type = 'essay' 
  AND e.is_published = true;

-- Paragraph with sentences view
CREATE VIEW v_paragraphs_with_sentences AS
SELECT 
    p.id as paragraph_id,
    p.parent_id as essay_id,
    p.paragraph_type,
    p.position_order as paragraph_order,
    s.id as sentence_id,
    s.position_order as sentence_order,
    s.sentence_function,
    s.content_text as sentence_text,
    s.metadata->>'vocabulary' as vocabulary_used
FROM essay_content p
LEFT JOIN essay_content s ON s.parent_id = p.id AND s.content_type = 'sentence'
WHERE p.content_type = 'paragraph'
ORDER BY p.position_order, s.position_order;

-- Most referenced content
CREATE VIEW v_popular_content AS
SELECT 
    id,
    content_type,
    content_text,
    paragraph_type,
    sentence_function,
    reference_count,
    usage_count,
    book_title,
    metadata
FROM essay_content
WHERE reference_count > 0
ORDER BY reference_count DESC, usage_count DESC;

-- ============================================
-- FUNCTIONS FOR WORKING WITH SINGLE TABLE
-- ============================================

-- Function to get complete essay structure
CREATE OR REPLACE FUNCTION get_complete_essay(essay_id UUID)
RETURNS TABLE (
    level INTEGER,
    content_type VARCHAR,
    position_order INTEGER,
    paragraph_type VARCHAR,
    sentence_function VARCHAR,
    content_text TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE essay_tree AS (
        -- Get the essay
        SELECT 
            e.id,
            e.parent_id,
            e.content_level as level,
            e.content_type,
            e.position_order,
            e.paragraph_type,
            e.sentence_function,
            e.content_text,
            e.metadata
        FROM essay_content e
        WHERE e.id = essay_id
        
        UNION ALL
        
        -- Get all children recursively
        SELECT 
            c.id,
            c.parent_id,
            c.content_level as level,
            c.content_type,
            c.position_order,
            c.paragraph_type,
            c.sentence_function,
            c.content_text,
            c.metadata
        FROM essay_content c
        INNER JOIN essay_tree et ON c.parent_id = et.id
    )
    SELECT 
        level,
        content_type,
        position_order,
        paragraph_type,
        sentence_function,
        content_text,
        metadata
    FROM essay_tree
    ORDER BY level, position_order;
END;
$$ LANGUAGE plpgsql;

-- Function to increment reference count
CREATE OR REPLACE FUNCTION increment_reference_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE essay_content
    SET 
        reference_count = reference_count + 1,
        last_referenced = CURRENT_TIMESTAMP
    WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to copy essay as template
CREATE OR REPLACE FUNCTION create_essay_from_template(template_id UUID, user_id UUID)
RETURNS UUID AS $$
DECLARE
    new_essay_id UUID;
BEGIN
    -- Copy the essay and all its children
    WITH RECURSIVE template_tree AS (
        -- Get the template essay
        SELECT * FROM essay_content WHERE id = template_id
        
        UNION ALL
        
        -- Get all children
        SELECT c.*
        FROM essay_content c
        INNER JOIN template_tree t ON c.parent_id = t.id
    ),
    -- Create mapping of old IDs to new IDs
    id_mapping AS (
        SELECT 
            id as old_id,
            gen_random_uuid() as new_id
        FROM template_tree
    )
    -- Insert all records with new IDs
    INSERT INTO essay_content (
        id, parent_id, content_type, content_level, position_order,
        content_text, thesis_statement, paragraph_type, sentence_function,
        book_id, book_title, book_author, word_count, difficulty_level,
        metadata, is_published, created_by
    )
    SELECT 
        m.new_id as id,
        CASE 
            WHEN t.parent_id IS NULL THEN NULL
            ELSE (SELECT new_id FROM id_mapping WHERE old_id = t.parent_id)
        END as parent_id,
        t.content_type,
        t.content_level,
        t.position_order,
        t.content_text,
        t.thesis_statement,
        t.paragraph_type,
        t.sentence_function,
        t.book_id,
        t.book_title,
        t.book_author,
        t.word_count,
        t.difficulty_level,
        t.metadata,
        false as is_published, -- New copy is unpublished
        user_id as created_by
    FROM template_tree t
    JOIN id_mapping m ON t.id = m.old_id
    RETURNING id INTO new_essay_id;
    
    -- Increment reference count on template
    PERFORM increment_reference_count(template_id);
    
    RETURN new_essay_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update word count
CREATE OR REPLACE FUNCTION update_content_word_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content_text IS NOT NULL THEN
        NEW.word_count := array_length(string_to_array(NEW.content_text, ' '), 1);
    END IF;
    
    -- If this is a sentence, update parent paragraph word count
    IF NEW.content_type = 'sentence' AND NEW.parent_id IS NOT NULL THEN
        UPDATE essay_content
        SET word_count = (
            SELECT SUM(word_count)
            FROM essay_content
            WHERE parent_id = NEW.parent_id
        )
        WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_word_count
BEFORE INSERT OR UPDATE OF content_text ON essay_content
FOR EACH ROW EXECUTE FUNCTION update_content_word_count();

-- ============================================
-- SAMPLE QUERIES
-- ============================================

/*
-- 1. Get complete essay with hierarchy
SELECT * FROM get_complete_essay('essay-uuid-here');

-- 2. Find all essays for a book
SELECT * FROM essay_content
WHERE content_type = 'essay' 
  AND book_id = 'book-uuid'
  AND is_published = true;

-- 3. Get most used sentence templates
SELECT 
    sentence_function,
    content_text,
    reference_count,
    metadata->>'vocabulary' as vocabulary
FROM essay_content
WHERE content_type = 'sentence'
  AND is_template = true
ORDER BY reference_count DESC
LIMIT 10;

-- 4. Search essays by vocabulary
SELECT DISTINCT
    e.id,
    e.content_text as title,
    e.book_title
FROM essay_content e
WHERE e.content_type = 'essay'
  AND EXISTS (
    SELECT 1 FROM essay_content s
    WHERE s.content_type = 'sentence'
      AND s.parent_id IN (
        SELECT id FROM essay_content 
        WHERE parent_id = e.id AND content_type = 'paragraph'
      )
      AND s.metadata->'vocabulary' ? 'indubitable'
  );

-- 5. Get paragraph examples by type
SELECT 
    p.id,
    p.paragraph_type,
    p.book_title,
    array_agg(s.content_text ORDER BY s.position_order) as sentences
FROM essay_content p
JOIN essay_content s ON s.parent_id = p.id
WHERE p.content_type = 'paragraph'
  AND p.paragraph_type = 'introduction'
  AND s.content_type = 'sentence'
GROUP BY p.id, p.paragraph_type, p.book_title;
*/