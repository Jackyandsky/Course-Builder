# Course-User Relationship Management

## Enrolling Users in Courses

### Method 1: Single User Enrollment
```typescript
// Enroll a single user in a course
async function enrollUserInCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'pending',
      enrolled_at: new Date().toISOString(),
      enrolled_by: currentAdminId, // Track who enrolled them
      progress: {
        completed_lessons: [],
        current_lesson: null,
        completion_percentage: 0
      }
    })
    .select()
    .single();

  return { data, error };
}
```

### Method 2: Bulk Enrollment (Multiple Users)
```typescript
// Using the existing bulk enrollment API
async function bulkEnrollUsers(userIds: string[], courseIds: string[]) {
  const response = await fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_ids: userIds,
      course_ids: courseIds,
      group_id: groupId // Optional: for class enrollments
    })
  });
  
  return response.json();
}
```

### Method 3: Self-Enrollment (User Purchase)
```typescript
// When a user purchases a course
async function selfEnrollInCourse(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      status: 'active', // Active immediately for purchases
      enrolled_at: new Date().toISOString(),
      enrolled_by: user.id, // Self-enrolled
    });
}
```

## Tracking Progress

### Update Lesson Completion
```typescript
async function markLessonComplete(enrollmentId: string, lessonId: string) {
  // Get current enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress')
    .eq('id', enrollmentId)
    .single();

  // Update progress
  const updatedProgress = {
    ...enrollment.progress,
    completed_lessons: [...enrollment.progress.completed_lessons, lessonId],
    current_lesson: getNextLesson(lessonId),
    completion_percentage: calculateCompletionPercentage()
  };

  // Save updated progress
  const { data, error } = await supabase
    .from('enrollments')
    .update({ 
      progress: updatedProgress,
      status: updatedProgress.completion_percentage === 100 ? 'completed' : 'active',
      completed_at: updatedProgress.completion_percentage === 100 ? new Date().toISOString() : null
    })
    .eq('id', enrollmentId);
}
```

### Track Time and Activity
```typescript
async function updateLastAccessed(enrollmentId: string) {
  await supabase
    .from('enrollments')
    .update({ 
      started_at: new Date().toISOString(), // First access
      metadata: {
        last_accessed: new Date().toISOString(),
        access_count: supabase.sql`metadata->access_count + 1`
      }
    })
    .eq('id', enrollmentId);
}
```

## Querying Relationships

### Get All Courses for a User
```typescript
async function getUserCourses(userId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id,
        title,
        description,
        thumbnail_url,
        instructor_name,
        duration_hours,
        difficulty,
        category:categories(name)
      )
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'pending', 'completed'])
    .order('enrolled_at', { ascending: false });

  return data;
}
```

### Get All Users in a Course
```typescript
async function getCourseEnrollments(courseId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      user:user_profiles(
        id,
        full_name,
        email,
        role,
        avatar_url
      ),
      group:user_groups(name)
    `)
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });

  return data;
}
```

### Get Course Statistics
```typescript
async function getCourseStats(courseId: string) {
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('status, progress')
    .eq('course_id', courseId);

  return {
    totalEnrolled: enrollments.length,
    activeUsers: enrollments.filter(e => e.status === 'active').length,
    completedUsers: enrollments.filter(e => e.status === 'completed').length,
    averageProgress: enrollments.reduce((sum, e) => 
      sum + (e.progress?.completion_percentage || 0), 0) / enrollments.length
  };
}
```

## Status Management

### Update Enrollment Status
```typescript
async function updateEnrollmentStatus(
  enrollmentId: string, 
  newStatus: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled'
) {
  const updates: any = { status: newStatus };
  
  // Add timestamps based on status
  if (newStatus === 'active' && !enrollment.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (newStatus === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId);
}
```

### Suspend/Resume Access
```typescript
async function suspendEnrollment(enrollmentId: string, reason: string) {
  await supabase
    .from('enrollments')
    .update({ 
      status: 'suspended',
      metadata: {
        suspension_reason: reason,
        suspended_at: new Date().toISOString()
      }
    })
    .eq('id', enrollmentId);
}

async function resumeEnrollment(enrollmentId: string) {
  await supabase
    .from('enrollments')
    .update({ 
      status: 'active',
      metadata: {
        resumed_at: new Date().toISOString()
      }
    })
    .eq('id', enrollmentId);
}
```

## Best Practices

### 1. Use Database Constraints
```sql
-- Prevent duplicate enrollments
ALTER TABLE enrollments 
ADD CONSTRAINT unique_user_course 
UNIQUE (user_id, course_id);

-- Ensure referential integrity
ALTER TABLE enrollments
ADD CONSTRAINT fk_user FOREIGN KEY (user_id) 
REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE enrollments
ADD CONSTRAINT fk_course FOREIGN KEY (course_id) 
REFERENCES courses(id) ON DELETE CASCADE;
```

### 2. Use Row Level Security (RLS)
```sql
-- Users can only see their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3. Implement Expiration Logic
```typescript
// Check and update expired enrollments
async function checkExpiredEnrollments() {
  const now = new Date().toISOString();
  
  await supabase
    .from('enrollments')
    .update({ status: 'cancelled' })
    .lt('expires_at', now)
    .in('status', ['active', 'pending']);
}
```

### 4. Track Enrollment History
```typescript
// Keep audit log of enrollment changes
async function logEnrollmentChange(
  enrollmentId: string, 
  action: string, 
  details: any
) {
  await supabase
    .from('enrollment_history')
    .insert({
      enrollment_id: enrollmentId,
      action: action,
      details: details,
      performed_by: currentUserId,
      performed_at: new Date().toISOString()
    });
}
```

## Admin Functions

### Mass Enrollment Management
```typescript
// Enroll an entire class/group
async function enrollGroupInCourse(groupId: string, courseId: string) {
  // Get all users in the group
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('is_active', true);

  // Bulk enroll
  const enrollments = members.map(m => ({
    user_id: m.user_id,
    course_id: courseId,
    group_id: groupId,
    status: 'pending',
    enrolled_at: new Date().toISOString(),
    enrolled_by: currentAdminId
  }));

  await supabase
    .from('enrollments')
    .insert(enrollments);
}
```

### Transfer Enrollments
```typescript
// Transfer enrollment from one user to another
async function transferEnrollment(
  enrollmentId: string, 
  newUserId: string
) {
  await supabase
    .from('enrollments')
    .update({ 
      user_id: newUserId,
      metadata: {
        transferred_from: oldUserId,
        transferred_at: new Date().toISOString(),
        transferred_by: currentAdminId
      }
    })
    .eq('id', enrollmentId);
}
```

## Reporting and Analytics

### Generate Enrollment Reports
```typescript
async function getEnrollmentReport(startDate: string, endDate: string) {
  const { data } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(title, category:categories(name)),
      user:user_profiles(full_name, email)
    `)
    .gte('enrolled_at', startDate)
    .lte('enrolled_at', endDate);

  return {
    totalEnrollments: data.length,
    byStatus: groupBy(data, 'status'),
    byCourse: groupBy(data, 'course.title'),
    byMonth: groupByMonth(data, 'enrolled_at')
  };
}
```