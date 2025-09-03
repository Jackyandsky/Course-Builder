-- Update word_count for existing essays where it's NULL or 0
UPDATE essay_content AS e
SET word_count = (
    SELECT SUM(
        array_length(
            string_to_array(trim(s.content_text), ' '), 
            1
        )
    )
    FROM essay_content s
    WHERE s.content_type = 'sentence'
    AND s.parent_id IN (
        SELECT p.id 
        FROM essay_content p 
        WHERE p.content_type = 'paragraph' 
        AND p.parent_id = e.id
    )
    AND s.content_text IS NOT NULL 
    AND trim(s.content_text) != ''
)
WHERE e.content_type = 'essay'
AND (e.word_count IS NULL OR e.word_count = 0);