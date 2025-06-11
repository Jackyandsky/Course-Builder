'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CourseForm } from '@/components/courses/CourseForm';
import { courseService } from '@/lib/supabase/courses';
import { Spinner } from '@/components/ui';
import { Course } from '@/types/database';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourse(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Failed to load course:', error);
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return <CourseForm initialData={course} />;
}
