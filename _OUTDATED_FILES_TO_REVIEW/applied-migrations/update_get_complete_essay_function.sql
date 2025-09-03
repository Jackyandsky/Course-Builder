-- Update get_complete_essay function to include word_count and created_at fields
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
    book_id UUID,
    book_title VARCHAR,
    book_author VARCHAR,
    difficulty_level VARCHAR,
    thesis_statement TEXT,
    is_published BOOLEAN,
    reference_count INTEGER,
    created_by UUID,
    metadata JSONB,
    word_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
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
            e.book_id,
            e.book_title,
            e.book_author,
            e.difficulty_level,
            e.thesis_statement,
            e.is_published,
            e.reference_count,
            e.created_by,
            e.metadata,
            e.word_count,
            e.created_at,
            e.updated_at
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
            c.book_id,
            c.book_title,
            c.book_author,
            c.difficulty_level,
            c.thesis_statement,
            c.is_published,
            c.reference_count,
            c.created_by,
            c.metadata,
            c.word_count,
            c.created_at,
            c.updated_at
        FROM essay_content c
        INNER JOIN essay_tree et ON c.parent_id = et.id
    )
    SELECT * FROM essay_tree
    ORDER BY level, position_order;
END;
$$ LANGUAGE plpgsql;