-- Migration: Create Essay Builder Tables
-- This creates a single-table hierarchical structure for essay content

-- Main essay content table (single table approach)
CREATE TABLE IF NOT EXISTS essay_content (
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
    
    -- Classification
    paragraph_type VARCHAR(20), -- 'introduction', 'body1', 'body2', 'body3', 'conclusion'
    sentence_function VARCHAR(30), -- 'hook', 'lead-in', 'thesis', etc.
    
    -- Book Reference
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    book_title VARCHAR(255), -- Denormalized for performance
    book_author VARCHAR(255), -- Denormalized for performance
    
    -- Metadata
    word_count INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    grade VARCHAR(5),
    version INTEGER DEFAULT 1,
    draft_type VARCHAR(10), -- 'draft1', 'draft2', 'final'
    
    -- Usage & Analytics
    reference_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_referenced TIMESTAMP WITH TIME ZONE,
    
    -- Rich Content (JSONB for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- Status & Visibility
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_essay_parent ON essay_content(parent_id, position_order);
CREATE INDEX IF NOT EXISTS idx_essay_content_type ON essay_content(content_type, content_level);
CREATE INDEX IF NOT EXISTS idx_essay_book ON essay_content(book_id);
CREATE INDEX IF NOT EXISTS idx_essay_paragraph_type ON essay_content(paragraph_type);
CREATE INDEX IF NOT EXISTS idx_essay_sentence_function ON essay_content(sentence_function);
CREATE INDEX IF NOT EXISTS idx_essay_published ON essay_content(is_published, is_featured);
CREATE INDEX IF NOT EXISTS idx_essay_reference_count ON essay_content(reference_count DESC);
CREATE INDEX IF NOT EXISTS idx_essay_metadata_gin ON essay_content USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_essay_content_fts ON essay_content USING GIN (to_tsvector('english', content_text));

-- Category tables for fixed values
CREATE TABLE IF NOT EXISTS paragraph_types (
    code VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER,
    sentence_count INTEGER DEFAULT 5
);

-- Insert paragraph types if not exists
INSERT INTO paragraph_types (code, display_name, description, display_order, sentence_count) 
VALUES
    ('introduction', 'Introduction', 'Opening paragraph with hook, context, and thesis', 1, 5),
    ('body1', 'Body Paragraph 1', 'First main argument', 2, 5),
    ('body2', 'Body Paragraph 2', 'Second main argument', 3, 5),
    ('body3', 'Body Paragraph 3', 'Third main argument', 4, 5),
    ('conclusion', 'Conclusion', 'Summary and closing thoughts', 5, 5)
ON CONFLICT (code) DO NOTHING;

-- Sentence functions table
CREATE TABLE IF NOT EXISTS sentence_functions (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    paragraph_type VARCHAR(20),
    position_hint INTEGER,
    description TEXT,
    starter_templates TEXT[]
);

-- Insert sentence functions if not exists
INSERT INTO sentence_functions (code, display_name, paragraph_type, position_hint, description, starter_templates) 
VALUES
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
    ('resonance', 'Resonance', 'conclusion', 5, 'Lasting impact', ARRAY['The work continues...', 'Ultimately, the legacy...'])
ON CONFLICT (code) DO NOTHING;

-- Vocabulary categories
CREATE TABLE IF NOT EXISTS vocabulary_categories (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description TEXT
);

INSERT INTO vocabulary_categories (code, display_name, description) 
VALUES
    ('analysis', 'Analysis', 'Words for literary analysis'),
    ('social', 'Social Critique', 'Words for social commentary'),
    ('literary', 'Literary', 'Literary and artistic terms'),
    ('philosophical', 'Philosophical', 'Philosophical concepts'),
    ('historical', 'Historical', 'Historical terminology'),
    ('scientific', 'Scientific', 'Scientific vocabulary'),
    ('transitional', 'Transitional', 'Transition words and phrases')
ON CONFLICT (code) DO NOTHING;

-- Helper view for complete essays
CREATE OR REPLACE VIEW v_essays AS
SELECT 
    e.id,
    e.content_text as title,
    e.thesis_statement,
    e.book_id,
    e.book_title,
    e.book_author,
    e.difficulty_level,
    e.grade,
    e.word_count,
    e.reference_count,
    e.metadata,
    e.is_published,
    e.is_featured,
    e.created_by,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM essay_content p WHERE p.parent_id = e.id AND p.content_type = 'paragraph') as paragraph_count,
    (SELECT COUNT(*) FROM essay_content s 
     WHERE s.parent_id IN (SELECT id FROM essay_content WHERE parent_id = e.id) 
     AND s.content_type = 'sentence') as sentence_count
FROM essay_content e
WHERE e.content_type = 'essay';

-- Function to get complete essay structure
CREATE OR REPLACE FUNCTION get_complete_essay(essay_id UUID)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
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
    SELECT * FROM essay_tree
    ORDER BY level, position_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update word counts automatically
CREATE OR REPLACE FUNCTION update_essay_word_counts()
RETURNS TRIGGER AS $$
DECLARE
    parent_paragraph_id UUID;
    parent_essay_id UUID;
BEGIN
    -- Update word count for the current item
    IF NEW.content_text IS NOT NULL THEN
        NEW.word_count := array_length(string_to_array(NEW.content_text, ' '), 1);
    END IF;
    
    -- If this is a sentence, update parent paragraph word count
    IF NEW.content_type = 'sentence' AND NEW.parent_id IS NOT NULL THEN
        -- Get parent paragraph id
        parent_paragraph_id := NEW.parent_id;
        
        -- Update paragraph word count
        UPDATE essay_content
        SET word_count = (
            SELECT COALESCE(SUM(word_count), 0)
            FROM essay_content
            WHERE parent_id = parent_paragraph_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = parent_paragraph_id;
        
        -- Get parent essay id
        SELECT parent_id INTO parent_essay_id
        FROM essay_content
        WHERE id = parent_paragraph_id;
        
        -- Update essay total word count
        IF parent_essay_id IS NOT NULL THEN
            UPDATE essay_content
            SET word_count = (
                SELECT COALESCE(SUM(word_count), 0)
                FROM essay_content
                WHERE parent_id = parent_essay_id AND content_type = 'paragraph'
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = parent_essay_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_essay_word_counts
BEFORE INSERT OR UPDATE OF content_text ON essay_content
FOR EACH ROW EXECUTE FUNCTION update_essay_word_counts();

-- Function to validate essay structure (5 paragraphs, 5 sentences each)
CREATE OR REPLACE FUNCTION validate_essay_structure()
RETURNS TRIGGER AS $$
DECLARE
    paragraph_count INTEGER;
    sentence_count INTEGER;
    parent_type VARCHAR(20);
BEGIN
    -- Get parent type
    IF NEW.parent_id IS NOT NULL THEN
        SELECT content_type INTO parent_type
        FROM essay_content
        WHERE id = NEW.parent_id;
    END IF;
    
    -- Check paragraph count if adding to essay
    IF NEW.content_type = 'paragraph' AND parent_type = 'essay' THEN
        SELECT COUNT(*) INTO paragraph_count
        FROM essay_content
        WHERE parent_id = NEW.parent_id AND content_type = 'paragraph' AND id != COALESCE(NEW.id, gen_random_uuid());
        
        IF paragraph_count >= 5 THEN
            RAISE EXCEPTION 'Essay cannot have more than 5 paragraphs';
        END IF;
    END IF;
    
    -- Check sentence count if adding to paragraph
    IF NEW.content_type = 'sentence' AND parent_type = 'paragraph' THEN
        SELECT COUNT(*) INTO sentence_count
        FROM essay_content
        WHERE parent_id = NEW.parent_id AND content_type = 'sentence' AND id != COALESCE(NEW.id, gen_random_uuid());
        
        IF sentence_count >= 5 THEN
            RAISE EXCEPTION 'Paragraph cannot have more than 5 sentences';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_essay_structure
BEFORE INSERT OR UPDATE ON essay_content
FOR EACH ROW EXECUTE FUNCTION validate_essay_structure();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_essay_content_updated_at 
BEFORE UPDATE ON essay_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON essay_content TO authenticated;
GRANT ALL ON paragraph_types TO authenticated;
GRANT ALL ON sentence_functions TO authenticated;
GRANT ALL ON vocabulary_categories TO authenticated;
GRANT ALL ON v_essays TO authenticated;

-- RLS Policies
ALTER TABLE essay_content ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read published essays
CREATE POLICY "Allow read published essays" ON essay_content
    FOR SELECT
    USING (is_published = true OR auth.uid() = created_by);

-- Allow users to manage their own essays
CREATE POLICY "Allow users to manage own essays" ON essay_content
    FOR ALL
    USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Allow admins full access
CREATE POLICY "Allow admins full access" ON essay_content
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));