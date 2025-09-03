'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Users, Plus, X } from 'lucide-react';
import { getUsersByRole, getUserGroups, bulkEnrollUsers } from '@/lib/supabase/user-management';
import { courseService } from '@/lib/supabase/courses';
import type { UserProfile, UserGroup } from '@/types/user-management';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  id: string;
  name?: string;
  title?: string;
  description?: string;
}

export default function EnrollmentManager() {
  const { user } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load students
      const { data: studentsData } = await getUsersByRole('student');
      setStudents(studentsData || []);

      // Load courses
      const coursesData = await courseService.getCourses();
      setCourses(coursesData || []);

      // Load groups
      const { data: groupsData } = await getUserGroups();
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user || selectedStudents.length === 0 || selectedCourses.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one student and one course' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await bulkEnrollUsers({
        user_ids: selectedStudents,
        course_ids: selectedCourses,
        enrolled_by: user.id,
        group_id: selectedGroup || undefined
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: `Successfully enrolled ${selectedStudents.length} students in ${selectedCourses.length} courses` 
      });

      // Reset selections
      setSelectedStudents([]);
      setSelectedCourses([]);
      setSelectedGroup('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to enroll students' });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Course Enrollment</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Students Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Select Students ({selectedStudents.length})
          </h3>
          
          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Students</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.code})
              </option>
            ))}
          </select>

          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {students
              .filter(student => !selectedGroup || groups.find(g => g.id === selectedGroup))
              .map(student => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-gray-500">
                      Grade {student.grade_level || 'N/A'}
                    </p>
                  </div>
                </label>
              ))}
          </div>
        </div>

        {/* Courses Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Select Courses ({selectedCourses.length})
          </h3>
          
          <div className="border border-gray-200 rounded-lg max-h-[440px] overflow-y-auto">
            {courses.map(course => (
              <label
                key={course.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{course.name || course.title || 'Untitled Course'}</p>
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {course.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            setSelectedStudents([]);
            setSelectedCourses([]);
            setSelectedGroup('');
          }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Clear Selection
        </button>
        <button
          onClick={handleEnroll}
          disabled={loading || selectedStudents.length === 0 || selectedCourses.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enrolling...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Enroll Students
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Add this import to the file that needs BookOpen
import { BookOpen } from 'lucide-react';