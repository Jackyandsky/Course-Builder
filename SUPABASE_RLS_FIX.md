# Fix for RLS Policy Error

## Problem
The application is getting "new row violates row-level security policy" error because the database has Row Level Security (RLS) policies that require authenticated users, but we're implementing a shared access model.

## Solution
Execute the SQL script in `/database/shared_access_policies.sql` in your Supabase SQL editor to update all RLS policies to allow shared access.

## Steps to Fix

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `/database/shared_access_policies.sql`
4. Execute the script

This will:
- Drop all restrictive user-based RLS policies
- Create new permissive policies that allow all operations for shared access
- Maintain data security through application-level permissions rather than database-level user restrictions

## Alternative Quick Fix (if you prefer)
If you want a quicker solution, you can temporarily disable RLS on the schedules table:

```sql
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
```

However, I recommend using the comprehensive solution above for consistency across all tables.