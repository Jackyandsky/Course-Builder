# Development Principles

## 1. Database Interactions
- **NO client-side Supabase instances**
- All database interactions MUST go through API routes (server-side)
- Use the existing API router pattern already established in the project
- This ensures better security and centralized data access control
- **Supabase Project ID**: `djvmoqharkefksvceetu` (Course Builder)

## 2. Data Fetching
- Use **AJAX-style** asynchronous requests for all data interactions
- Implement smooth data retrieval without page refreshes
- Provide loading states and error handling for better UX
- Use fetch() or similar async methods for API calls

## 3. UI/UX Design
- Keep all interfaces **SIMPLE** and clean
- Avoid unnecessary complexity or visual clutter
- Focus on functionality over decorative elements
- Maintain consistent, minimalist design patterns throughout

## 4. Development Server
- **DO NOT** run `npm run dev` or `npm run build` automatically
- The development server is always running at https://builder.vanboss.work/
- Only run build/dev commands when explicitly requested by the user
- This prevents conflicts with the existing development environment