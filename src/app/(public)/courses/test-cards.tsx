'use client';

import { Book, Target, Calendar, CheckCircle, Users, Award, BookOpen } from 'lucide-react';

// Test course data
const testCourse = {
  id: '1',
  title: 'Advanced Literary Analysis',
  description: 'Master the art of literary analysis through close reading techniques and critical thinking. This comprehensive course covers various genres and time periods.',
  difficulty: 'advanced',
  category: { id: '1', name: 'Reading & Writing' },
  enrollment_count: 234,
  rating: '4.8',
  instructor_name: 'Dr. Sarah Johnson',
  course_books: [1, 2, 3, 4, 5],
  course_objectives: [
    { id: '1', objective: { title: 'Analyze complex literary texts' } },
    { id: '2', objective: { title: 'Develop critical thinking skills' } },
    { id: '3', objective: { title: 'Write comprehensive literary essays' } },
    { id: '4', objective: { title: 'Understand historical context' } }
  ],
  schedules: [1, 2]
};

export default function TestCards() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Course Card Test</h1>
      
      <div className="max-w-3xl mx-auto">
        <CourseCard course={testCourse} />
      </div>
    </div>
  );
}

// Course Card Component
function CourseCard({ course }: { course: any }) {
  const difficultyColors: Record<string, string> = {
    'beginner': 'bg-green-100 text-green-800',
    'intermediate': 'bg-yellow-100 text-yellow-800',
    'advanced': 'bg-orange-100 text-orange-800',
    'expert': 'bg-red-100 text-red-800',
  };

  const difficultyLabels: Record<string, string> = {
    'beginner': 'Level 1',
    'intermediate': 'Level 2',
    'advanced': 'Level 3',
    'expert': 'Level 4',
  };

  // Extract key metrics from the course
  const getKeyMetrics = () => {
    const metrics = [];
    
    // Count books
    const bookCount = course.course_books?.length || 0;
    if (bookCount > 0) {
      metrics.push({ icon: Book, value: bookCount, label: 'Books' });
    }

    // Count objectives
    const objectiveCount = course.course_objectives?.length || 0;
    if (objectiveCount > 0) {
      metrics.push({ icon: Target, value: objectiveCount, label: 'Objectives' });
    }

    // Count schedules
    const scheduleCount = course.schedules?.length || 0;
    if (scheduleCount > 0) {
      metrics.push({ icon: Calendar, value: scheduleCount, label: 'Schedules' });
    }

    // Add enrollment if available
    if (course.enrollment_count) {
      metrics.push({ icon: Users, value: course.enrollment_count, label: 'Students' });
    }

    return metrics;
  };

  const metrics = getKeyMetrics();
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                {course.category && (
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {course.category.name}
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">
                  {course.title}
                </h3>
              </div>
            </div>
          </div>
          
          {course.difficulty && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-800'
            }`}>
              {difficultyLabels[course.difficulty] || course.difficulty}
            </span>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-3">
            {course.description}
          </p>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 rounded-lg mb-2">
                <metric.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Course Highlights */}
        {course.course_objectives && course.course_objectives.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">What You'll Learn</h4>
            <ul className="space-y-2">
              {course.course_objectives.slice(0, 3).map((objective: any, index: number) => (
                <li key={objective.id} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">
                    {objective.objective?.title || `Objective ${index + 1}`}
                  </span>
                </li>
              ))}
            </ul>
            {course.course_objectives.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                +{course.course_objectives.length - 3} more learning objectives
              </p>
            )}
          </div>
        )}

        {/* Instructor & Rating */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {course.instructor_name && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Instructor</p>
                  <p className="text-sm font-medium text-gray-900">{course.instructor_name}</p>
                </div>
              </div>
            )}
            
            {course.rating && (
              <div className="flex items-center gap-1">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-gray-900">{course.rating}</span>
              </div>
            )}
          </div>
          
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            <span>Explore Course</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}