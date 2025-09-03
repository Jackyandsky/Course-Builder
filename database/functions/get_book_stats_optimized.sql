-- Optimized function to get book statistics
CREATE OR REPLACE FUNCTION get_book_stats_optimized()
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'text', COUNT(*) FILTER (WHERE content_type = 'text'),
        'pdf', COUNT(*) FILTER (WHERE content_type = 'pdf'),
        'video', COUNT(*) FILTER (WHERE content_type = 'video'),
        'audio', COUNT(*) FILTER (WHERE content_type = 'audio'),
        'image', COUNT(*) FILTER (WHERE content_type = 'image'),
        'interactive', COUNT(*) FILTER (WHERE content_type = 'interactive')
    )
    INTO result
    FROM books;
    
    RETURN result;
END;
$$;