'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Globe, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import CourseCard from '@/components/courses/CourseCard';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      // Use fetch instead of direct Supabase client to avoid auth issues
      const response = await fetch('/api/public/courses?limit=3');
      
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();

      const enrichedCourses = data?.map((course: any) => ({
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

  // Log auth state for debugging
  useEffect(() => {
    console.log('[HomePage] Auth state changed:', {
      user: user?.email || 'null',
      loading: authLoading,
      hasUser: !!user
    });
  }, [user, authLoading]);

  return (
    <>
      {/* Hero Section - IGPS Style */}
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
        
        <div className="flex justify-center gap-[35px]">
          {!authLoading && user ? (
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
          ) : !authLoading ? (
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
          ) : (
            // Show courses link while loading
            <Link href="/courses" className="text-[var(--igps-landing-link-color)] text-[18px] flex items-center no-underline hover:text-[var(--igps-landing-btn-color)]" style={{ fontWeight: 400 }}>
              Explore Courses
              <span className="ml-[5px]">›</span>
            </Link>
          )}
        </div>
      </section>

      {/* Product Grid - IGPS Style */}
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

      {/* Highlight Section - IGPS Style */}
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

      {/* Featured Literature Courses Section - New IGPS Style */}
      <section className="py-[80px] px-5 bg-white" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <div className="max-w-[1240px] mx-auto">
          <h2 className="text-[32px] font-bold mb-3 text-center text-[var(--igps-landing-text-color)] leading-[1.125]" style={{ fontWeight: 700 }}>
            Featured Literature Courses
          </h2>
          <p className="text-[16px] mb-10 text-center text-[#86868b] leading-[1.5] max-w-[700px] mx-auto" style={{ fontWeight: 400 }}>
            Explore our meticulously structured reading and writing programs
          </p>
          
          {coursesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071e3]"></div>
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredCourses.slice(0, 3).map((course, index) => (
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
                    {course.description || 'Dive into classic and contemporary works while developing structured writing skills through our 5/5/5 methodology. Students will engage with a diverse range of influential novels and plays, exploring themes such as mental health, societal critique, race relations, the impacts of war, existentialism, and the complexities of the American experience...'}
                  </p>
                  
                  {/* Core Learning Objectives */}
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
                              {obj.objective?.title || obj.objective_text || `Develop critical analysis of literary works`}
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
                    href={`/courses/${course.id}`}
                    className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                  >
                    Learn More →
                  </Link>
                </div>
              ))}
              
              {/* Additional static course cards if fewer than 3 courses */}
              {featuredCourses.length < 3 && (
                <>
                  {featuredCourses.length === 1 && (
                    <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
                      <div className="mb-3">
                        <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                          High School
                        </span>
                        <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
                          Advanced Literature Analysis
                        </h3>
                        <p className="text-[13px] text-[#86868b]">
                          College preparation • 30 sessions • Advanced level
                        </p>
                      </div>
                      
                      <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
                        Critical analysis of complex literary works focusing on themes, character development, and historical context through essay-based assessments. This advanced course prepares students for college-level literary analysis through intensive reading and writing practice. Students will explore canonical and contemporary texts, developing sophisticated analytical skills and academic writing proficiency...
                      </p>
                      
                      <div className="mb-4">
                        <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
                          Course Highlights:
                        </p>
                        <ul className="space-y-1.5">
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              Weekly assessments modeled on college exams
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              In-depth character and narrative analysis
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              Research-based literary criticism
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      <Link 
                        href="/courses"
                        className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                      >
                        College Prep →
                      </Link>
                    </div>
                  )}
                  
                  {featuredCourses.length <= 2 && (
                    <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
                      <div className="mb-3">
                        <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                          Advanced
                        </span>
                        <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
                          Shakespeare Studies
                        </h3>
                        <p className="text-[13px] text-[#86868b]">
                          15-week specialized course • Grades 10-12
                        </p>
                      </div>
                      
                      <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
                        Specialized exploration of Shakespearean works with focus on language analysis, thematic development, and historical context. Students will delve into the rich world of Shakespeare's plays and sonnets, examining the intricacies of Elizabethan language, theatrical conventions, and timeless themes. Through close reading and performance analysis, students develop deep appreciation for Shakespeare's literary genius...
                      </p>
                      
                      <div className="mb-4">
                        <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
                          What You'll Learn:
                        </p>
                        <ul className="space-y-1.5">
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              Elizabethan language and theatrical conventions
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              Character analysis through soliloquy and dialogue
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                            <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                              Performance interpretation and staging analysis
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      <Link 
                        href="/courses"
                        className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                      >
                        Learn More →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Static Course Card 1 */}
              <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
                <div className="mb-3">
                  <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    Middle School
                  </span>
                  <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
                    L8-9 Reading & Writing
                  </h3>
                  <p className="text-[13px] text-[#86868b]">
                    30-week comprehensive foundation course
                  </p>
                </div>
                
                <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
                  Dive into classic and contemporary works while developing structured writing skills through our 5/5/5 methodology. This foundational course for students in levels 7-9 is designed to significantly enhance critical reading abilities, analytical thinking, and sophisticated essay writing skills. Through engagement with a diverse range of classic and contemporary literature, including novels, plays, and short stories...
                </p>
                
                <div className="mb-4">
                  <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
                    Core Learning Objectives:
                  </p>
                  <ul className="space-y-1.5">
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
                  </ul>
                </div>
                
                <Link 
                  href="/courses"
                  className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                >
                  Learn More →
                </Link>
              </div>

              {/* Static Course Card 2 */}
              <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
                <div className="mb-3">
                  <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    High School
                  </span>
                  <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
                    Advanced Literature Analysis
                  </h3>
                  <p className="text-[13px] text-[#86868b]">
                    College preparation • 30 sessions • Advanced level
                  </p>
                </div>
                
                <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
                  Critical analysis of complex literary works focusing on themes, character development, and historical context through essay-based assessments. This advanced course prepares students for college-level literary analysis through intensive reading and writing practice. Students will explore canonical and contemporary texts, developing sophisticated analytical skills and academic writing proficiency that will serve them well in higher education...
                </p>
                
                <div className="mb-4">
                  <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
                    Course Highlights:
                  </p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        Weekly assessments modeled on college exams
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        In-depth character and narrative analysis
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        Research-based literary criticism
                      </span>
                    </li>
                  </ul>
                </div>
                
                <Link 
                  href="/courses"
                  className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                >
                  College Prep →
                </Link>
              </div>

              {/* Static Course Card 3 */}
              <div className="bg-white rounded-[16px] border border-[#e5e5e7] p-6 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '420px' }}>
                <div className="mb-3">
                  <span className="inline-block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    Advanced
                  </span>
                  <h3 className="text-[19px] font-bold text-[var(--igps-landing-text-color)] mb-2 leading-[1.2]">
                    Shakespeare Studies
                  </h3>
                  <p className="text-[13px] text-[#86868b]">
                    15-week specialized course • Grades 10-12
                  </p>
                </div>
                
                <p className="text-[14px] text-[var(--igps-landing-text-color)] mb-4 leading-[1.5] line-clamp-5">
                  Specialized exploration of Shakespearean works with focus on language analysis, thematic development, and historical context. Students will delve into the rich world of Shakespeare's plays and sonnets, examining the intricacies of Elizabethan language, theatrical conventions, and timeless themes. Through close reading and performance analysis, students develop deep appreciation for Shakespeare's literary genius and its enduring influence on world literature...
                </p>
                
                <div className="mb-4">
                  <p className="text-[12px] font-semibold text-[var(--igps-landing-text-color)] mb-2 uppercase tracking-wider">
                    What You'll Learn:
                  </p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        Elizabethan language and theatrical conventions
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        Character analysis through soliloquy and dialogue
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#0071e3] mr-2 text-[13px] leading-[1.3]">•</span>
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.3]">
                        Performance interpretation and staging analysis
                      </span>
                    </li>
                  </ul>
                </div>
                
                <Link 
                  href="/courses"
                  className="inline-block text-[#0071e3] text-[14px] font-medium hover:text-[#0077ed] transition-colors mt-auto"
                >
                  Learn More →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - IGPS Style */}
      <section className="bg-[#000] text-[var(--igps-landing-text-color-light)] text-center py-[100px] px-5" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
        <h2 className="text-[28px] font-bold mb-3 leading-[1.125]" style={{ fontWeight: 700 }}>
          Elevate Your Teaching & Learning Experience
        </h2>
        <p className="text-[15px] max-w-[600px] my-5 mx-auto leading-[1.5]" style={{ fontWeight: 400 }}>
          Join our comprehensive course platform featuring advanced content management, 
          structured curriculum design, and proven methodologies to prepare for educational success.
        </p>
        <Link href={!authLoading && user ? "/account" : "/login"} className="inline-block bg-[var(--igps-landing-btn-color)] text-white px-[22px] py-3 rounded-[980px] text-[15px] font-normal mt-[30px] transition-all duration-300 hover:bg-[#0077ed] no-underline" style={{ fontWeight: 400 }}>
          {!authLoading && user ? "Go to Dashboard" : "Start Journey"}
        </Link>
      </section>
    </>
  );
}