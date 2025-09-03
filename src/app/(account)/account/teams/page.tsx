'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  Users, User, Circle, Clock, Video, 
  MessageSquare, Star, Calendar, ChevronRight,
  Zap, TrendingUp, Award
} from 'lucide-react';
import Link from 'next/link';

interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio: string;
  specialties: string[];
  status: 'active' | 'inactive' | 'busy' | 'in_session';
  lastActive?: string;
  rating: number;
  studentsCount: number;
  sessionsCompleted: number;
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  nextAvailable?: string;
}

export default function TeamsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'available'>('all');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTeachers: Teacher[] = [
        {
          id: '1',
          name: 'Dr. Maria Rodriguez',
          email: 'maria.rodriguez@example.com',
          bio: 'Native Spanish speaker with expertise in conversational Spanish and AP Spanish Literature',
          specialties: ['Spanish', 'AP Spanish', 'Latin American Literature'],
          status: 'active',
          lastActive: new Date().toISOString(),
          rating: 4.9,
          studentsCount: 78,
          sessionsCompleted: 142,
          availability: {
            monday: true,
            tuesday: true,
            wednesday: false,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
          },
          nextAvailable: new Date(Date.now() + 3600000).toISOString(),
        },
        {
          id: '2',
          name: 'Prof. Jean-Pierre Dubois',
          email: 'jp.dubois@example.com',
          bio: 'French language instructor specializing in business French and DELF/DALF preparation',
          specialties: ['French', 'Business French', 'DELF/DALF Prep'],
          status: 'in_session',
          lastActive: new Date().toISOString(),
          rating: 4.8,
          studentsCount: 85,
          sessionsCompleted: 135,
          availability: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: false,
            saturday: true,
            sunday: false,
          },
        },
        {
          id: '3',
          name: 'Ms. Li Wei Chen',
          email: 'liwei.chen@example.com',
          bio: 'Mandarin Chinese teacher with focus on HSK preparation and Chinese culture',
          specialties: ['Mandarin Chinese', 'HSK Prep', 'Chinese Culture'],
          status: 'busy',
          lastActive: new Date(Date.now() - 1800000).toISOString(),
          rating: 4.7,
          studentsCount: 45,
          sessionsCompleted: 98,
          availability: {
            monday: false,
            tuesday: true,
            wednesday: true,
            thursday: false,
            friday: true,
            saturday: true,
            sunday: true,
          },
          nextAvailable: new Date(Date.now() + 7200000).toISOString(),
        },
        {
          id: '4',
          name: 'Mr. James Anderson',
          email: 'james.anderson@example.com',
          bio: 'ESL specialist with TOEFL/IELTS preparation expertise and academic English focus',
          specialties: ['ESL', 'TOEFL', 'IELTS', 'Academic English'],
          status: 'inactive',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          rating: 4.6,
          studentsCount: 32,
          sessionsCompleted: 67,
          availability: {
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: true,
            friday: false,
            saturday: false,
            sunday: false,
          },
          nextAvailable: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: '5',
          name: 'Dr. Alessandro Rossi',
          email: 'a.rossi@example.com',
          bio: 'Italian language and culture instructor with expertise in classical and modern Italian',
          specialties: ['Italian', 'Italian Literature', 'Business Italian'],
          status: 'active',
          lastActive: new Date().toISOString(),
          rating: 4.8,
          studentsCount: 56,
          sessionsCompleted: 112,
          availability: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: false,
            friday: true,
            saturday: false,
            sunday: false,
          },
        },
        {
          id: '6',
          name: 'Ms. Yuki Tanaka',
          email: 'yuki.tanaka@example.com',
          bio: 'Japanese language teacher specializing in JLPT preparation and business Japanese',
          specialties: ['Japanese', 'JLPT Prep', 'Business Japanese'],
          status: 'active',
          lastActive: new Date(Date.now() - 600000).toISOString(),
          rating: 4.9,
          studentsCount: 72,
          sessionsCompleted: 128,
          availability: {
            monday: false,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: false,
          },
          nextAvailable: new Date(Date.now() + 1800000).toISOString(),
        },
        {
          id: '7',
          name: 'Prof. Hans Mueller',
          email: 'h.mueller@example.com',
          bio: 'German language instructor with focus on Goethe certification and technical German',
          specialties: ['German', 'Goethe Prep', 'Technical German'],
          status: 'busy',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          rating: 4.7,
          studentsCount: 38,
          sessionsCompleted: 89,
          availability: {
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: true,
            friday: false,
            saturday: false,
            sunday: false,
          },
          nextAvailable: new Date(Date.now() + 10800000).toISOString(),
        },
        {
          id: '8',
          name: 'Dr. Fatima Al-Rashid',
          email: 'f.alrashid@example.com',
          bio: 'Arabic language teacher specializing in Modern Standard Arabic and Gulf dialect',
          specialties: ['Arabic', 'MSA', 'Gulf Arabic', 'Quranic Arabic'],
          status: 'inactive',
          lastActive: new Date(Date.now() - 7200000).toISOString(),
          rating: 4.8,
          studentsCount: 25,
          sessionsCompleted: 54,
          availability: {
            monday: true,
            tuesday: true,
            wednesday: false,
            thursday: true,
            friday: false,
            saturday: true,
            sunday: true,
          },
          nextAvailable: new Date(Date.now() + 86400000).toISOString(),
        },
      ];

      setTeachers(mockTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Teacher['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'in_session':
        return 'text-blue-500';
      case 'busy':
        return 'text-yellow-500';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: Teacher['status']) => {
    switch (status) {
      case 'active':
        return 'Available';
      case 'in_session':
        return 'In Session';
      case 'busy':
        return 'Busy';
      case 'inactive':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: Teacher['status']) => {
    switch (status) {
      case 'active':
        return <Zap className="h-3 w-3" />;
      case 'in_session':
        return <Video className="h-3 w-3" />;
      case 'busy':
        return <Clock className="h-3 w-3" />;
      case 'inactive':
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (filter === 'active') return teacher.status === 'active';
    if (filter === 'available') return teacher.status === 'active' || teacher.status === 'busy';
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
        <p className="mt-1 text-sm text-gray-500">
          Explore available language teachers and join learning teams
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Teachers
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'active'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Available Now
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'available'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Active Today
        </button>
      </div>

      {/* Teacher Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-gray-600 font-medium">{getInitials(teacher.name)}</span>
                      )}
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      teacher.status === 'active' ? 'bg-green-500' :
                      teacher.status === 'in_session' ? 'bg-blue-500' :
                      teacher.status === 'busy' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}>
                      {getStatusIcon(teacher.status)}
                    </div>
                  </div>
                  
                  {/* Teacher Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`flex items-center gap-1 ${getStatusColor(teacher.status)}`}>
                        <Circle className="h-2 w-2 fill-current" />
                        {getStatusText(teacher.status)}
                      </span>
                      {teacher.lastActive && (
                        <span className="text-gray-400">• {getTimeAgo(teacher.lastActive)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-700">{teacher.rating}</span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-600 mb-3">{teacher.bio}</p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1 mb-4">
                {teacher.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{teacher.studentsCount} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span>{teacher.sessionsCompleted} sessions</span>
                </div>
                {teacher.nextAvailable && teacher.status !== 'active' && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Next: {new Date(teacher.nextAvailable).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {teacher.status === 'active' ? (
                  <button className="flex-1 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    <Video className="h-4 w-4" />
                    Join Team
                  </button>
                ) : (
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Session
                  </button>
                )}
                <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTeachers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Available</h3>
            <p className="text-sm text-gray-500">
              {filter === 'active' 
                ? 'No teachers are currently available. Please check back later.'
                : 'No teachers found matching your criteria.'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}