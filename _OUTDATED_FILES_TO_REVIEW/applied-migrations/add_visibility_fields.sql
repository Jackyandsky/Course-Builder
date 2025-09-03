-- Add visibility fields to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS show_on_menu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS homepage_order INTEGER DEFAULT 0;

-- Add visibility fields to content table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS show_on_menu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS homepage_order INTEGER DEFAULT 0;

-- Add visibility fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS show_on_menu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS homepage_order INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_menu_visibility ON courses(show_on_menu, menu_order) WHERE show_on_menu = true;
CREATE INDEX IF NOT EXISTS idx_courses_homepage_visibility ON courses(show_on_homepage, homepage_order) WHERE show_on_homepage = true;

CREATE INDEX IF NOT EXISTS idx_content_menu_visibility ON content(show_on_menu, menu_order) WHERE show_on_menu = true;
CREATE INDEX IF NOT EXISTS idx_content_homepage_visibility ON content(show_on_homepage, homepage_order) WHERE show_on_homepage = true;

CREATE INDEX IF NOT EXISTS idx_books_menu_visibility ON books(show_on_menu, menu_order) WHERE show_on_menu = true;
CREATE INDEX IF NOT EXISTS idx_books_homepage_visibility ON books(show_on_homepage, homepage_order) WHERE show_on_homepage = true;

-- Add comments for documentation
COMMENT ON COLUMN courses.show_on_menu IS 'Whether this course should appear in the navigation menu';
COMMENT ON COLUMN courses.show_on_homepage IS 'Whether this course should appear on the homepage';
COMMENT ON COLUMN courses.menu_order IS 'Display order in the navigation menu (lower numbers appear first)';
COMMENT ON COLUMN courses.homepage_order IS 'Display order on the homepage (lower numbers appear first)';

COMMENT ON COLUMN content.show_on_menu IS 'Whether this content should appear in the navigation menu';
COMMENT ON COLUMN content.show_on_homepage IS 'Whether this content should appear on the homepage';
COMMENT ON COLUMN content.menu_order IS 'Display order in the navigation menu (lower numbers appear first)';
COMMENT ON COLUMN content.homepage_order IS 'Display order on the homepage (lower numbers appear first)';

COMMENT ON COLUMN books.show_on_menu IS 'Whether this book should appear in the navigation menu';
COMMENT ON COLUMN books.show_on_homepage IS 'Whether this book should appear on the homepage';
COMMENT ON COLUMN books.menu_order IS 'Display order in the navigation menu (lower numbers appear first)';
COMMENT ON COLUMN books.homepage_order IS 'Display order on the homepage (lower numbers appear first)';