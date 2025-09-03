-- Database Schema for 5/5/5 Essay Examples System
-- Production-ready table structure for managing essay examples related to books

-- ============================================
-- CORE TABLES
-- ============================================

-- Books table (if not already exists in main system)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    genre VARCHAR(50),
    publication_year INTEGER,
    publisher VARCHAR(255),
    cover_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, author)
);

-- Essay examples main table
CREATE TABLE essay_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255),
    thesis_statement TEXT NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    total_word_count INTEGER,
    grade VARCHAR(5),
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES essay_examples(id), -- For draft versioning
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_book_id (book_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_published (is_published),
    INDEX idx_parent_version (parent_version_id)
);

-- Paragraphs table
CREATE TABLE essay_paragraphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_example_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    paragraph_type VARCHAR(20) NOT NULL CHECK (paragraph_type IN ('introduction', 'body1', 'body2', 'body3', 'conclusion')),
    paragraph_order INTEGER NOT NULL CHECK (paragraph_order BETWEEN 1 AND 5),
    focus_point TEXT,
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(essay_example_id, paragraph_type),
    UNIQUE(essay_example_id, paragraph_order),
    INDEX idx_essay_paragraph (essay_example_id, paragraph_order)
);

-- Sentences table
CREATE TABLE essay_sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paragraph_id UUID REFERENCES essay_paragraphs(id) ON DELETE CASCADE,
    sentence_order INTEGER NOT NULL CHECK (sentence_order BETWEEN 1 AND 5),
    sentence_text TEXT NOT NULL,
    sentence_function VARCHAR(30) NOT NULL CHECK (sentence_function IN (
        'hook', 'lead-in', 'thesis', 'elaboration', 'roadmap',
        'topic', 'evidence', 'interpretation', 'transition', 'implication',
        'restatement', 'summary', 'closing', 'universality', 'resonance'
    )),
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(paragraph_id, sentence_order),
    INDEX idx_paragraph_sentence (paragraph_id, sentence_order),
    INDEX idx_function (sentence_function)
);

-- ============================================
-- VOCABULARY & QUOTES TABLES
-- ============================================

-- Vocabulary bank table
CREATE TABLE vocabulary_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    difficulty_level VARCHAR(20),
    definition TEXT,
    example_usage TEXT,
    synonyms TEXT[], -- Array of synonyms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_word (word),
    INDEX idx_category (category)
);

-- Sentence vocabulary mapping
CREATE TABLE sentence_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sentence_id UUID REFERENCES essay_sentences(id) ON DELETE CASCADE,
    vocabulary_id UUID REFERENCES vocabulary_bank(id) ON DELETE CASCADE,
    position_in_sentence INTEGER, -- Word position in the sentence
    context_note TEXT,
    UNIQUE(sentence_id, vocabulary_id, position_in_sentence),
    INDEX idx_sentence_vocab (sentence_id),
    INDEX idx_vocab_usage (vocabulary_id)
);

-- Book quotes table
CREATE TABLE book_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    page_number INTEGER,
    chapter VARCHAR(100),
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_book_quotes (book_id)
);

-- Paragraph quotes mapping
CREATE TABLE paragraph_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paragraph_id UUID REFERENCES essay_paragraphs(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES book_quotes(id) ON DELETE CASCADE,
    usage_in_sentence INTEGER, -- Which sentence number uses this quote
    UNIQUE(paragraph_id, quote_id),
    INDEX idx_paragraph_quote (paragraph_id)
);

-- ============================================
-- LEARNING & ANALYTICS TABLES
-- ============================================

-- Writing techniques table
CREATE TABLE writing_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technique_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sentence techniques mapping
CREATE TABLE sentence_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sentence_id UUID REFERENCES essay_sentences(id) ON DELETE CASCADE,
    technique_id UUID REFERENCES writing_techniques(id) ON DELETE CASCADE,
    notes TEXT,
    UNIQUE(sentence_id, technique_id),
    INDEX idx_sentence_technique (sentence_id)
);

-- Sentence templates/starters
CREATE TABLE sentence_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_type VARCHAR(30) NOT NULL,
    paragraph_type VARCHAR(20),
    template_text TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_function_template (function_type, paragraph_type)
);

-- User essay attempts (for learning)
CREATE TABLE user_essay_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    essay_example_id UUID REFERENCES essay_examples(id),
    book_id UUID REFERENCES books(id),
    attempt_data JSONB, -- Store the full attempt structure
    score DECIMAL(5,2),
    feedback JSONB,
    time_spent INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_attempts (user_id, created_at),
    INDEX idx_user_book_attempts (user_id, book_id)
);

-- User vocabulary progress
CREATE TABLE user_vocabulary_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID REFERENCES vocabulary_bank(id) ON DELETE CASCADE,
    times_used INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    mastery_level INTEGER DEFAULT 0, -- 0-100
    UNIQUE(user_id, vocabulary_id),
    INDEX idx_user_vocab (user_id, vocabulary_id)
);

-- ============================================
-- CATEGORIZATION & TAGS
-- ============================================

-- Essay tags table
CREATE TABLE essay_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Essay tags mapping
CREATE TABLE essay_example_tags (
    essay_example_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES essay_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (essay_example_id, tag_id),
    INDEX idx_essay_tags (essay_example_id)
);

-- Essay collections (curated sets)
CREATE TABLE essay_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    collection_type VARCHAR(50), -- 'by_author', 'by_genre', 'by_theme', 'custom'
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_collection_type (collection_type),
    INDEX idx_public_collections (is_public)
);

-- Essay collection items
CREATE TABLE essay_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES essay_collections(id) ON DELETE CASCADE,
    essay_example_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    order_position INTEGER,
    notes TEXT,
    UNIQUE(collection_id, essay_example_id),
    INDEX idx_collection_items (collection_id, order_position)
);

-- ============================================
-- REFINEMENT & FEEDBACK TABLES
-- ============================================

-- Essay refinement notes (for draft comparisons)
CREATE TABLE essay_refinements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_essay_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    refined_essay_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    refinement_type VARCHAR(50), -- 'vocabulary', 'structure', 'clarity', 'evidence'
    description TEXT,
    before_text TEXT,
    after_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_refinement_essays (original_essay_id, refined_essay_id)
);

-- User feedback on examples
CREATE TABLE essay_example_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_example_id UUID REFERENCES essay_examples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    helpful_for VARCHAR(100)[], -- Array: ['structure', 'vocabulary', 'argumentation']
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(essay_example_id, user_id),
    INDEX idx_essay_feedback (essay_example_id)
);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Complete essay view with all components
CREATE VIEW v_complete_essays AS
SELECT 
    e.id,
    e.title,
    e.thesis_statement,
    e.difficulty_level,
    e.grade,
    b.title as book_title,
    b.author as book_author,
    b.genre as book_genre,
    COUNT(DISTINCT p.id) as paragraph_count,
    COUNT(DISTINCT s.id) as sentence_count,
    e.total_word_count,
    e.created_at
FROM essay_examples e
LEFT JOIN books b ON e.book_id = b.id
LEFT JOIN essay_paragraphs p ON e.id = p.essay_example_id
LEFT JOIN essay_sentences s ON p.id = s.paragraph_id
WHERE e.is_published = true
GROUP BY e.id, b.id;

-- Vocabulary usage statistics view
CREATE VIEW v_vocabulary_usage AS
SELECT 
    v.word,
    v.category,
    v.difficulty_level,
    COUNT(DISTINCT sv.sentence_id) as usage_count,
    COUNT(DISTINCT e.id) as essay_count
FROM vocabulary_bank v
LEFT JOIN sentence_vocabulary sv ON v.id = sv.vocabulary_id
LEFT JOIN essay_sentences s ON sv.sentence_id = s.id
LEFT JOIN essay_paragraphs p ON s.paragraph_id = p.id
LEFT JOIN essay_examples e ON p.essay_example_id = e.id
GROUP BY v.id;

-- User progress view
CREATE VIEW v_user_essay_progress AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT uea.essay_example_id) as essays_attempted,
    COUNT(DISTINCT uea.book_id) as books_covered,
    AVG(uea.score) as average_score,
    SUM(uea.time_spent) as total_time_spent,
    COUNT(DISTINCT uvp.vocabulary_id) as vocabulary_learned
FROM users u
LEFT JOIN user_essay_attempts uea ON u.id = uea.user_id
LEFT JOIN user_vocabulary_progress uvp ON u.id = uvp.user_id AND uvp.mastery_level > 50
GROUP BY u.id;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Full text search indexes
CREATE INDEX idx_essay_title_fts ON essay_examples USING GIN (to_tsvector('english', title));
CREATE INDEX idx_thesis_fts ON essay_examples USING GIN (to_tsvector('english', thesis_statement));
CREATE INDEX idx_sentence_text_fts ON essay_sentences USING GIN (to_tsvector('english', sentence_text));
CREATE INDEX idx_book_title_author_fts ON books USING GIN (to_tsvector('english', title || ' ' || author));

-- Performance indexes
CREATE INDEX idx_essay_book_published ON essay_examples(book_id, is_published);
CREATE INDEX idx_paragraph_essay_type ON essay_paragraphs(essay_example_id, paragraph_type);
CREATE INDEX idx_user_attempts_recent ON user_essay_attempts(user_id, created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update word counts
CREATE OR REPLACE FUNCTION update_word_counts() RETURNS TRIGGER AS $$
BEGIN
    -- Update sentence word count
    NEW.word_count := array_length(string_to_array(NEW.sentence_text, ' '), 1);
    
    -- Update paragraph word count
    UPDATE essay_paragraphs 
    SET word_count = (
        SELECT SUM(word_count) 
        FROM essay_sentences 
        WHERE paragraph_id = NEW.paragraph_id
    )
    WHERE id = NEW.paragraph_id;
    
    -- Update essay total word count
    UPDATE essay_examples 
    SET total_word_count = (
        SELECT SUM(p.word_count) 
        FROM essay_paragraphs p 
        WHERE p.essay_example_id = (
            SELECT essay_example_id 
            FROM essay_paragraphs 
            WHERE id = NEW.paragraph_id
        )
    )
    WHERE id = (
        SELECT essay_example_id 
        FROM essay_paragraphs 
        WHERE id = NEW.paragraph_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_word_counts
AFTER INSERT OR UPDATE ON essay_sentences
FOR EACH ROW EXECUTE FUNCTION update_word_counts();

-- Function to validate essay structure (5 paragraphs, 5 sentences each)
CREATE OR REPLACE FUNCTION validate_essay_structure() RETURNS TRIGGER AS $$
DECLARE
    paragraph_count INTEGER;
    sentence_count INTEGER;
BEGIN
    -- Check paragraph count
    SELECT COUNT(*) INTO paragraph_count
    FROM essay_paragraphs
    WHERE essay_example_id = NEW.essay_example_id;
    
    IF paragraph_count > 5 THEN
        RAISE EXCEPTION 'Essay cannot have more than 5 paragraphs';
    END IF;
    
    -- Check sentence count for this paragraph
    SELECT COUNT(*) INTO sentence_count
    FROM essay_sentences
    WHERE paragraph_id = NEW.paragraph_id;
    
    IF sentence_count > 5 THEN
        RAISE EXCEPTION 'Paragraph cannot have more than 5 sentences';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_structure
BEFORE INSERT ON essay_sentences
FOR EACH ROW EXECUTE FUNCTION validate_essay_structure();

-- Function to track vocabulary usage
CREATE OR REPLACE FUNCTION track_vocabulary_usage() RETURNS TRIGGER AS $$
BEGIN
    UPDATE vocabulary_bank
    SET usage_count = usage_count + 1
    WHERE id = NEW.vocabulary_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_vocabulary
AFTER INSERT ON sentence_vocabulary
FOR EACH ROW EXECUTE FUNCTION track_vocabulary_usage();

-- ============================================
-- SAMPLE QUERIES FOR COMMON USE CASES
-- ============================================

/*
-- 1. Get complete essay with all paragraphs and sentences
SELECT 
    e.*,
    p.paragraph_type,
    p.paragraph_order,
    s.sentence_order,
    s.sentence_text,
    s.sentence_function
FROM essay_examples e
JOIN essay_paragraphs p ON e.id = p.essay_example_id
JOIN essay_sentences s ON p.id = s.paragraph_id
WHERE e.id = ?
ORDER BY p.paragraph_order, s.sentence_order;

-- 2. Find essays by book
SELECT * FROM essay_examples
WHERE book_id = ? AND is_published = true
ORDER BY created_at DESC;

-- 3. Get vocabulary used in advanced essays
SELECT DISTINCT v.*
FROM vocabulary_bank v
JOIN sentence_vocabulary sv ON v.id = sv.vocabulary_id
JOIN essay_sentences s ON sv.sentence_id = s.id
JOIN essay_paragraphs p ON s.paragraph_id = p.id
JOIN essay_examples e ON p.essay_example_id = e.id
WHERE e.difficulty_level = 'advanced';

-- 4. User progress on specific book
SELECT 
    uea.*,
    e.title as essay_title,
    e.difficulty_level
FROM user_essay_attempts uea
JOIN essay_examples e ON uea.essay_example_id = e.id
WHERE uea.user_id = ? AND uea.book_id = ?
ORDER BY uea.created_at DESC;

-- 5. Get sentence examples by function
SELECT 
    s.sentence_text,
    s.sentence_function,
    p.paragraph_type,
    e.difficulty_level,
    b.title as book_title
FROM essay_sentences s
JOIN essay_paragraphs p ON s.paragraph_id = p.id
JOIN essay_examples e ON p.essay_example_id = e.id
JOIN books b ON e.book_id = b.id
WHERE s.sentence_function = ?
AND e.is_published = true;
*/