'use client';

import Link from 'next/link';
import { Clock, BookOpen, Target, Calendar, Lightbulb, ChevronRight, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    name?: string;
    description?: string;
    short_description?: string;
    instructor_name?: string;
    duration?: string;
    duration_hours?: number;
    difficulty?: string;
    level?: string;
    category?: {
      id: string;
      name: string;
    } | string;
    course_books?: any[];
    course_objectives?: any[];
    course_methods?: any[];
    schedules?: any[];
  };
  featured?: boolean;
}

// Tooltip Component with wider popup
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
          <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 w-80 max-w-none">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-gray-900"></div>
            </div>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseCard({ course, featured = false }: CourseCardProps) {
  const courseTitle = course.title || course.name || 'Untitled Course';
  const courseCategory = typeof course.category === 'string' ? course.category : course.category?.name;
  const courseDifficulty = course.difficulty || course.level;
  
  // Get actual counts
  const bookCount = course.course_books?.length || 0;
  const objectiveCount = course.course_objectives?.length || 0;
  const methodCount = course.course_methods?.length || 0;
  const scheduleCount = course.schedules?.length || 0;

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault();
    // Add enrollment logic here
    console.log('Enrolling in course:', course.id);
  };

  if (featured) {
    return (
      <div className="group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 overflow-hidden col-span-1 lg:col-span-2">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              {courseCategory && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                  {courseCategory}
                </span>
              )}
              {courseDifficulty && (
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                  {courseDifficulty}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {courseTitle}
            </h3>
            {course.description && (
              <p className="text-gray-600 mt-3 line-clamp-2 text-lg">{course.description}</p>
            )}
          </div>

          {/* Course Content Grid with Hover Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Books */}
            <Tooltip content={
              <div className="max-h-96 overflow-y-auto">
                <p className="font-semibold mb-3 text-lg">Required Books ({bookCount})</p>
                {course.course_books && course.course_books.length > 0 ? (
                  <div>
                    <ul className="space-y-2">
                      {course.course_books.slice(0, 15).map((book: any, index: number) => (
                        <li key={book.id || index} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium">{book.book?.title || `Book ${index + 1}`}</p>
                            {book.book?.author && <p className="text-sm text-gray-400">by {book.book.author}</p>}
                            {book.is_required && <span className="text-xs text-yellow-400 inline-block mt-1">Required</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {course.course_books.length > 15 && (
                      <p className="text-sm text-gray-400 mt-3 font-medium">
                        ...and {course.course_books.length - 15} more books
                      </p>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-300">
                        Total: <span className="font-bold text-white">{bookCount}</span> books
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No books added yet</p>
                )}
              </div>
            }>
              <div className="bg-gray-50 rounded-lg p-5 hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{bookCount}</span>
                </div>
                <p className="text-sm text-gray-600">Required Books</p>
                <p className="text-xs text-gray-500 mt-1">
                  {bookCount > 10 ? `${bookCount} books (extensive reading)` : bookCount > 0 ? 'Click for details' : 'No books yet'}
                </p>
              </div>
            </Tooltip>

            {/* Objectives */}
            <Tooltip content={
              <div className="max-h-96 overflow-y-auto">
                <p className="font-semibold mb-3 text-lg">Learning Objectives ({objectiveCount})</p>
                {course.course_objectives && course.course_objectives.length > 0 ? (
                  <div>
                    <ul className="space-y-2">
                      {course.course_objectives.map((obj: any, index: number) => (
                        <li key={obj.id || index} className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                          <p className="flex-1">{obj.objective?.title || obj.objective_text || `Objective ${index + 1}`}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-300">
                        Total: <span className="font-bold text-white">{objectiveCount}</span> objectives
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No objectives defined yet</p>
                )}
              </div>
            }>
              <div className="bg-gray-50 rounded-lg p-5 hover:bg-green-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-6 w-6 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{objectiveCount}</span>
                </div>
                <p className="text-sm text-gray-600">Learning Goals</p>
                <p className="text-xs text-gray-500 mt-1">{objectiveCount > 0 ? 'View all objectives' : 'No objectives yet'}</p>
              </div>
            </Tooltip>

            {/* Methods */}
            <Tooltip content={
              <div>
                <p className="font-semibold mb-3 text-lg">Teaching Methods</p>
                {course.course_methods && course.course_methods.length > 0 ? (
                  <div>
                    <ul className="space-y-2">
                      {course.course_methods.map((method: any, index: number) => (
                        <li key={method.id || index}>
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-purple-400">◆</span>
                            {method.method?.name || `Method ${index + 1}`}
                          </p>
                          {method.method?.description && (
                            <p className="text-sm text-gray-400 ml-6 mt-1">{method.method.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-400 mt-3">Total: {methodCount} methods</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No methods specified yet</p>
                )}
              </div>
            }>
              <div className="bg-gray-50 rounded-lg p-5 hover:bg-purple-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{methodCount}</span>
                </div>
                <p className="text-sm text-gray-600">Teaching Methods</p>
                <p className="text-xs text-gray-500 mt-1">{methodCount > 0 ? 'See methodologies' : 'No methods yet'}</p>
              </div>
            </Tooltip>

            {/* Schedules */}
            <Tooltip content={
              <div>
                <p className="font-semibold mb-3 text-lg">Course Schedules</p>
                {course.schedules && course.schedules.length > 0 ? (
                  <div>
                    <ul className="space-y-2">
                      {course.schedules.map((schedule: any, index: number) => (
                        <li key={schedule.id || index}>
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-orange-400">📅</span>
                            {schedule.name || `Schedule ${index + 1}`}
                          </p>
                          {schedule.start_date && (
                            <p className="text-sm text-gray-400 ml-6">
                              Starts: {new Date(schedule.start_date).toLocaleDateString()}
                            </p>
                          )}
                          {schedule.recurrence_type && (
                            <p className="text-sm text-gray-400 ml-6">
                              Type: {schedule.recurrence_type}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-400 mt-3">Total: {scheduleCount} schedules</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No schedules created yet</p>
                )}
              </div>
            }>
              <div className="bg-gray-50 rounded-lg p-5 hover:bg-orange-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-6 w-6 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">{scheduleCount}</span>
                </div>
                <p className="text-sm text-gray-600">Course Schedules</p>
                <p className="text-xs text-gray-500 mt-1">{scheduleCount > 0 ? 'View schedules' : 'No schedules yet'}</p>
              </div>
            </Tooltip>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-6">
              {course.instructor_name && (
                <div>
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="font-medium text-gray-900">{course.instructor_name}</p>
                </div>
              )}
              {course.duration_hours && (
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{course.duration_hours} hours</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEnroll}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 font-medium shadow-sm hover:shadow-md"
              >
                <UserPlus className="h-4 w-4" />
                Enroll Now
              </button>
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 font-medium"
              >
                View Details
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular Card
  return (
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            {courseCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                {courseCategory}
              </span>
            )}
            {courseDifficulty && (
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                {courseDifficulty}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {courseTitle}
          </h3>
        </div>

        {/* Quick Stats with Hover */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Books */}
          <Tooltip content={
            <div className="w-full max-h-80 overflow-y-auto">
              <p className="font-semibold mb-2">Required Books ({bookCount})</p>
              {course.course_books && course.course_books.length > 0 ? (
                <div>
                  <ul className="space-y-1.5">
                    {course.course_books.slice(0, 10).map((book: any, index: number) => (
                      <li key={book.id || index} className="text-sm flex items-start gap-2">
                        <span className="text-blue-400 flex-shrink-0">{index + 1}.</span>
                        <div className="flex-1">
                          <span>{book.book?.title || `Book ${index + 1}`}</span>
                          {book.book?.author && <span className="text-gray-400 text-xs block">by {book.book.author}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {course.course_books.length > 10 && (
                    <p className="text-sm text-gray-400 mt-3 pt-2 border-t border-gray-700">
                      <strong>+{course.course_books.length - 10} more books</strong> (Total: {bookCount})
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No books yet</p>
              )}
            </div>
          }>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors cursor-pointer">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{bookCount}</span>
              <span className="text-sm text-gray-600">
                {bookCount === 1 ? 'Book' : 'Books'}
              </span>
            </div>
          </Tooltip>

          {/* Objectives */}
          <Tooltip content={
            <div className="w-full">
              <p className="font-semibold mb-2">Learning Objectives</p>
              {course.course_objectives && course.course_objectives.length > 0 ? (
                <div>
                  <ul className="space-y-1.5">
                    {course.course_objectives.slice(0, 5).map((obj: any, index: number) => (
                      <li key={obj.id || index} className="text-sm">
                        <span className="text-green-400">✓</span> {obj.objective?.title || obj.objective_text || 'Goal ' + (index + 1)}
                      </li>
                    ))}
                  </ul>
                  {course.course_objectives.length > 5 && (
                    <p className="text-sm text-gray-400 mt-2">+{course.course_objectives.length - 5} more objectives</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No objectives yet</p>
              )}
            </div>
          }>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded hover:bg-green-50 transition-colors cursor-pointer">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">{objectiveCount}</span>
              <span className="text-sm text-gray-600">Goals</span>
            </div>
          </Tooltip>

          {/* Methods */}
          <Tooltip content={
            <div className="w-full">
              <p className="font-semibold mb-2">Teaching Methods</p>
              {course.course_methods && course.course_methods.length > 0 ? (
                <div>
                  <ul className="space-y-1.5">
                    {course.course_methods.slice(0, 5).map((method: any, index: number) => (
                      <li key={method.id || index} className="text-sm">
                        <span className="text-purple-400">◆</span> {method.method?.name || 'Method ' + (index + 1)}
                      </li>
                    ))}
                  </ul>
                  {course.course_methods.length > 5 && (
                    <p className="text-sm text-gray-400 mt-2">+{course.course_methods.length - 5} more methods</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No methods yet</p>
              )}
            </div>
          }>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded hover:bg-purple-50 transition-colors cursor-pointer">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">{methodCount}</span>
              <span className="text-sm text-gray-600">Methods</span>
            </div>
          </Tooltip>

          {/* Schedules */}
          <Tooltip content={
            <div className="w-full">
              <p className="font-semibold mb-2">Course Schedules</p>
              {course.schedules && course.schedules.length > 0 ? (
                <div>
                  <ul className="space-y-1.5">
                    {course.schedules.slice(0, 5).map((schedule: any, index: number) => (
                      <li key={schedule.id || index} className="text-sm">
                        <span className="text-orange-400">📅</span> {schedule.name || 'Schedule ' + (index + 1)}
                      </li>
                    ))}
                  </ul>
                  {course.schedules.length > 5 && (
                    <p className="text-sm text-gray-400 mt-2">+{course.schedules.length - 5} more schedules</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No schedules yet</p>
              )}
            </div>
          }>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded hover:bg-orange-50 transition-colors cursor-pointer">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-900">{scheduleCount}</span>
              <span className="text-sm text-gray-600">Schedules</span>
            </div>
          </Tooltip>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
            {course.description}
          </p>
        )}

        {/* Footer */}
        <div className="space-y-3 mt-auto">
          {/* Instructor and Duration */}
          <div className="flex items-center justify-between text-sm">
            {course.instructor_name && (
              <span className="text-gray-600">
                by <strong>{course.instructor_name}</strong>
              </span>
            )}
            {course.duration_hours && (
              <span className="text-gray-600">
                <Clock className="h-3 w-3 inline mr-1" />
                {course.duration_hours}h
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t">
            <button
              onClick={handleEnroll}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Enroll
            </button>
            <Link
              href={`/courses/${course.id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg transition-all duration-300 font-medium text-sm"
            >
              Details
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}