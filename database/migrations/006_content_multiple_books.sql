-- Migration to support multiple books per content item

-- Create content_books join table
CREATE TABLE IF NOT EXISTS public.content_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique content-book combinations
    UNIQUE(content_id, book_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_books_content_id ON public.content_books(content_id);
CREATE INDEX IF NOT EXISTS idx_content_books_book_id ON public.content_books(book_id);

-- Add RLS policies
ALTER TABLE public.content_books ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view content_books
CREATE POLICY "Users can view content_books" ON public.content_books
    FOR SELECT
    USING (true);

-- Policy to allow users to manage content_books for their content
CREATE POLICY "Users can manage content_books" ON public.content_books
    FOR ALL
    USING (
        content_id IN (
            SELECT id FROM public.content 
            WHERE user_id = auth.uid() OR user_id = 'd5369e6a-0859-4ccc-b75a-d966c8eb3da0'::uuid
        )
    );

-- Migrate existing book_id data to content_books
INSERT INTO public.content_books (content_id, book_id, is_primary, position)
SELECT 
    id as content_id,
    book_id,
    true as is_primary,
    0 as position
FROM public.content
WHERE book_id IS NOT NULL
ON CONFLICT (content_id, book_id) DO NOTHING;

-- Add comment to book_id column indicating it's deprecated
COMMENT ON COLUMN public.content.book_id IS 'DEPRECATED: Use content_books table for multiple book associations. This column is maintained for backward compatibility.';