-- Course Builder Database Functions and Views
-- Useful helper functions and views for the application

-- Function to generate a unique public slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 0;
    exists_check BOOLEAN;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
    slug := trim(both '-' from slug);
    
    -- Check if slug exists
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE public_slug = $1)', table_name)
    INTO exists_check
    USING slug;
    
    -- If exists, append counter until unique
    WHILE exists_check LOOP
        counter := counter + 1;
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE public_slug = $1)', table_name)
        INTO exists_check
        USING slug || '-' || counter;
    END LOOP;
    
    IF counter > 0 THEN
        slug := slug || '-' || counter;
    END IF;
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(course_id_param UUID, user_id_param UUID)
RETURNS TABLE (
    total_lessons INTEGER,
    completed_lessons INTEGER,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_lessons,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::INTEGER as completed_lessons,
        ROUND(
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
                ELSE 0
            END, 2
        ) as progress_percentage
    FROM schedules s
    JOIN lessons l ON l.schedule_id = s.id
    WHERE s.course_id = course_id_param
    AND s.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- View for course overview with statistics
CREATE VIEW course_overview AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.status,
    c.difficulty,
    c.user_id,
    c.created_at,
    c.updated_at,
    c.published_at,
    COUNT(DISTINCT cb.book_id) as book_count,
    COUNT(DISTINCT cvg.vocabulary_group_id) as vocabulary_group_count,
    COUNT(DISTINCT s.id) as schedule_count,
    CASE 
        WHEN c.is_public = true THEN c.public_slug 
        ELSE NULL 
    END as public_slug
FROM courses c
LEFT JOIN course_books cb ON cb.course_id = c.id
LEFT JOIN course_vocabulary_groups cvg ON cvg.course_id = c.id
LEFT JOIN schedules s ON s.course_id = c.id
GROUP BY c.id;

-- View for upcoming lessons
CREATE VIEW upcoming_lessons AS
SELECT 
    l.*,
    s.name as schedule_name,
    s.course_id,
    c.title as course_title,
    s.user_id
FROM lessons l
JOIN schedules s ON s.id = l.schedule_id
LEFT JOIN courses c ON c.id = s.course_id
WHERE l.date >= CURRENT_DATE
AND l.status IN ('draft', 'scheduled')
ORDER BY l.date, l.start_time;

-- Function to get vocabulary statistics
CREATE OR REPLACE FUNCTION get_vocabulary_stats(user_id_param UUID)
RETURNS TABLE (
    total_words INTEGER,
    total_groups INTEGER,
    words_by_difficulty JSONB,
    words_by_language JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT v.id)::INTEGER as total_words,
        COUNT(DISTINCT vg.id)::INTEGER as total_groups,
        jsonb_build_object(
            'beginner', COUNT(DISTINCT CASE WHEN v.difficulty = 'beginner' THEN v.id END),
            'intermediate', COUNT(DISTINCT CASE WHEN v.difficulty = 'intermediate' THEN v.id END),
            'advanced', COUNT(DISTINCT CASE WHEN v.difficulty = 'advanced' THEN v.id END),
            'expert', COUNT(DISTINCT CASE WHEN v.difficulty = 'expert' THEN v.id END)
        ) as words_by_difficulty,
        jsonb_object_agg(
            COALESCE(vg.language, 'unknown'),
            word_count
        ) as words_by_language
    FROM vocabulary v
    LEFT JOIN vocabulary_group_items vgi ON vgi.vocabulary_id = v.id
    LEFT JOIN vocabulary_groups vg ON vg.id = vgi.vocabulary_group_id
    LEFT JOIN (
        SELECT vg.language, COUNT(DISTINCT vgi.vocabulary_id) as word_count
        FROM vocabulary_groups vg
        JOIN vocabulary_group_items vgi ON vgi.vocabulary_group_id = vg.id
        WHERE vg.user_id = user_id_param
        GROUP BY vg.language
    ) lang_stats ON true
    WHERE v.user_id = user_id_param
    GROUP BY lang_stats.words_by_language;
END;
$$ LANGUAGE plpgsql;

-- Function to clone a template (objectives, methods, or tasks)
CREATE OR REPLACE FUNCTION clone_template(
    template_id UUID,
    template_type TEXT,
    new_user_id UUID
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    CASE template_type
        WHEN 'objective' THEN
            INSERT INTO objectives (title, description, category_id, bloom_level, measurable, tags, is_template, user_id, metadata)
            SELECT title, description, category_id, bloom_level, measurable, tags, false, new_user_id, metadata
            FROM objectives
            WHERE id = template_id AND is_template = true
            RETURNING id INTO new_id;
            
        WHEN 'method' THEN
            INSERT INTO methods (name, description, category_id, instructions, duration_minutes, group_size_min, group_size_max, materials_needed, tags, is_template, user_id, metadata)
            SELECT name, description, category_id, instructions, duration_minutes, group_size_min, group_size_max, materials_needed, tags, false, new_user_id, metadata
            FROM methods
            WHERE id = template_id AND is_template = true
            RETURNING id INTO new_id;
            
        WHEN 'task' THEN
            INSERT INTO tasks (title, description, category_id, instructions, duration_minutes, difficulty, materials_needed, assessment_criteria, tags, is_template, user_id, metadata)
            SELECT title, description, category_id, instructions, duration_minutes, difficulty, materials_needed, assessment_criteria, tags, false, new_user_id, metadata
            FROM tasks
            WHERE id = template_id AND is_template = true
            RETURNING id INTO new_id;
            
        ELSE
            RAISE EXCEPTION 'Invalid template type: %', template_type;
    END CASE;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search across multiple entities
CREATE OR REPLACE FUNCTION search_all_entities(
    search_query TEXT,
    user_id_param UUID,
    entity_types TEXT[] DEFAULT ARRAY['course', 'book', 'vocabulary', 'objective', 'method', 'task']
) RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    title TEXT,
    description TEXT,
    match_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        -- Search courses
        SELECT 
            'course'::TEXT as entity_type,
            c.id as entity_id,
            c.title::TEXT,
            c.description::TEXT,
            ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', search_query)) as match_rank
        FROM courses c
        WHERE c.user_id = user_id_param
        AND 'course' = ANY(entity_types)
        AND to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', search_query)
        
        UNION ALL
        
        -- Search books
        SELECT 
            'book'::TEXT,
            b.id,
            b.title::TEXT,
            b.description::TEXT,
            ts_rank(to_tsvector('english', b.title || ' ' || COALESCE(b.author, '') || ' ' || COALESCE(b.description, '')), plainto_tsquery('english', search_query))
        FROM books b
        WHERE b.user_id = user_id_param
        AND 'book' = ANY(entity_types)
        AND to_tsvector('english', b.title || ' ' || COALESCE(b.author, '') || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('english', search_query)
        
        UNION ALL
        
        -- Search vocabulary
        SELECT 
            'vocabulary'::TEXT,
            v.id,
            v.word::TEXT,
            v.definition::TEXT,
            ts_rank(to_tsvector('english', v.word || ' ' || COALESCE(v.translation, '') || ' ' || COALESCE(v.definition, '')), plainto_tsquery('english', search_query))
        FROM vocabulary v
        WHERE v.user_id = user_id_param
        AND 'vocabulary' = ANY(entity_types)
        AND to_tsvector('english', v.word || ' ' || COALESCE(v.translation, '') || ' ' || COALESCE(v.definition, '')) @@ plainto_tsquery('english', search_query)
        
        UNION ALL
        
        -- Search objectives
        SELECT 
            'objective'::TEXT,
            o.id,
            o.title::TEXT,
            o.description::TEXT,
            ts_rank(to_tsvector('english', o.title || ' ' || COALESCE(o.description, '')), plainto_tsquery('english', search_query))
        FROM objectives o
        WHERE (o.user_id = user_id_param OR o.is_template = true)
        AND 'objective' = ANY(entity_types)
        AND to_tsvector('english', o.title || ' ' || COALESCE(o.description, '')) @@ plainto_tsquery('english', search_query)
        
        UNION ALL
        
        -- Search methods
        SELECT 
            'method'::TEXT,
            m.id,
            m.name::TEXT,
            m.description::TEXT,
            ts_rank(to_tsvector('english', m.name || ' ' || COALESCE(m.description, '')), plainto_tsquery('english', search_query))
        FROM methods m
        WHERE (m.user_id = user_id_param OR m.is_template = true)
        AND 'method' = ANY(entity_types)
        AND to_tsvector('english', m.name || ' ' || COALESCE(m.description, '')) @@ plainto_tsquery('english', search_query)
        
        UNION ALL
        
        -- Search tasks
        SELECT 
            'task'::TEXT,
            t.id,
            t.title::TEXT,
            t.description::TEXT,
            ts_rank(to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')), plainto_tsquery('english', search_query))
        FROM tasks t
        WHERE (t.user_id = user_id_param OR t.is_template = true)
        AND 'task' = ANY(entity_types)
        AND to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')) @@ plainto_tsquery('english', search_query)
    )
    SELECT * FROM search_results
    ORDER BY match_rank DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
