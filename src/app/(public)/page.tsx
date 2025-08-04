'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Globe, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CourseCard from '@/components/courses/CourseCard';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(3)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedCourses = data?.map(course => ({
        ...course,
        enrollment_count: Math.floor(Math.random() * 500) + 100,
        rating: (Math.random() * 1 + 4).toFixed(1),
      })) || [];

      setFeaturedCourses(enrichedCourses);
    } catch (error) {
      console.error('Error loading featured courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071e3]"></div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - IGPS Style */}
      <section className="text-center py-[120px] px-5 bg-[#4a5568] text-white mb-2.5">
        <h1 className="text-5xl font-bold mb-2 tracking-tight leading-[1.08]">
          Literary Excellence & Critical Thinking
        </h1>
        <h2 className="text-2xl font-medium mb-4 leading-[1.1]">
          Professional Course Management Platform
        </h2>
        <p className="text-[15px] max-w-[600px] mx-auto mb-[30px] leading-[1.5]">
          Transform your educational content into structured, engaging courses with our comprehensive 
          course building tools, content management system, and student tracking features.
        </p>
        
        <div className="flex justify-center gap-[35px]">
          {user ? (
            <>
              <Link href="/admin" className="text-[#2997ff] text-lg flex items-center no-underline hover:text-[#0071e3]">
                Go to Dashboard
                <span className="ml-1.5">›</span>
              </Link>
              <Link href="/courses" className="text-[#2997ff] text-lg flex items-center no-underline hover:text-[#0071e3]">
                Explore Courses
                <span className="ml-1.5">›</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/courses" className="text-[#2997ff] text-lg flex items-center no-underline hover:text-[#0071e3]">
                Explore Courses
                <span className="ml-1.5">›</span>
              </Link>
              <Link href="/login" className="text-[#2997ff] text-lg flex items-center no-underline hover:text-[#0071e3]">
                Enroll Now
                <span className="ml-1.5">›</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Product Grid - IGPS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mx-auto max-w-[1200px] px-2.5 w-full">
        <div className="bg-[#edf2f7] text-center py-[60px] px-5 rounded-[18px] shadow-lg">
          <h3 className="text-[34px] font-bold mb-1 text-[#1d1d1f] leading-[1.07]">
            Our Teaching Philosophy
          </h3>
          <h4 className="text-lg font-medium mb-3 text-[#1d1d1f] leading-[1.23536]">
            Literature-Based Learning
          </h4>
          <p className="px-5 text-[15px] text-[#1d1d1f] leading-[1.5]">
            We believe in the power of classic and contemporary literature to develop critical thinking skills. 
            Through careful analysis of timeless works, students learn to form thoughtful perspectives on complex human experiences.
          </p>
          <div className="flex justify-center gap-[30px] mt-5">
            <Link href="/courses" className="text-[#2997ff] text-[15px] flex items-center no-underline hover:text-[#0071e3]">
              Learning Approach
              <span className="ml-1.5">›</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-[#e6fffa] text-center py-[60px] px-5 rounded-[18px] shadow-lg">
          <h3 className="text-[34px] font-bold mb-1 text-[#1d1d1f] leading-[1.07]">
            Structured Writing Method
          </h3>
          <h4 className="text-lg font-medium mb-3 text-[#1d1d1f] leading-[1.23536]">
            The 5/5/5 Framework
          </h4>
          <p className="px-5 text-[15px] text-[#1d1d1f] leading-[1.5]">
            Our structured writing methodology provides students with clear frameworks for expressing complex ideas. 
            With deliberate practice and consistent feedback, students develop the ability to communicate with clarity and precision.
          </p>
          <div className="flex justify-center gap-[30px] mt-5">
            <Link href="/courses" className="text-[#2997ff] text-[15px] flex items-center no-underline hover:text-[#0071e3]">
              Writing Approach
              <span className="ml-1.5">›</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Highlight Section - IGPS Style */}
      <section className="bg-[#f1f5f9] py-20 px-5 my-2.5 text-center">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-[28px] font-bold mb-3 text-[#1d1d1f] leading-[1.125]">
            Why Choose GRAMMATICOS PLATFORM SOLUTION?
          </h2>
          <p className="text-[15px] mb-5 text-[#1d1d1f] leading-[1.5]">
            Our structured curriculum builds critical analysis skills through comprehensive course management tools.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-10">
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[#0071e3] mb-2.5 leading-none">
                3000+
              </div>
              <p className="text-sm text-[#1d1d1f]">Courses & Materials</p>
            </div>
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[#0071e3] mb-2.5 leading-none">
                500+
              </div>
              <p className="text-sm text-[#1d1d1f]">Active Educators</p>
            </div>
            <div className="p-5">
              <div className="text-[40px] font-semibold text-[#0071e3] mb-2.5 leading-none">
                30+
              </div>
              <p className="text-sm text-[#1d1d1f]">Teaching Methods</p>
            </div>
          </div>
          
          <Link href="/courses" className="inline-block bg-[#0071e3] text-white px-[22px] py-3 rounded-full text-[15px] font-normal mt-[15px] transition-all duration-300 hover:bg-[#0077ed] no-underline">
            Discover our methodology
          </Link>
        </div>
      </section>

      {/* Courses Section - IGPS Style */}
      <section className="text-center py-[60px] px-5 bg-gray-50">
        <h2 className="text-[32px] font-bold mb-3 text-[#1d1d1f] leading-[1.125]">
          Featured Courses & Programs
        </h2>
        <p className="text-[17px] mb-8 text-[#1d1d1f] leading-[1.5] max-w-[600px] mx-auto">
          Explore our meticulously structured educational programs designed to elevate your literary excellence
        </p>
        
        {coursesLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071e3]"></div>
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-10 mx-auto max-w-[1200px] px-5">
            {featuredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} featured={index === 0} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-10 mx-auto max-w-[1200px] px-5">
            {/* Course Card 1 */}
            <div className="bg-white rounded-[18px] overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="w-full h-[180px] bg-gray-300 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-gray-500" />
              </div>
              <div className="p-5">
                <span className="inline-block bg-[#f3f3f3] text-[#1d1d1f] px-2.5 py-1 rounded-xl text-xs font-medium uppercase tracking-wider mb-2.5">
                  Foundation
                </span>
                <h3 className="text-base font-medium mb-2 text-[#1d1d1f] leading-[1.25]">
                  Reading & Writing Fundamentals
                </h3>
                <p className="text-[13px] text-[#86868b] mb-[15px] leading-[1.5]">
                  30-week comprehensive foundation course for developing critical analysis and structured writing skills.
                </p>
                <Link href="/courses" className="inline-block bg-[#0071e3] text-white px-3.5 py-1.5 rounded-full text-sm font-normal transition-all duration-300 hover:bg-[#0077ed] no-underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="bg-white rounded-[18px] overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="w-full h-[180px] bg-gray-300 flex items-center justify-center">
                <FileText className="h-16 w-16 text-gray-500" />
              </div>
              <div className="p-5">
                <span className="inline-block bg-[#f3f3f3] text-[#1d1d1f] px-2.5 py-1 rounded-xl text-xs font-medium uppercase tracking-wider mb-2.5">
                  Advanced
                </span>
                <h3 className="text-base font-medium mb-2 text-[#1d1d1f] leading-[1.25]">
                  Literature Analysis
                </h3>
                <p className="text-[13px] text-[#86868b] mb-[15px] leading-[1.5]">
                  College preparation with focus on complex literary works and research-based criticism.
                </p>
                <Link href="/courses" className="inline-block bg-[#0071e3] text-white px-3.5 py-1.5 rounded-full text-sm font-normal transition-all duration-300 hover:bg-[#0077ed] no-underline">
                  Learn More
                </Link>
              </div>
            </div>

            {/* Course Card 3 */}
            <div className="bg-white rounded-[18px] overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="w-full h-[180px] bg-gray-300 flex items-center justify-center">
                <Globe className="h-16 w-16 text-gray-500" />
              </div>
              <div className="p-5">
                <span className="inline-block bg-[#f3f3f3] text-[#1d1d1f] px-2.5 py-1 rounded-xl text-xs font-medium uppercase tracking-wider mb-2.5">
                  Specialized
                </span>
                <h3 className="text-base font-medium mb-2 text-[#1d1d1f] leading-[1.25]">
                  Test Preparation
                </h3>
                <p className="text-[13px] text-[#86868b] mb-[15px] leading-[1.5]">
                  Targeted preparation for standardized tests with proven strategies and practice materials.
                </p>
                <Link href="/courses" className="inline-block bg-[#0071e3] text-white px-3.5 py-1.5 rounded-full text-sm font-normal transition-all duration-300 hover:bg-[#0077ed] no-underline">
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link href="/courses" className="inline-block bg-[#0071e3] text-white px-[22px] py-3 rounded-full text-[15px] font-normal transition-all duration-300 hover:bg-[#0077ed] no-underline">
            View More Courses
          </Link>
        </div>
      </section>

      {/* CTA Section - IGPS Style */}
      <section className="bg-[#2d3748] text-white text-center py-[100px] px-5">
        <h2 className="text-[28px] font-bold mb-3 leading-[1.125]">
          Elevate Your Teaching & Learning Experience
        </h2>
        <p className="text-[15px] max-w-[600px] my-5 mx-auto leading-[1.5]">
          Join our comprehensive course building platform featuring advanced content management, 
          structured curriculum design, and proven methodologies to prepare for educational success.
        </p>
        <Link href={user ? "/admin" : "/login"} className="inline-block bg-white text-[#2d3748] px-[22px] py-3 rounded-full text-[15px] font-normal mt-[30px] transition-all duration-300 hover:bg-gray-100 no-underline">
          Start Building Courses
        </Link>
      </section>
    </>
  );
}