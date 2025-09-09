'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, Star, Target, BookOpen, Users, Award, 
  TrendingUp, Clock, CheckCircle, Medal, Zap 
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  requirements: string[];
  benefits: string[];
}

const ACHIEVEMENTS: Achievement[] = [
  // Learning Milestones
  {
    id: 'first-course',
    title: 'Course Pioneer',
    description: 'Complete your first course on our platform',
    category: 'Learning Milestones',
    icon: 'BookOpen',
    requirements: ['Complete any course with passing grade'],
    benefits: ['Achievement badge in profile', '5% discount on next course purchase']
  },
  {
    id: 'speed-reader',
    title: 'Speed Reader',
    description: 'Complete a Reading & Writing course within recommended timeframe',
    category: 'Learning Milestones',
    icon: 'Zap',
    requirements: ['Complete any Reading & Writing course', 'Finish within suggested timeline'],
    benefits: ['Special recognition in profile', 'Early access to new reading materials']
  },
  {
    id: 'literature-explorer',
    title: 'Literature Explorer',
    description: 'Complete 3 literature courses from different periods',
    category: 'Learning Milestones',
    icon: 'Star',
    requirements: ['Complete 3 literature courses', 'Must span different historical periods'],
    benefits: ['Literature Expert badge', 'Access to exclusive discussion forums']
  },

  // Academic Excellence
  {
    id: 'high-achiever',
    title: 'High Achiever',
    description: 'Maintain 90%+ average across all completed courses',
    category: 'Academic Excellence',
    icon: 'Trophy',
    requirements: ['Complete minimum 3 courses', 'Maintain 90% or higher average score'],
    benefits: ['Gold achievement badge', '10% discount on premium courses']
  },
  {
    id: 'perfect-submission',
    title: 'Perfect Submission',
    description: 'Submit all assignments on time with excellent grades',
    category: 'Academic Excellence',
    icon: 'Target',
    requirements: ['Complete course with no late submissions', 'Achieve 95%+ on all assignments'],
    benefits: ['Reliability badge', 'Priority support access']
  },
  {
    id: 'critical-thinker',
    title: 'Critical Thinker',
    description: 'Excel in analysis and interpretation tasks',
    category: 'Academic Excellence',
    icon: 'Award',
    requirements: ['Score 95%+ on critical thinking assessments', 'Complete advanced analysis tasks'],
    benefits: ['Critical Thinking badge', 'Access to advanced course materials']
  },

  // Engagement & Participation
  {
    id: 'active-learner',
    title: 'Active Learner',
    description: 'Consistently engage with course materials and activities',
    category: 'Engagement',
    icon: 'TrendingUp',
    requirements: ['Log in at least 5 days per week', 'Complete daily reading activities'],
    benefits: ['Engagement badge', 'Featured learner spotlight opportunity']
  },
  {
    id: 'time-master',
    title: 'Time Master',
    description: 'Efficiently manage study time across multiple courses',
    category: 'Engagement',
    icon: 'Clock',
    requirements: ['Enroll in 3+ concurrent courses', 'Maintain progress in all courses'],
    benefits: ['Time Management badge', 'Study planning resources']
  },
  {
    id: 'community-contributor',
    title: 'Community Contributor',
    description: 'Help other learners through peer support',
    category: 'Engagement',
    icon: 'Users',
    requirements: ['Participate in discussion forums', 'Provide helpful feedback to peers'],
    benefits: ['Community Leader badge', 'Access to mentorship opportunities']
  },

  // Mastery & Expertise
  {
    id: 'subject-master',
    title: 'Subject Master',
    description: 'Demonstrate mastery in a specific academic area',
    category: 'Mastery',
    icon: 'Medal',
    requirements: ['Complete 5+ courses in same subject area', 'Achieve 85%+ average in subject'],
    benefits: ['Subject Expert badge', 'Invitation to advanced subject courses']
  },
  {
    id: 'curriculum-completer',
    title: 'Curriculum Completer',
    description: 'Complete an entire grade-level curriculum program',
    category: 'Mastery',
    icon: 'CheckCircle',
    requirements: ['Complete all required courses in grade level', 'Meet progression standards'],
    benefits: ['Curriculum Completion certificate', 'Preparation for next grade level']
  }
];

const CATEGORIES = [
  { name: 'All', icon: Trophy },
  { name: 'Learning Milestones', icon: BookOpen },
  { name: 'Academic Excellence', icon: Award },
  { name: 'Engagement', icon: Users },
  { name: 'Mastery', icon: Medal }
];

const ICON_MAP: { [key: string]: any } = {
  BookOpen, Star, Trophy, Target, Award, TrendingUp, Clock, CheckCircle, Medal, Zap, Users
};

export default function AchievementPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredAchievements = selectedCategory === 'All' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(achievement => achievement.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-gray-900 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Achievements & Recognition
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track your learning progress and earn recognition for your academic accomplishments. 
              Complete challenges, demonstrate excellence, and unlock exclusive benefits.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.name;
              
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                    ${isSelected 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredAchievements.map((achievement) => {
            const Icon = ICON_MAP[achievement.icon] || Trophy;
            
            return (
              <div 
                key={achievement.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {achievement.category}
                    </p>
                    <p className="text-gray-700">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {achievement.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {achievement.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-gray-50 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How Achievement System Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Set Goals</h3>
              <p className="text-sm text-gray-600">
                Choose achievements that align with your learning objectives and academic goals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">
                Monitor your advancement through course completion, assignments, and assessments.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Earn Recognition</h3>
              <p className="text-sm text-gray-600">
                Unlock badges, certificates, and exclusive benefits as you meet achievement criteria.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Start Achieving?
            </h2>
            <p className="text-gray-600 mb-4">
              Begin your learning journey and start working toward your first achievement.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                href="/account/courses"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                View My Progress
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}