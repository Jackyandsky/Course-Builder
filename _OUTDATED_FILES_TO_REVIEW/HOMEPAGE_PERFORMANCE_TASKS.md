# Homepage Performance Improvement Tasks

## Date Created: 2025-01-31
## Status: Pending Implementation

## 🎯 Objective
Apply performance optimization patterns from PERFORMANCE_IMPROVEMENTS.md to the homepage to achieve instant loading and non-blocking UI.

## 📊 Current Performance Issues
- Homepage blocks on auth loading (2-3 seconds)
- Featured courses fetch on every load (1-2 seconds)
- No caching mechanism
- No timeout protection
- Sequential loading pattern
- Total blocking time: 3-5+ seconds

## ✅ Tasks to Complete

### Priority 1: Critical Performance Fixes

#### Task 1: Remove Blocking Auth Dependency from Hero Section
- **File**: `/src/app/(public)/page.tsx`
- **Lines**: 10, 66, 77, 541
- **Action**: Make hero buttons always visible, check auth in background
- **Impact**: Removes 2-3 second initial blocking

#### Task 2: Implement Cache-First Approach for Featured Courses
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Add sessionStorage caching with 5-minute TTL
- **Code Pattern**:
```typescript
const getCachedCourses = () => {
  const cached = sessionStorage.getItem('featured_courses');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data;
    }
  }
  return null;
};
```

#### Task 3: Add Timeout Protection to API Calls
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Implement fetchWithTimeout utility
- **Timeout**: 3 seconds maximum
- **Pattern**: Use from `/src/lib/utils/api-timeout.ts`

### Priority 2: UX Improvements

#### Task 4: Add Skeleton Loaders for Course Cards
- **File**: `/src/app/(public)/page.tsx`
- **Lines**: 186-189 (replace spinner)
- **Action**: Show skeleton cards instead of spinner
- **Benefit**: Better perceived performance

#### Task 5: Implement Parallel Data Fetching
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Load auth and courses simultaneously
- **Pattern**: Use Promise.allSettled()

#### Task 6: Implement SessionStorage Caching
- **File**: `/src/app/(public)/page.tsx`
- **Cache Duration**: 5 minutes for courses
- **Pattern**: Show cached immediately, refresh in background

### Priority 3: Resilience & Polish

#### Task 7: Remove Non-Critical useAuth Dependencies
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Only use auth where absolutely needed
- **Benefit**: Reduces re-renders and dependencies

#### Task 8: Add Optimistic UI with Static Content
- **File**: `/src/app/(public)/page.tsx`
- **Lines**: 371-527 (static course cards)
- **Action**: Always show static cards as fallback

#### Task 9: Implement Request Deduplication
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Prevent multiple simultaneous course fetches
- **Pattern**: Use fetching flag or promise cache

#### Task 10: Add Error Boundaries with Graceful Fallbacks
- **File**: `/src/app/(public)/page.tsx`
- **Action**: Wrap sections in error boundaries
- **Fallback**: Show static content on errors

## 📈 Expected Performance Improvements

### Before Optimization:
- Initial render: 2-3 seconds (auth blocking)
- Featured courses: 1-2 seconds additional
- Total blocking time: 3-5 seconds
- Time to interactive: 3-5 seconds

### After Optimization:
- Initial render: <100ms (instant static)
- Featured courses: <100ms cached, 300-500ms fresh
- Total blocking time: 0ms (non-blocking)
- Time to interactive: <100ms

## 🔧 Implementation Approach

### Step 1: Non-blocking Auth (30 mins)
1. Remove authLoading checks from critical UI
2. Move auth-dependent logic to useEffect
3. Test hero section loads instantly

### Step 2: Caching Layer (45 mins)
1. Implement sessionStorage caching for courses
2. Add cache-first pattern
3. Background refresh logic

### Step 3: Timeout & Error Handling (30 mins)
1. Add fetchWithTimeout wrapper
2. Implement error boundaries
3. Add fallback content

### Step 4: UI Polish (45 mins)
1. Replace spinner with skeleton loaders
2. Ensure static content always shows
3. Test graceful degradation

### Step 5: Testing & Verification (30 mins)
1. Test with slow network
2. Test with auth failures
3. Test with API errors
4. Verify cache behavior

## 🧪 Testing Checklist
- [ ] Homepage loads instantly (no white screen)
- [ ] Hero buttons always visible
- [ ] Cached courses show immediately
- [ ] Fresh data loads in background
- [ ] API timeouts work (3 seconds max)
- [ ] Error states show fallback content
- [ ] Skeleton loaders appear during fetch
- [ ] No console errors
- [ ] Auth state updates don't block UI
- [ ] Page is interactive immediately

## 📝 Notes
- Follow patterns from PERFORMANCE_IMPROVEMENTS.md
- Prioritize non-blocking UI over data freshness
- Use optimistic UI patterns throughout
- Test on slow 3G to verify improvements
- Consider adding performance monitoring

## 🔄 Rollback Plan
If issues occur:
1. Original page.tsx is unchanged
2. Can revert individual optimizations
3. Each task is independent

---
*Estimated Total Time: 3 hours*
*Target Completion: Tomorrow*