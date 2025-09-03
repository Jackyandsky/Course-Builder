-- Insert books from refined list
-- Generated on 2025-08-27T19:01:43.005Z
-- Total: 19 books

-- Use a shared user ID for these imports (should be replaced with actual user ID)
WITH new_books AS (
  SELECT 
    gen_random_uuid() as id,
    title,
    author,
    isbn,
    publisher,
    publication_year,
    description,
    cover_image_url,
    total_pages,
    language,
    tags,
    is_public,
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    created_at,
    updated_at
  FROM (VALUES
    ('A Shropshire Lad', 'A.E. Housman', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Poetry']::text[], true, NOW(), NOW()),
    ('De Profundis', 'Oscar Wilde', NULL::text, NULL::text, 1905, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('Kim', 'Rudyard Kipling', NULL::text, NULL::text, 1901, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('Pollyanna', 'Eleanor H. Porter', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Bad Child''s Book of Beasts', 'Hilaire Belloc', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Everlasting Mercy', 'John Masefield', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Poetry']::text[], true, NOW(), NOW()),
    ('The Food of the Gods', 'H.G. Wells', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Science Fiction']::text[], true, NOW(), NOW()),
    ('The Gods of Pegāna', 'Lord Dunsany', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Good Soldier', 'Ford Madox Ford', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The House on the Borderland', 'William Hope Hodgson', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Island of Doctor Moreau', 'H.G. Wells', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Science Fiction']::text[], true, NOW(), NOW()),
    ('The Man Who Was Thursday', 'G.K. Chesterton', NULL::text, NULL::text, 1908, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Napoleon of Notting Hill', 'G.K. Chesterton', NULL::text, NULL::text, 1904, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Old Wives'' Tale', 'Arnold Bennett', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The Red Badge of Courage', 'Stephen Crane', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['War Fiction']::text[], true, NOW(), NOW()),
    ('The Return of Sherlock Holmes', 'Arthur Conan Doyle', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Mystery']::text[], true, NOW(), NOW()),
    ('The Tale of Peter Rabbit', 'Beatrix Potter', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Children''s Literature']::text[], true, NOW(), NOW()),
    ('The Thirty-Nine Steps', 'John Buchan', NULL::text, NULL::text, 1915, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW()),
    ('The White People', 'Arthur Machen', NULL::text, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::integer, 'English', ARRAY['Classic Literature']::text[], true, NOW(), NOW())
  ) AS t(title, author, isbn, publisher, publication_year, description, cover_image_url, total_pages, language, tags, is_public, created_at, updated_at)
)
INSERT INTO books (id, title, author, isbn, publisher, publication_year, description, cover_image_url, total_pages, language, tags, is_public, user_id, created_at, updated_at)
SELECT nb.* FROM new_books nb
WHERE NOT EXISTS (
  SELECT 1 FROM books b 
  WHERE LOWER(b.title) = LOWER(nb.title) 
  AND (
    (b.author IS NULL AND nb.author IS NULL) OR 
    (LOWER(b.author) = LOWER(nb.author))
  )
);

-- Return count of inserted books
SELECT COUNT(*) as inserted_count FROM books 
WHERE created_at >= NOW() - INTERVAL '1 minute';
