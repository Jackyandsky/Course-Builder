import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function CoursesTestPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      category:categories (
        id,
        name
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Published Courses Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(courses, null, 2)}
      </pre>
      <div className="mt-4">
        <p>Total courses: {courses?.length || 0}</p>
      </div>
    </div>
  );
}