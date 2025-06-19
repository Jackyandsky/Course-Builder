'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Book, Bookmark, Calendar, Clock, Target, Settings, FileText,
  CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import { Course } from '@/types/database';
import { AccordionSection } from '@/components/ui/AccordionSection';
import { QuickNavigation } from './QuickNavigation';
import { Card, Badge, RichTextDisplay } from '@/components/ui';
import { 
  CourseBookManager, 
  CourseVocabularyManager, 
  CourseScheduleList,
  CourseLessonsWithSchedules,
  CourseObjectiveManager,
  CourseMethodManager,
  CourseTaskManager
} from '@/components/relationships';
import { cn } from '@/lib/utils';

interface AccordionCourseViewProps {
  course: Course;
  courseId: string;
  onUpdate: () => void;
  onShare: () => void;
}

const difficultyColors = {
  beginner: 'info',
  intermediate: 'warning',
  advanced: 'danger',
  expert: 'primary',
} as const;

const difficultyLabels = {
  beginner: 'Level 1',
  intermediate: 'Level 2',
  advanced: 'Level 3',
  expert: 'Level 4',
} as const;

export function AccordionCourseView({ 
  course, 
  courseId, 
  onUpdate,
  onShare 
}: AccordionCourseViewProps) {
  // Get storage key for this specific course
  const storageKey = `course-accordion-${courseId}`;
  
  // Initialize expanded sections from localStorage or default to overview
  const getInitialState = (): { expandedSections: Set<string>; activeSection: string } => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            expandedSections: new Set<string>(parsed.expandedSections || ['overview']),
            activeSection: parsed.activeSection || 'overview'
          };
        }
      } catch (error) {
        console.warn('Failed to parse stored accordion state:', error);
      }
    }
    return {
      expandedSections: new Set<string>(['overview']),
      activeSection: 'overview'
    };
  };

  const initialState = getInitialState();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(initialState.expandedSections);
  const [activeSection, setActiveSection] = useState<string>(initialState.activeSection);
  
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Save state to localStorage whenever expandedSections or activeSection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stateToSave = {
          expandedSections: Array.from(expandedSections),
          activeSection: activeSection,
          lastAccessed: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save accordion state:', error);
      }
    }
  }, [expandedSections, activeSection, storageKey]);

  // Clean up old localStorage entries on mount (older than 30 days)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('course-accordion-')) {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.lastAccessed && parsed.lastAccessed < thirtyDaysAgo) {
                keysToRemove.push(key);
              }
            }
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clean up old accordion states:', error);
      }
    }
  }, []); // Only run once on mount

  const accordionSections = [
    { id: 'overview', label: 'Overview', icon: <Book className="h-4 w-4" /> },
    { id: 'objectives', label: 'Objectives', icon: <Target className="h-4 w-4" /> },
    { id: 'methods', label: 'Methods', icon: <Settings className="h-4 w-4" /> },
    { id: 'schedules', label: 'Schedules', icon: <Calendar className="h-4 w-4" /> },
    { id: 'lessons', label: 'Lessons', icon: <Clock className="h-4 w-4" /> },
    { id: 'books', label: 'Books', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'vocabulary', label: 'Vocabulary', icon: <FileText className="h-4 w-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <FileText className="h-4 w-4" /> },
  ];

  const handleSectionToggle = (sectionId: string, expanded: boolean) => {
    const newExpanded = new Set(expandedSections);
    if (expanded) {
      newExpanded.add(sectionId);
      setActiveSection(sectionId); // Set as active when expanding
    } else {
      newExpanded.delete(sectionId);
      // If collapsing the active section, set active to the first expanded section
      if (sectionId === activeSection) {
        const remainingExpanded = Array.from(newExpanded);
        setActiveSection(remainingExpanded[0] || 'overview');
      }
    }
    setExpandedSections(newExpanded);
  };

  const handleNavigateToSection = (sectionId: string) => {
    // Set as active section
    setActiveSection(sectionId);
    
    // Expand the section if not already expanded
    const newExpanded = new Set(expandedSections);
    newExpanded.add(sectionId);
    setExpandedSections(newExpanded);

    // Scroll to section after a brief delay to allow expansion
    setTimeout(() => {
      sectionRefs.current[sectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Quick Navigation */}
      <div className="sticky top-4 z-10">
        <Card className="p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Quick Navigation
              {typeof window !== 'undefined' && (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  Auto-saved
                </span>
              )}
            </h3>
            <QuickNavigation
              items={accordionSections}
              activeSection={activeSection}
              onNavigate={handleNavigateToSection}
            />
          </div>
        </Card>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Overview Section */}
        <div ref={(el) => { sectionRefs.current['overview'] = el; }}>
          <AccordionSection
            id="overview"
            title="Overview"
            icon={<Book className="h-5 w-5" />}
            isExpanded={expandedSections.has('overview')}
            onToggle={handleSectionToggle}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Description</h4>
                  {course.description ? (
                    <RichTextDisplay 
                      content={course.description} 
                      size="sm"
                      className="max-w-none"
                    />
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>

                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5" />
                      Prerequisites
                    </h4>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span className="text-sm">{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Course Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Course Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Difficulty:</span>
                      <Badge variant={difficultyColors[course.difficulty]} size="sm">
                        {difficultyLabels[course.difficulty]}
                      </Badge>
                    </div>
                    
                    {course.duration_hours && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Duration:</span>
                        <span>{course.duration_hours} hours</span>
                      </div>
                    )}
                    
                    {course.category && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Category:</span>
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: course.category.color ? `${course.category.color}20` : undefined,
                            color: course.category.color || undefined,
                          }}
                        >
                          {course.category.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Course Information</h4>
                    <button
                      onClick={onShare}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors px-2 py-1 rounded text-sm"
                      title="Share course publicly"
                    >
                      <span>Share</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="font-medium">
                        {new Date(course.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="font-medium">
                        {new Date(course.updated_at).toLocaleDateString()}
                      </dd>
                    </div>
                    {course.published_at && (
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">Published</dt>
                        <dd className="font-medium">
                          {new Date(course.published_at).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* Objectives Section */}
        <div ref={(el) => { sectionRefs.current['objectives'] = el; }}>
          <AccordionSection
            id="objectives"
            title="Objectives"
            icon={<Target className="h-5 w-5" />}
            isExpanded={expandedSections.has('objectives')}
            onToggle={handleSectionToggle}
          >
            <CourseObjectiveManager courseId={courseId} onUpdate={onUpdate} />
          </AccordionSection>
        </div>

        {/* Methods Section */}
        <div ref={(el) => { sectionRefs.current['methods'] = el; }}>
          <AccordionSection
            id="methods"
            title="Methods"
            icon={<Settings className="h-5 w-5" />}
            isExpanded={expandedSections.has('methods')}
            onToggle={handleSectionToggle}
          >
            <CourseMethodManager courseId={courseId} onUpdate={onUpdate} />
          </AccordionSection>
        </div>

        {/* Schedules Section */}
        <div ref={(el) => { sectionRefs.current['schedules'] = el; }}>
          <AccordionSection
            id="schedules"
            title="Schedules"
            icon={<Calendar className="h-5 w-5" />}
            isExpanded={expandedSections.has('schedules')}
            onToggle={handleSectionToggle}
          >
            <CourseScheduleList courseId={courseId} />
          </AccordionSection>
        </div>

        {/* Lessons Section */}
        <div ref={(el) => { sectionRefs.current['lessons'] = el; }}>
          <AccordionSection
            id="lessons"
            title="Lessons"
            icon={<Clock className="h-5 w-5" />}
            isExpanded={expandedSections.has('lessons')}
            onToggle={handleSectionToggle}
          >
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a schedule to view and manage its lessons. Lessons are automatically created from course schedules.
              </p>
            </div>
            <CourseLessonsWithSchedules courseId={courseId} />
          </AccordionSection>
        </div>

        {/* Books Section */}
        <div ref={(el) => { sectionRefs.current['books'] = el; }}>
          <AccordionSection
            id="books"
            title="Books"
            icon={<Bookmark className="h-5 w-5" />}
            isExpanded={expandedSections.has('books')}
            onToggle={handleSectionToggle}
          >
            <CourseBookManager courseId={courseId} onUpdate={onUpdate} />
          </AccordionSection>
        </div>

        {/* Vocabulary Section */}
        <div ref={(el) => { sectionRefs.current['vocabulary'] = el; }}>
          <AccordionSection
            id="vocabulary"
            title="Vocabulary"
            icon={<FileText className="h-5 w-5" />}
            isExpanded={expandedSections.has('vocabulary')}
            onToggle={handleSectionToggle}
          >
            <CourseVocabularyManager courseId={courseId} onUpdate={onUpdate} />
          </AccordionSection>
        </div>

        {/* Tasks Section */}
        <div ref={(el) => { sectionRefs.current['tasks'] = el; }}>
          <AccordionSection
            id="tasks"
            title="Tasks"
            icon={<FileText className="h-5 w-5" />}
            isExpanded={expandedSections.has('tasks')}
            onToggle={handleSectionToggle}
          >
            <CourseTaskManager courseId={courseId} onUpdate={onUpdate} />
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}