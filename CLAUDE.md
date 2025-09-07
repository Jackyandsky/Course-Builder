# Claude Development Guide - Course Builder Project

## Project Overview
This is a Next.js-based course builder application with Supabase backend, deployed at https://builder.vanboss.work/

### Development Credentials
- **Admin Account**: jackyandsky@gmail.com / Jacky789
- **Note**: Use these credentials for testing admin functionality only

## Critical Development Principles

### ⚠️ KEY PRINCIPLE: NON-BLOCKING LOADING STATES
- **NEVER block the UI while checking authentication or loading data**
- **Use optimistic UI patterns with cached data when possible**
- **Set loading states to false quickly to prevent UI blocking**
- **Background refresh should not block user interaction**

### 1. Database Architecture
- **Supabase Project ID**: `djvmoqharkefksvceetu`
- **NEVER create client-side Supabase instances**
- **ALL database operations MUST go through API routes** (server-side)
- Use existing API router patterns in `/src/app/api/`
- This ensures security and centralized access control

### 2. API Pattern Guidelines
```typescript
// CORRECT: Server-side API route
// src/app/api/[resource]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  // Database operations here
}

// WRONG: Client-side direct access
// ❌ Never do this in components
const supabase = createClientComponentClient();
```

### 3. Data Fetching Standards
- Use **AJAX-style asynchronous requests** for all data
- Implement loading states and error handling
- No page refreshes for data operations
- **CRITICAL: Always set loading to false in finally blocks**
- **Use timeouts for API calls (2-5 seconds max)**
- Pattern:
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      // Add timeout to prevent indefinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/resource', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error('Error:', error);
      }
    } finally {
      // ALWAYS set loading to false
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### 4. UI/UX Principles
- **SIMPLE and CLEAN interfaces only**
- Avoid visual clutter and unnecessary complexity
- Focus on functionality over decoration
- Maintain consistent, minimalist design
- Use existing Tailwind CSS patterns

#### Color Design Principles
- **Primary palette**: White, black, and grayscale (gray-50 to gray-900)
- **Adjustable degrees**: Use Tailwind's numbered scale (50-900) for fine-tuning contrast
- **Accent colors**: Only use colors (blue, green, red, etc.) when functionally necessary:
  - Success states: green (success messages, confirmations)
  - Error states: red (error messages, warnings)
  - Information: blue (links, primary actions)
  - Caution: yellow/amber (warnings, pending states)
- **Implementation**: Prefer `gray-*`, `black`, `white` for most UI elements
- **Example pattern**:
  ```css
  /* Primary UI */
  bg-white, text-gray-900, border-gray-200
  
  /* Secondary UI */
  bg-gray-50, text-gray-700, border-gray-300
  
  /* Only when needed */
  text-green-600 (success)
  text-red-600 (error)
  text-blue-600 (links)
  ```

### 5. Development Environment
- **Development server**: Always running at https://builder.vanboss.work/
- **DO NOT run `npm run dev` or `npm run build` unless explicitly requested**
- This prevents conflicts with the existing development environment

## Project Structure

### Key Directories
```
/src/app/
├── (public)/          # Public-facing pages
│   ├── courses/       # Course browsing and details
│   ├── store/         # Store functionality
│   ├── library/       # User library
│   └── tools/         # Educational tools (genParagraph, etc.)
├── (admin)/           # Admin panel
├── (auth)/            # Authentication pages
├── (account)/         # User account pages
└── api/               # API routes (ALL database operations)
    ├── public/        # Public API endpoints
    ├── courses/       # Course-related APIs
    ├── content/       # Content management APIs
    └── account/       # User account APIs
```

### Component Structure
```
/src/components/
├── auth/              # Authentication components
├── courses/           # Course-related components
├── products/          # Product display components
├── relationships/     # Relationship managers (course-book, etc.)
├── ui/                # Reusable UI components
└── layout/            # Layout components
```

## Database Schema Overview

### Core Tables
- `courses` - Course information
- `books` - Book/resource information
- `content` - Generic content items
- `lessons` - Course lessons
- `schedules` - Course schedules
- `users` - User accounts
- `user_purchases` - Purchase records
- `enrollments` - Course enrollments

### Relationships
- Courses have many lessons, books, objectives, methods
- Lessons belong to schedules
- Content is categorized and can be linked to lessons
- Users can purchase and enroll in courses

## Common Patterns

### 1. Protected Routes & Authentication Loading Issues

#### IDENTIFIED ISSUE: Account Page Loading Blocks
The `/account` page sometimes blocks with "Loading..." due to:
- **AuthContext waiting for session check before rendering**
- **No timeout on authentication API calls**
- **Layout blocking render while checking auth**

#### SOLUTION PATTERN:
```typescript
// Use cached session for instant UI
const cached = getCachedSession(30000); // 30 second cache
if (cached?.user) {
  // Show UI immediately with cached data
  setUser(cached.user);
  setLoading(false);
  // Refresh in background (non-blocking)
  checkSession().catch(console.error);
} else {
  // Still don't block - set minimal loading
  setLoading(true);
  checkSession();
}
```

```typescript
// Check authentication in API routes
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. State Persistence
```typescript
// Use sessionStorage for maintaining UI state
sessionStorage.setItem('store-page-state', JSON.stringify(state));
const savedState = sessionStorage.getItem('store-page-state');
```

### 3. Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Specific error context:', error);
  // Return appropriate error response
}
```

## Testing & Validation

### Before Committing
1. Check TypeScript compilation: `npx tsc --noEmit`
2. Run linter if available: `npm run lint`
3. Test affected functionality manually
4. Verify API routes return expected data

### Common Issues to Avoid
- Direct database access from client components
- Missing loading states
- Unhandled promise rejections
- Complex, cluttered UI designs
- Running dev server when not needed

## Deployment Notes
- Production URL: https://builder.vanboss.work/
- Changes are reflected after build and deployment
- Always test in development before pushing

## Quick Reference Commands
```bash
# Only run when explicitly requested:
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
npx tsc --noEmit    # Check TypeScript

# Safe to run anytime:
git status           # Check git status
git diff             # View changes
```

## Important Reminders
1. **Never expose API keys or secrets in client code**
2. **Always use server-side API routes for database operations**
3. **Keep interfaces simple and functional**
4. **Test thoroughly before committing**
5. **Don't run dev/build unless requested**

## Recent Architectural Decisions
- Migrated from client-side to server-side database access
- Implemented AJAX-style data fetching throughout
- Standardized on minimalist UI design
- Established clear separation between public/admin/auth areas

## API Development AI Agent 🤖

### Overview
We have an **AI-powered API Guardian Agent** that automatically enforces all API development principles. Use this agent to review, fix, and optimize API code.

### Agent Commands
```bash
# Review any API file
npm run agent:review src/app/api/[path]/route.ts

# Auto-fix violations
npm run agent:fix src/app/api/[path]/route.ts

# Scan entire project
npm run agent:scan

# Watch mode for real-time feedback
npm run agent:watch

# Interactive AI assistant
npm run agent:interactive
```

### When to Use the Agent

#### 1. Before Creating New APIs
```bash
# Generate proper API structure first
npm run generate:api -- --name products --operations CRUD --auth required

# Then review the generated code
npm run agent:review src/app/api/v2/products/route.ts
```

#### 2. When Refactoring Existing APIs
```bash
# Review and auto-fix existing API
npm run agent:fix src/app/api/navigation/homepage/route.ts
```

#### 3. For Homepage Performance Optimization
The agent will automatically:
- Convert direct Supabase queries to service layer
- Add proper caching mechanisms
- Implement timeout protection
- Consolidate duplicate endpoints
- Add error handling

Example for homepage API optimization:
```bash
# Review all homepage-related APIs
npm run agent:review src/app/api/navigation/homepage/route.ts
npm run agent:review src/app/api/public/store-products/route.ts
npm run agent:review src/app/api/courses/route.ts

# Auto-fix all violations
npm run agent:fix src/app/api/navigation/homepage/route.ts --optimize
```

### Agent Capabilities

1. **Violation Detection**
   - Direct Supabase usage in components
   - Missing service layer
   - Duplicate API endpoints
   - Missing error handling
   - No authentication checks

2. **Auto-Fix Features**
   - Converts to service layer pattern
   - Adds try-catch blocks
   - Implements proper authentication
   - Adds timeout protection
   - Fixes import statements

3. **Optimization Suggestions**
   - Caching strategies
   - Query optimization
   - Batch operations
   - Response pagination

### Integration with Development Workflow

#### Pre-commit Hook
The agent runs automatically before commits:
```bash
# .husky/pre-commit
npm run agent:review --staged
```

#### VS Code Integration
- Real-time validation as you type
- Quick fix suggestions
- Auto-format on save

#### CI/CD Pipeline
- Automatic PR reviews
- Block merging if violations exist
- Auto-fix and commit option

### Example: Optimizing Homepage APIs

To optimize all homepage-related APIs using the agent:

```bash
# 1. Scan homepage APIs
npm run agent scan --filter "navigation|homepage|public"

# 2. Review specific files
npm run agent:review src/app/api/navigation/menu/route.ts
npm run agent:review src/app/api/navigation/homepage/route.ts
npm run agent:review src/app/api/public/store-products/route.ts

# 3. Apply fixes
npm run agent:fix src/app/api/navigation/menu/route.ts
npm run agent:fix src/app/api/navigation/homepage/route.ts

# 4. Verify optimizations
npm run agent scan --filter "navigation|homepage" --report
```

### Agent Rules Configuration

The agent enforces these rules (configured in `/lib/agents/api-guardian-agent.ts`):

```typescript
{
  forbiddenPatterns: [
    'createClientComponentClient()',  // No client-side Supabase
    'supabase.from(',                 // No direct queries
    'console.log('                    // No console logs
  ],
  requiredPatterns: [
    'createRouteHandlerClient',       // Server-side only
    'try...catch',                    // Error handling
    'NextRequest, NextResponse'       // Proper types
  ],
  optimizations: {
    caching: true,                    // Add cache headers
    timeout: 5000,                    // Max 5s timeout
    pagination: true,                 // Paginate large results
    compression: true                 // Compress responses
  }
}
```

## Performance Optimization Checklist

### Auth & Loading Performance
- [ ] Always use session caching for instant UI
- [ ] Set timeouts on all API calls (2-5 seconds)
- [ ] Use `finally` blocks to ensure loading states clear
- [ ] Never block UI while checking authentication
- [ ] Implement optimistic updates where possible
- [ ] Show cached content immediately, refresh in background

### API Optimization with Agent
- [ ] Run `npm run agent:scan` weekly
- [ ] Fix all violations before deploying
- [ ] Use agent watch mode during development
- [ ] Review agent suggestions for performance

### Key Files for Loading Issues
- `/src/contexts/AuthContext.tsx` - Main auth loading logic
- `/src/app/(account)/layout.tsx` - Account layout non-blocking check
- `/src/app/(account)/account/page.tsx` - Account page loading states
- `/src/lib/auth/jwt-validator.ts` - Session caching logic
- `/lib/agents/api-guardian-agent.ts` - AI Agent configuration

## Browser Development Notes
- **DO NOT close the browser during testing** - Keep the browser tab open to maintain session state and test user experience flow
- Use browser refresh when needed for testing, but avoid closing the browser entirely

---
*Last Updated: 2025-01-31*
*This guide should be referenced for all development work on the Course Builder project*