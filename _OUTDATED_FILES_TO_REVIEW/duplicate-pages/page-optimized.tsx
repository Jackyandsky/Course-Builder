'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Globe, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import CourseCard from '@/components/courses/CourseCard';

// Utility: Fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 3000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Utility: Get cached courses
const getCachedCourses = (): any[] | null => {
  try {
    const cached = sessionStorage.getItem('homepage_featured_courses');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // 5 minute cache
      if (Date.now() - timestamp < 300000) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

// Utility: Cache courses
const cacheCourses = (courses: any[]): void => {
  try {
    sessionStorage.setItem('homepage_featured_courses', JSON.stringify({
      data: courses,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Static fallback courses (always available)
const STATIC_COURSES = [
  {
    id: 'static-1',
    title: 'L8-9 Reading & Writing',
    name: 'L8-9 Reading & Writing',
    difficulty: 'Middle School',
    duration_hours: null,
    description: 'Dive into classic and contemporary works while developing structured writing skills through our 5/5/5 methodology. This foundational course for students in levels 7-9 is designed to significantly enhance critical reading abilities, analytical thinking, and sophisticated essay writing skills.',
    course_objectives: []
  },
  {
    id: 'static-2',
    title: 'Advanced Literature Analysis',
    name: 'Advanced Literature Analysis',
    difficulty: 'High School',
    duration_hours: null,
    description: 'Critical analysis of complex literary works focusing on themes, character development, and historical context through essay-based assessments. This advanced course prepares students for college-level literary analysis through intensive reading and writing practice.',
    course_objectives: []
  },
  {
    id: 'static-3',
    title: 'Shakespeare Studies',
    name: 'Shakespeare Studies',
    difficulty: 'Advanced',
    duration_hours: null,
    description: 'Specialized exploration of Shakespearean works with focus on language analysis, thematic development, and historical context. Students will delve into the rich world of Shakespeare\'s plays and sonnets, examining the intricacies of Elizabethan language.',
    course_objectives: []
  }
];

// Skeleton loader component
const CourseCardSkeleton = () => (
  <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 animate-pulse flex flex-col" style={{ minHeight: '420px' }}>
    <div className="mb-3">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="mb-4">
      <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-24 mt-auto"></div>
  </div>
);

export default function OptimizedHomePage() {
  // Auth is non-blocking - we don't wait for it
  const { user } = useAuth();
  
  // State management
  const [featuredCourses, setFeaturedCourses] = useState<any[]>(() => {
    // Initialize with cached data if available
    return getCachedCourses() || [];
  });
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(false);
  
  // Request deduplication
  const fetchingRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    // Request deduplication - prevent multiple simultaneous fetches
    if (fetchingRef.current && fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // Check cache first
    const cached = getCachedCourses();
    if (cached && cached.length > 0) {
      setFeaturedCourses(cached);
      // Still fetch fresh data in background
      fetchFreshCourses(true);
      return;
    }

    // No cache, fetch fresh
    fetchPromiseRef.current = fetchFreshCourses(false);
    return fetchPromiseRef.current;
  };

  const fetchFreshCourses = async (isBackgroundRefresh: boolean) => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      
      // Only show loading if not a background refresh and no cached data
      if (!isBackgroundRefresh && featuredCourses.length === 0) {
        setCoursesLoading(true);
      }
      
      // Fetch with timeout protection (3 seconds)
      const response = await fetchWithTimeout('/api/public/courses?limit=3', 3000);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();

      const enrichedCourses = data?.map((course: any) => ({
        ...course,
        enrollment_count: Math.floor(Math.random() * 500) + 100,
        rating: (Math.random() * 1 + 4).toFixed(1),
      })) || [];

      // Update state and cache
      if (enrichedCourses.length > 0) {
        setFeaturedCourses(enrichedCourses);
        cacheCourses(enrichedCourses);
        setCoursesError(false);
      }
    } catch (error) {
      console.error('Error loading featured courses:', error);
      setCoursesError(true);
      
      // If no cached data and fetch failed, use static fallback
      if (featuredCourses.length === 0) {
        setFeaturedCourses(STATIC_COURSES);
      }
    } finally {
      setCoursesLoading(false);
      fetchingRef.current = false;
      fetchPromiseRef.current = null;
    }
  };

  // Course display component with proper error boundaries
  const renderCourseCard = (course: any, index: number) => {
    try {
      return (
        <div key={course.id} className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
          <div className="mb-3">
            <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
              {course.difficulty || 'Middle School'}
            </span>
            <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
              {course.title || course.name}
            </h3>
            <p className="text-[13px] text-[#86868b]">
              {course.duration_hours ? `${course.duration_hours} hours` : '30-week'} comprehensive {course.difficulty?.toLowerCase() || 'foundation'} course
            </p>
          </div>
          
          <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
            {course.description || 'Dive into classic and contemporary works while developing structured writing skills through our 5/5/5 methodology.'}
          </p>
          
          <div className="mb-4">
            <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
              Core Learning Objectives:
            </p>
            <ul className="space-y-1.5">
              {course.course_objectives && course.course_objectives.length > 0 ? (
                course.course_objectives.slice(0, 3).map((obj: any, idx: number) => (
                  <li key={obj.id || idx} className="flex items-start">
                    <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                    <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                      {obj.objective?.title || obj.objective_text || 'Develop critical analysis'}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                    <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                      Develop critical analysis of literary works
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                    <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                      Master structured essay composition
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                    <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                      Expand vocabulary through weekly word studies
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <Link 
            href={course.id.startsWith('static-') ? '/courses' : `/courses/${course.id}`}
            className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
          >
            Learn More →
          </Link>
        </div>
      );
    } catch (error) {
      console.error('Error rendering course card:', error);
      return null;
    }
  };

  return (
    <>
      {/* Hero Section - Non-blocking, always visible */}
      <section className="text-center py-[120px] px-5 bg-[#000] text-[var(--igps-landing-text-color-light)] mb-2.5" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <h1 className="text-[48px] font-bold mb-2 tracking-[-0.022em] leading-[1.08]" style={{ fontWeight: 700 }}>
          Literary Excellence & Critical Thinking
        </h1>
        <h2 className="text-[24px] font-medium mb-[18px] leading-[1.1]" style={{ fontWeight: 500 }}>
          Professional Course Management Platform
        </h2>
        <p className="text-[15px] max-w-[600px] mx-auto mb-[30px] leading-[1.5]" style={{ fontWeight: 400 }}>
          Transform your educational content into structured, engaging courses with our comprehensive 
          course building tools, content management system, and student tracking features.
        </p>
        
        {/* Buttons always visible - no auth blocking */}
        <div className="flex justify-center gap-[35px]">
          {user ? (
            <>
              <Link href="/account" className="text-[var(--igps-landing-link-color)] text-[18px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
                Go to Dashboard
                <span className="ml-[5px]">›</span>
              </Link>
              <Link href="/courses" className="text-[var(--igps-landing-link-color)] text-[18px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
                Explore Courses
                <span className="ml-[5px]">›</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/courses" className="text-[var(--igps-landing-link-color)] text-[18px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
                Explore Courses
                <span className="ml-[5px]">›</span>
              </Link>
              <Link href="/login" className="text-[var(--igps-landing-link-color)] text-[18px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
                Enroll Now
                <span className="ml-[5px]">›</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Product Grid - Static content, always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mx-auto max-w-[1200px] px-[10px] w-full" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <div className="bg-white text-center py-[60px] px-5 rounded-[18px]">
          <h3 className="text-[34px] font-bold mb-1 text-[var(--igps-landing-text-color)] leading-[1.07]" style={{ fontWeight: 700 }}>
            Standardized Excellence
          </h3>
          <h4 className="text-[18px] font-medium mb-3 text-[var(--igps-landing-text-color)] leading-[1.23536]" style={{ fontWeight: 500 }}>
            Comprehensive Course Syllabi
          </h4>
          <p className="px-5 text-[15px] text-[var(--igps-landing-text-color)] leading-[1.47059]" style={{ fontWeight: 400 }}>
            Our standardizers provide meticulously structured 30-session courses covering canonical literature. 
            Each syllabus includes detailed weekly breakdowns, vocabulary lists, writing assignments, and critical analysis frameworks for works by Shakespeare, Wilde, Joyce, and more.
          </p>
          <div className="flex justify-center gap-[30px] mt-5">
            <Link href="/store?category=Standardizers" className="text-[var(--igps-landing-link-color)] text-[15px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
              Browse Standardizers
              <span className="ml-[5px]">›</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white text-center py-[60px] px-5 rounded-[18px]">
          <h3 className="text-[34px] font-bold mb-1 text-[var(--igps-landing-text-color)] leading-[1.07]" style={{ fontWeight: 700 }}>
            LEX Vocabulary System
          </h3>
          <h4 className="text-[18px] font-medium mb-3 text-[var(--igps-landing-text-color)] leading-[1.23536]" style={{ fontWeight: 500 }}>
            Advanced Vocabulary Libraries
          </h4>
          <p className="px-5 text-[15px] text-[var(--igps-landing-text-color)] leading-[1.47059]" style={{ fontWeight: 400 }}>
            LEX provides comprehensive vocabulary mastery with 1000-1200 carefully curated words per course. 
            Students systematically learn advanced academic vocabulary from A-Z, with definitions, usage examples, and integrated weekly assessments aligned with our literature curriculum.
          </p>
          <div className="flex justify-center gap-[30px] mt-5">
            <Link href="/store?category=LEX" className="text-[var(--igps-landing-link-color)] text-[15px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
              Explore LEX Library
              <span className="ml-[5px]">›</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Highlight Section - Static content */}
      <section className="bg-[#fafafa] py-[80px] px-5 my-[10px] text-center" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-[28px] font-bold mb-3 text-[var(--igps-landing-text-color)] leading-[1.125]" style={{ fontWeight: 700 }}>
            Why Choose GRAMMATICOS PLATFORM SOLUTION?
          </h2>
          <p className="text-[15px] mb-5 text-[var(--igps-landing-text-color)] leading-[1.5]" style={{ fontWeight: 400 }}>
            Our structured curriculum builds critical analysis skills through comprehensive course management tools.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[40px]">
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[var(--igps-landing-btn-color)] mb-[10px] leading-none" style={{ fontWeight: 600 }}>
                3000+
              </div>
              <p className="text-[14px] text-[var(--igps-landing-text-color)]" style={{ fontWeight: 400 }}>Courses & Materials</p>
            </div>
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[var(--igps-landing-btn-color)] mb-[10px] leading-none" style={{ fontWeight: 600 }}>
                500+
              </div>
              <p className="text-[14px] text-[var(--igps-landing-text-color)]" style={{ fontWeight: 400 }}>Active Educators</p>
            </div>
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[var(--igps-landing-btn-color)] mb-[10px] leading-none" style={{ fontWeight: 600 }}>
                30+
              </div>
              <p className="text-[14px] text-[var(--igps-landing-text-color)]" style={{ fontWeight: 400 }}>Teaching Methods</p>
            </div>
          </div>
          
          <Link href="/courses" className="inline-block bg-[var(--igps-landing-btn-color)] text-white px-[22px] py-3 rounded-[980px] text-[15px] font-normal mt-[15px] transition-all duration-300 hover:bg-[#0077ed] no-underline" style={{ fontWeight: 400 }}>
            Discover our methodology
          </Link>
        </div>
      </section>

      {/* Featured Literature Courses Section - With cache and skeleton loaders */}
      <section className="py-[80px] px-5 bg-white" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <div className="max-w-[1240px] mx-auto">
          <h2 className="text-[32px] font-bold mb-3 text-center text-[var(--igps-landing-text-color)] leading-[1.125]" style={{ fontWeight: 700 }}>
            Featured Literature Courses
          </h2>
          <p className="text-[16px] mb-10 text-center text-[#86868b] leading-[1.5] max-w-[700px] mx-auto" style={{ fontWeight: 400 }}>
            Explore our meticulously structured reading and writing programs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coursesLoading && featuredCourses.length === 0 ? (
              // Show skeleton loaders while loading
              <>
                <CourseCardSkeleton />
                <CourseCardSkeleton />
                <CourseCardSkeleton />
              </>
            ) : featuredCourses.length > 0 ? (
              // Show courses (cached or fresh)
              featuredCourses.slice(0, 3).map(renderCourseCard)
            ) : (
              // Show static fallback courses
              STATIC_COURSES.map(renderCourseCard)
            )}
          </div>
          
          {coursesError && featuredCourses.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Using cached content. Fresh data will load when available.
            </p>
          )}
        </div>
      </section>

      {/* CTA Section - Non-blocking */}
      <section className="bg-[#000] text-[var(--igps-landing-text-color-light)] text-center py-[100px] px-5" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <h2 className="text-[28px] font-bold mb-3 leading-[1.125]" style={{ fontWeight: 700 }}>
          Elevate Your Teaching & Learning Experience
        </h2>
        <p className="text-[15px] max-w-[600px] my-5 mx-auto leading-[1.5]" style={{ fontWeight: 400 }}>
          Join our comprehensive course platform featuring advanced content management, 
          structured curriculum design, and proven methodologies to prepare for educational success.
        </p>
        <Link href={user ? "/account" : "/login"} className="inline-block bg-[var(--igps-landing-btn-color)] text-white px-[22px] py-3 rounded-[980px] text-[15px] font-normal mt-[30px] transition-all duration-300 hover:bg-[#0077ed] no-underline" style={{ fontWeight: 400 }}>
          {user ? "Go to Dashboard" : "Start Journey"}
        </Link>
      </section>
    </>
  );
}