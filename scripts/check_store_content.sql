-- Check store content and categories
-- This script helps debug why only 2 items show in the store

-- 1. Check all categories and their content count
SELECT 
    c.id,
    c.name,
    c.type,
    COUNT(content.id) as content_count
FROM categories c
LEFT JOIN content ON content.category_id = c.id
GROUP BY c.id, c.name, c.type
ORDER BY c.name;

-- 2. Check content in store categories specifically
SELECT 
    content.id,
    content.name,
    content.user_id,
    categories.name as category_name,
    content.created_at
FROM content
JOIN categories ON content.category_id = categories.id
WHERE categories.name IN ('Decoders', 'Complete Study Packages', 'Standardizers', 'LEX')
ORDER BY categories.name, content.name;

-- 3. Check if there's content without proper category assignment
SELECT 
    content.id,
    content.name,
    content.category_id,
    content.user_id,
    categories.name as category_name
FROM content
LEFT JOIN categories ON content.category_id = categories.id
WHERE categories.name IS NULL OR categories.id IS NULL;

-- 4. Check content that might need to be in store but isn't showing
SELECT 
    content.id,
    content.name,
    content.user_id,
    categories.name as category_name,
    categories.type as category_type
FROM content
JOIN categories ON content.category_id = categories.id
WHERE content.name LIKE '%Decoder%' 
   OR content.name LIKE '%Study Package%'
   OR content.name LIKE '%Standardizer%'
   OR content.name LIKE '%LEX%'
   OR content.name LIKE '%Vocabulary%'
ORDER BY categories.name, content.name;