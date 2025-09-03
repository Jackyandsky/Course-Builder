# API Architecture Optimization Plan

## Current State Analysis

### 1. Identified Overlaps and Redundancies

#### A. User Profile Management
- **Duplicate Endpoints:**
  - `/api/account/profile` - User's own profile
  - `/api/admin/users/[id]` - Admin view of user profiles
  - Both fetch and update user profiles with similar logic

#### B. Enrollment Management
- **Multiple Endpoints with Similar Functionality:**
  - `/api/enrollments/current` - User's enrollments
  - `/api/enrollments/[userId]` - Specific user's enrollments
  - `/api/admin/enrollments` - All enrollments (admin)
  - `/api/courses/[id]/enrollment` - Course-specific enrollment
  - Each duplicates enrollment fetching logic

#### C. Task Submissions
- **Redundant APIs:**
  - `/api/account/tasks/submissions` - User's submissions
  - `/api/account/submissions` - User's submissions (duplicate)
  - `/api/admin/submissions` - All submissions (admin)
  - `/api/tasks/[id]/submission` - Task-specific submission
  - `/api/tasks/[id]/submit` - Submit task

#### D. Statistics and Analytics
- **Multiple Stats Endpoints:**
  - `/api/account/stats` - User stats
  - `/api/account/stats-optimized` - Optimized user stats (duplicate)
  - `/api/admin/users/[id]/stats` - User stats (admin view)
  - `/api/courses/stats` - Course stats
  - `/api/admin/orders/analytics` - Order analytics

### 2. Architecture Problems

#### A. Lack of Abstraction
- No shared service layer for common operations
- Database queries repeated across endpoints
- No consistent data transformation layer

#### B. Inconsistent Patterns
- Some APIs use RPC functions, others use direct queries
- Mixed authentication approaches
- Inconsistent error handling

#### C. Performance Issues
- Multiple database calls for related data
- No query optimization or caching strategy
- Redundant permission checks

#### D. Missing Functionality
- No batch operations support
- Limited filtering and pagination
- No field selection (GraphQL-like queries)

## Optimization Strategy

### Phase 1: Create Unified Service Layer

#### 1.1 Core Services to Create
```typescript
// /src/lib/services/unified/

├── user.service.ts       // All user-related operations
├── enrollment.service.ts // Enrollment management
├── submission.service.ts // Task submission handling
├── analytics.service.ts  // Stats and analytics
└── base.service.ts      // Base service with common patterns
```

#### 1.2 Service Pattern Example
```typescript
// base.service.ts
export abstract class BaseService {
  protected supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  // Common query builder
  protected buildQuery(table: string, options: QueryOptions) {
    let query = this.supabase.from(table).select(options.select || '*');
    
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.pagination) {
      const { page, pageSize } = options.pagination;
      query = query.range((page - 1) * pageSize, page * pageSize - 1);
    }
    
    return query;
  }
  
  // Common permission check
  protected async checkPermission(userId: string, resource: string, action: string) {
    // Unified permission logic
  }
}
```

### Phase 2: API Consolidation

#### 2.1 Unified User API
```typescript
// /api/v2/users/route.ts
// Handles all user operations with role-based access

GET /api/v2/users
  - Query params: role, status, search, page, limit
  - Returns users based on caller's permissions

GET /api/v2/users/[id]
  - Returns user profile (self or admin access)
  
PUT /api/v2/users/[id]
  - Updates user profile (self or admin access)

GET /api/v2/users/[id]/stats
  - Returns user statistics (self or admin access)

GET /api/v2/users/[id]/enrollments
  - Returns user enrollments (self or admin access)

GET /api/v2/users/[id]/submissions
  - Returns user submissions (self or admin access)
```

#### 2.2 Unified Enrollment API
```typescript
// /api/v2/enrollments/route.ts
// Single endpoint for all enrollment operations

GET /api/v2/enrollments
  - Query params: user_id, course_id, schedule_id, status
  - Returns enrollments based on permissions

POST /api/v2/enrollments
  - Creates new enrollment

PUT /api/v2/enrollments/[id]
  - Updates enrollment

DELETE /api/v2/enrollments/[id]
  - Cancels enrollment
```

#### 2.3 Unified Submission API
```typescript
// /api/v2/submissions/route.ts
// Consolidated submission management

GET /api/v2/submissions
  - Query params: user_id, task_id, course_id, status
  - Returns submissions based on permissions

POST /api/v2/submissions
  - Creates/updates submission

PUT /api/v2/submissions/[id]
  - Updates submission

GET /api/v2/submissions/[id]/media
  - Returns submission media
```

### Phase 3: Performance Optimizations

#### 3.1 Query Optimization
- Implement database views for complex joins
- Use RPC functions for aggregations
- Add indexes for common query patterns

#### 3.2 Caching Strategy
```typescript
// Cache configuration
const CACHE_CONFIG = {
  userProfile: { ttl: 300, key: 'user:{id}' },
  enrollments: { ttl: 60, key: 'enrollments:{userId}' },
  submissions: { ttl: 30, key: 'submissions:{userId}:{taskId}' },
  analytics: { ttl: 600, key: 'analytics:{type}:{id}' }
};
```

#### 3.3 Batch Operations
```typescript
// Support batch operations
POST /api/v2/batch
{
  "operations": [
    { "method": "GET", "path": "/users/123" },
    { "method": "GET", "path": "/users/123/enrollments" },
    { "method": "GET", "path": "/users/123/stats" }
  ]
}
```

### Phase 4: Migration Strategy

#### 4.1 Backward Compatibility
- Keep old endpoints with deprecation warnings
- Redirect old endpoints to new unified APIs
- Log usage to track migration progress

#### 4.2 Migration Steps
1. **Week 1-2**: Implement service layer
2. **Week 3-4**: Create new unified APIs
3. **Week 5-6**: Update frontend to use new APIs
4. **Week 7-8**: Deprecate old APIs
5. **Week 9-10**: Remove old APIs

### Phase 5: Documentation and Testing

#### 5.1 API Documentation
- OpenAPI/Swagger specification
- Interactive API documentation
- Migration guides for developers

#### 5.2 Testing Strategy
- Unit tests for service layer
- Integration tests for API endpoints
- Performance benchmarks
- Load testing

## Implementation Priority

### High Priority (Immediate)
1. **User Profile Consolidation**
   - Merge `/api/account/profile` and `/api/admin/users/[id]`
   - Create unified user service

2. **Enrollment Unification**
   - Consolidate 4 enrollment endpoints into one
   - Implement proper filtering and permissions

3. **Submission Streamlining**
   - Merge submission endpoints
   - Fix submission creation logic (auto-create on session entry)

### Medium Priority (Next Sprint)
1. **Analytics Consolidation**
   - Unify stats endpoints
   - Create dashboard service

2. **Batch Operations**
   - Implement batch API
   - Optimize for common operation sets

3. **Caching Layer**
   - Add Redis/memory cache
   - Implement cache invalidation

### Low Priority (Future)
1. **GraphQL Gateway**
   - Consider GraphQL for complex queries
   - Field selection capabilities

2. **API Versioning**
   - Implement proper versioning
   - Deprecation policies

## Expected Benefits

### Performance Improvements
- **50-70% reduction** in database queries
- **30-40% faster** response times
- **60% less** code duplication

### Developer Experience
- Consistent API patterns
- Better error handling
- Cleaner codebase
- Easier maintenance

### User Experience
- Faster page loads
- More reliable operations
- Better error messages
- Consistent behavior

## Success Metrics

1. **API Response Time**: < 200ms p95
2. **Database Queries**: < 3 per API call average
3. **Code Reduction**: 40% less API code
4. **Error Rate**: < 0.1% API errors
5. **Cache Hit Rate**: > 70% for common queries

## Next Steps

1. Review and approve this plan
2. Create detailed technical specifications
3. Set up development environment for v2 APIs
4. Begin Phase 1 implementation
5. Establish monitoring and metrics

---

*This optimization plan addresses the core issue: "our api always build one step, not have a comprehensive overall plan that lead to some functionalities of api overlap or overlook the effectiveness."*

*By consolidating APIs and creating a unified service layer, we can eliminate redundancy, improve performance, and create a more maintainable codebase.*