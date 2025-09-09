'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AdminDashboardLayout } from '@/components/layout/AdminDashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

// Dynamically import the Academic Progress component
const AcademicProgress = dynamic(() => import('@/components/users/AcademicProgress'), { ssr: false });

import { 
  UserIcon, 
  AcademicCapIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BookOpenIcon,
  FolderIcon,
  ShareIcon,
  ChevronDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { SocialMediaInput, SocialMediaData } from '@/components/ui/SocialMediaInput';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar_url: string | null;
  phone: string | null;
  grade_level: string | null;
  date_of_birth: string | null;
  parent_id: string | null;
  created_at: string;
  verified_at: string | null;
  metadata: any;
  social_media?: SocialMediaData;
  available_for_booking?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'academic', label: 'Academic', icon: AcademicCapIcon },
  // { id: 'notes', label: 'Notes & Communication', icon: ChatBubbleLeftRightIcon },
  // { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
];

// Profile Panel Component - moved from header
function ProfilePanel({ userProfile }: { userProfile: any }) {
  return (
    <div className="mt-3 px-4">
      <div className="border border-gray-200 rounded-lg p-4">
        {/* Profile Info Section */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              {userProfile.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt={userProfile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary-600">
                  {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                </span>
              )}
            </div>
            {userProfile.verified_at && (
              <CheckCircleIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
            )}
          </div>
        </div>

          {/* Basic Info */}
          <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{userProfile.full_name}</h2>
              <p className="text-gray-600 text-sm mt-0.5">{userProfile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userProfile.role === 'admin' ? 'bg-red-100 text-red-700' :
                  userProfile.role === 'teacher' ? 'bg-green-100 text-green-700' :
                  userProfile.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </span>
                <div className="flex items-center space-x-1">
                  {userProfile.verified_at ? (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs text-yellow-600">Pending</span>
                    </>
                  )}
                </div>
              </div>
          </div>
        </div>

        {/* Stats Row at Bottom */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center p-2">
            <div className="text-xs text-gray-500">Member Since</div>
            <div className="font-semibold text-gray-900 text-sm">
              {new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>
          <div className="text-center p-2">
            <div className="text-xs text-gray-500">Grade Level</div>
            <div className="font-semibold text-gray-900 text-sm">
              {userProfile.grade_level || 'N/A'}
            </div>
          </div>
          <div className="text-center p-2">
            <div className="text-xs text-gray-500">Phone</div>
            <div className="font-semibold text-gray-900 text-xs">
              {userProfile.phone || 'N/A'}
            </div>
          </div>
          <div className="text-center p-2">
            <div className="text-xs text-gray-500">Status</div>
            <div className="font-semibold text-green-600 text-sm">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible Recent Activity Component
function CollapsibleRecentActivity({ activities, loadingActivities }: { activities: any[], loadingActivities: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Recent Activity</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-3">
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => {
                  let IconComponent = UserIcon;
                  let bgColor = 'bg-gray-100';
                  let iconColor = 'text-gray-600';
                  
                  switch (activity.type) {
                    case 'booking':
                    case 'booking_status':
                      IconComponent = CalendarIcon;
                      bgColor = activity.type === 'booking' ? 'bg-blue-100' : 
                               activity.metadata?.status === 'confirmed' ? 'bg-green-100' : 'bg-red-100';
                      iconColor = activity.type === 'booking' ? 'text-blue-600' : 
                                 activity.metadata?.status === 'confirmed' ? 'text-green-600' : 'text-red-600';
                      break;
                    case 'course_enrollment':
                      IconComponent = BookOpenIcon;
                      bgColor = 'bg-purple-100';
                      iconColor = 'text-purple-600';
                      break;
                    case 'course_completion':
                      IconComponent = CheckCircleIcon;
                      bgColor = 'bg-green-100';
                      iconColor = 'text-green-600';
                      break;
                    case 'purchase':
                      IconComponent = FolderIcon;
                      bgColor = 'bg-yellow-100';
                      iconColor = 'text-yellow-600';
                      break;
                    case 'task_submission':
                      IconComponent = ClipboardDocumentListIcon;
                      bgColor = 'bg-indigo-100';
                      iconColor = 'text-indigo-600';
                      break;
                    case 'profile_update':
                      IconComponent = UserIcon;
                      bgColor = 'bg-gray-100';
                      iconColor = 'text-gray-600';
                      break;
                  }
                  
                  const timeAgo = (timestamp: string) => {
                    const now = new Date();
                    const then = new Date(timestamp);
                    const diff = now.getTime() - then.getTime();
                    const seconds = Math.floor(diff / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    const weeks = Math.floor(days / 7);
                    const months = Math.floor(days / 30);
                    
                    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
                    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                    return 'Just now';
                  };
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{timeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No recent activity found
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  
  const userId = params.id as string;

  // Check if current user can edit this profile
  const canEdit = currentUserProfile?.role === 'admin' || 
    (currentUserProfile?.role === 'teacher' && userProfile?.role === 'student');

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { userProfile: data } = await response.json();
      
      setUserProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile with data:', editedProfile);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Profile updated successfully:', result);
      
      await fetchUserProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // You could add a toast notification here to show the user the error
      alert(`Failed to save profile: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              {canEdit && (
                <Button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  variant={isEditing ? 'primary' : 'outline'}
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Header */}
      <div className="bg-white rounded-lg shadow-sm mb-4">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          </div>
          
          {/* Profile Panel - moved here to replace Academic Stats */}
          <ProfilePanel userProfile={userProfile} />
        </div>

        {/* Tabs */}
        <div className="px-4">
          <nav className="flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4">
          {activeTab === 'overview' && (
            <OverviewTab 
              userProfile={userProfile}
              isEditing={isEditing}
              editedProfile={editedProfile}
              setEditedProfile={setEditedProfile}
              canEdit={canEdit}
            />
          )}
          {activeTab === 'academic' && (
            <AcademicTab userProfile={userProfile} canEdit={canEdit} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ userProfile, isEditing, editedProfile, setEditedProfile, canEdit }: any) {
  const { userProfile: currentUserProfile } = useAuth();
  const [savingRole, setSavingRole] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Only admins can change roles
  const canChangeRole = currentUserProfile?.role === 'admin';

  useEffect(() => {
    fetchUserStats();
    fetchUserActivities();
  }, [userProfile.id]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userProfile.id}/stats`);
      
      if (response.ok) {
        const stats = await response.json();
        setEnrollmentCount(stats.enrollmentCount || 0);
        setCompletedCourses(stats.completedCourses || 0);
        setAverageScore(stats.averageScore || 0);
        setLastLogin(stats.lastLogin);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await fetch(`/api/admin/users/${userProfile.id}/activity`);
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!canChangeRole || newRole === userProfile.role) return;
    
    setSavingRole(true);
    try {
      const updates = {
        role: newRole,
        // If changing to teacher/admin, mark as needing verification
        needs_verification: (newRole === 'teacher' || newRole === 'admin'),
        verified_at: (newRole === 'student' || newRole === 'parent') ? new Date().toISOString() : null
      };

      const response = await fetch(`/api/admin/users/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setEditedProfile({...editedProfile, role: newRole});
      
      // Show success message
      alert(`Role updated to ${newRole} successfully!`);
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Settings and Social Media in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Settings Card */}
        <Card>
          <div className="p-4">
            <h3 className="text-base font-semibold mb-3">Account Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            {canChangeRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Role
                </label>
                {isEditing ? (
                  <select
                    value={editedProfile.role || userProfile.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={savingRole}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    Current: {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Login
              </label>
              <p className="text-gray-900">
                {lastLogin 
                  ? new Date(lastLogin).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never logged in'}
              </p>
            </div>
            {/* Available for Booking - For teachers and admins */}
            {(userProfile.role === 'teacher' || userProfile.role === 'admin' || 
              editedProfile.role === 'teacher' || editedProfile.role === 'admin') && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Availability
                </label>
                {isEditing ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="available_for_booking"
                      checked={editedProfile.available_for_booking ?? userProfile.available_for_booking ?? false}
                      onChange={(e) => setEditedProfile({...editedProfile, available_for_booking: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="available_for_booking" className="text-sm text-gray-700">
                      Available for student bookings
                      {userProfile.role === 'admin' && ' (as instructor)'}
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {userProfile.available_for_booking ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">
                          Available for bookings
                          {userProfile.role === 'admin' && ' (as instructor)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-500">Not available for bookings</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </Card>

        {/* Social Media Information Card */}
        <Card>
          <div className="p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <ShareIcon className="h-4 w-4 text-gray-600" />
              Social Media Accounts
            </h3>
            <SocialMediaInput
              value={isEditing ? (editedProfile.social_media || {}) : (userProfile.social_media || {})}
              onChange={(value) => isEditing && setEditedProfile({...editedProfile, social_media: value})}
              editing={isEditing}
            />
          </div>
        </Card>
      </div>

      {/* Editable Personal Information - Non-redundant fields only */}
      {isEditing && (
        <Card>
          <div className="p-4">
            <h3 className="text-base font-semibold mb-3">Edit Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editedProfile.first_name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, first_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editedProfile.last_name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, last_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editedProfile.phone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {(userProfile.role === 'student' || editedProfile.role === 'student') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade Level
                    </label>
                    <select
                      value={editedProfile.grade_level || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, grade_level: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Grade</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Grade {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editedProfile.date_of_birth || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, date_of_birth: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              {(userProfile.role === 'parent' || editedProfile.role === 'parent') && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linked Children
                  </label>
                  <p className="text-gray-900">
                    {/* This would show linked student accounts */}
                    No linked children accounts
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}


      {/* Recent Activity - Collapsible */}
      <CollapsibleRecentActivity 
        activities={activities}
        loadingActivities={loadingActivities}
      />
    </div>
  );
}

// Academic Tab Component - Simplified to use the new component
function AcademicTab({ userProfile, canEdit }: any) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleEnrollmentUpdate = () => {
    // Force refresh of the component
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AcademicProgress 
      key={refreshKey}
      userId={userProfile.id} 
      canEdit={canEdit}
      onEnrollmentUpdate={handleEnrollmentUpdate}
    />
  );
}

// Legacy Academic Tab Component (keeping for reference but renamed)
function LegacyAcademicTab({ userProfile, canEdit }: any) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [enrollmentStats, setEnrollmentStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    avgScore: 0
  });

  useEffect(() => {
    fetchEnrollments();
    fetchAvailableCourses();
  }, [userProfile.id]);

  const fetchEnrollments = async () => {
    try {
      // TODO: Replace with API route call
      setEnrollments([]);
      setEnrollmentStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        avgScore: 0
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      // TODO: Replace with API route call
      setAvailableCourses([]);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourseId) return;

    try {
      // TODO: Replace with API route call
      alert('Course assignment temporarily disabled');
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Failed to assign course. It may already be assigned.');
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to unenroll this student from the course?')) return;

    try {
      // TODO: Replace with API route call
      console.log('Unenrollment temporarily disabled');
    } catch (error) {
      console.error('Error unenrolling:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'not_started': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Assignment */}
      {canEdit && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Enrolled Courses</h3>
          <Button onClick={() => setShowAssignModal(true)}>
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            Assign Course
          </Button>
        </div>
      )}

      {/* Performance Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Academic Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{enrollmentStats.total}</p>
              <p className="text-sm text-gray-500">Total Courses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{enrollmentStats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{enrollmentStats.inProgress}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{enrollmentStats.notStarted}</p>
              <p className="text-sm text-gray-500">Not Started</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{enrollmentStats.avgScore}%</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Enrolled Courses */}
      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{enrollment.course?.title || 'Unknown Course'}</h4>
                    <p className="text-sm text-gray-500">
                      {enrollment.course?.instructor_name || 'No instructor'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Level: {enrollment.course?.level || 'Not specified'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(enrollment.status)}`}>
                      {formatStatus(enrollment.status)}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => handleUnenroll(enrollment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{enrollment.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        enrollment.status === 'completed' ? 'bg-green-600' :
                        enrollment.status === 'in_progress' ? 'bg-primary-600' :
                        'bg-gray-400'
                      }`} 
                      style={{ width: `${enrollment.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Started: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
                    {enrollment.completed_at && (
                      <span>
                        Completed: {new Date(enrollment.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {enrollment.grade_score !== null && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Final Score:</span>
                        <span className="font-semibold">{enrollment.grade_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No courses enrolled yet</p>
            {canEdit && (
              <p className="text-sm text-gray-500 mt-2">
                Click "Assign Course" to enroll this student in courses
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Assign Course Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Assign Course</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses by title, instructor, or level..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Course List */}
            <div className="mb-4 flex-1 overflow-hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Courses ({availableCourses.filter(course => 
                  !enrollments.some(e => e.course_id === course.id) &&
                  (courseSearchTerm === '' || 
                   course.title?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                   course.instructor_name?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                   course.level?.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                ).length})
              </label>
              
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {availableCourses
                  .filter(course => 
                    !enrollments.some(e => e.course_id === course.id) &&
                    (courseSearchTerm === '' || 
                     course.title?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                     course.instructor_name?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                     course.level?.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                  )
                  .map(course => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCourseId === course.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{course.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            {course.instructor_name && (
                              <span>👨‍🏫 {course.instructor_name}</span>
                            )}
                            {course.level && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {course.level}
                              </span>
                            )}
                            {course.duration_hours && (
                              <span>⏱️ {course.duration_hours}h</span>
                            )}
                          </div>
                          {course.short_description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {course.short_description}
                            </p>
                          )}
                        </div>
                        <div className="ml-3">
                          {selectedCourseId === course.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
                {availableCourses.filter(course => 
                  !enrollments.some(e => e.course_id === course.id) &&
                  (courseSearchTerm === '' || 
                   course.title?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                   course.instructor_name?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                   course.level?.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                ).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="mb-2">📚</div>
                    {courseSearchTerm ? 'No courses found matching your search' : 'No available courses to assign'}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Course Summary */}
            {selectedCourseId && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Selected Course:</p>
                <p className="text-sm text-blue-700">
                  {availableCourses.find(c => c.id === selectedCourseId)?.title}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCourseId('');
                  setCourseSearchTerm('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignCourse}
                disabled={!selectedCourseId}
              >
                Assign Course
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tasks Tab Component
function TasksTab({ userProfile, canEdit }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: 1,
    course_id: ''
  });
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchUserCourses();
  }, [userProfile.id]);

  const fetchTasks = async () => {
    try {
      // TODO: Replace with API route call
      // For now, just set empty array to prevent errors
      setTasks([]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCourses = async () => {
    try {
      // TODO: Replace with API route call
      setCourses([]);
    } catch (error) {
      console.error('Error fetching user courses:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      // TODO: Replace with API route call
      alert('Task creation temporarily disabled');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      // TODO: Replace with API route call
      console.log('Task status update temporarily disabled');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      // TODO: Replace with API route call
      console.log('Task deletion temporarily disabled');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tasks & Assignments</h3>
          <Button onClick={() => setShowCreateModal(true)}>
            <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      )}

      {/* Task Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{tasks.length}</p>
            <p className="text-sm text-gray-500">Total Tasks</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{activeTasks.length}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {activeTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}
            </p>
            <p className="text-sm text-gray-500">Overdue</p>
          </div>
        </Card>
      </div>

      {/* Active Tasks */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Active Tasks</h4>
        {activeTasks.length > 0 ? (
          <div className="space-y-3">
            {activeTasks.map(task => (
              <Card key={task.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium">{task.title}</h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      {task.course && (
                        <p className="text-sm text-gray-500 mt-1">{task.course.title}</p>
                      )}
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {task.due_date && (
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.estimated_hours && (
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Est. {task.estimated_hours} hour{task.estimated_hours !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canEdit && (
                        <>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-8 text-center text-gray-500">
              No active tasks
            </div>
          </Card>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Recently Completed</h4>
          <div className="space-y-3">
            {completedTasks.slice(0, 5).map(task => (
              <Card key={task.id} className="bg-gray-50">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-600 line-through">{task.title}</h5>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Completed
                        </span>
                      </div>
                      {task.course && (
                        <p className="text-sm text-gray-500 mt-1">{task.course.title}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>
                          Completed: {task.completed_at 
                            ? new Date(task.completed_at).toLocaleDateString() 
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course (Optional)
                </label>
                <select
                  value={newTask.course_id}
                  onChange={(e) => setNewTask({...newTask, course_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">No specific course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded-md"
                  min="1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    estimated_hours: 1,
                    course_id: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Notes Tab Component
function NotesTab({ userProfile, canEdit }: any) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [userProfile.id]);

  const fetchNotes = async () => {
    try {
      // TODO: Replace with API route call
      setNotes([]);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      // TODO: Replace with API route call
      alert('Note creation temporarily disabled');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      // TODO: Replace with API route call
      console.log('Note deletion temporarily disabled');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffInMs = now.getTime() - noteDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return noteDate.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      {canEdit && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note about this student..."
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span className="text-sm">Private note (only visible to staff)</span>
                </label>
              </div>
              <Button 
                disabled={!newNote.trim()}
                onClick={handleAddNote}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Communication Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{notes.length}</p>
            <p className="text-sm text-gray-500">Total Notes</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {notes.filter(n => n.is_private).length}
            </p>
            <p className="text-sm text-gray-500">Private Notes</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {notes.filter(n => !n.is_private).length}
            </p>
            <p className="text-sm text-gray-500">Shared Notes</p>
          </div>
        </Card>
      </div>

      {/* Notes History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Notes History</h3>
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map(note => (
              <Card key={note.id}>
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {getInitials(note.created_by?.full_name || 'Unknown')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {note.created_by?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {note.created_by?.role && (
                              <span className="capitalize">{note.created_by.role}</span>
                            )}
                            {' • '}
                            {formatTimeAgo(note.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            note.is_private 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {note.is_private ? 'Staff Only' : 'Shared with Parents'}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      {note.related_task_id && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            Related to task: {note.related_task_id}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-12 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notes yet</p>
              {canEdit && (
                <p className="text-sm text-gray-500 mt-2">
                  Add a note to start tracking communication
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Communication Templates (Future Feature) */}
      {canEdit && (
        <Card className="bg-gray-50">
          <div className="p-6">
            <h4 className="font-medium text-gray-700 mb-3">Quick Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewNote('Student demonstrated excellent progress in class today. ')}
              >
                Progress Update
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewNote('Parent meeting scheduled for: \nTopics to discuss: ')}
              >
                Parent Meeting
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewNote('Behavior observation: \nAction taken: ')}
              >
                Behavior Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewNote('Academic concern: \nRecommended action: ')}
              >
                Academic Concern
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ userProfile, canEdit }: any) {
  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Documents</h3>
          <Button>
            Upload Document
          </Button>
        </div>
      )}

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6 text-center">
            <FolderIcon className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h4 className="font-medium">Report Cards</h4>
            <p className="text-sm text-gray-500 mt-1">3 documents</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <FolderIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium">Certificates</h4>
            <p className="text-sm text-gray-500 mt-1">5 documents</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <FolderIcon className="h-12 w-12 text-purple-500 mx-auto mb-3" />
            <h4 className="font-medium">Assignments</h4>
            <p className="text-sm text-gray-500 mt-1">12 documents</p>
          </div>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <div className="p-6">
          <h4 className="font-medium mb-4">Recent Documents</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-sm">Q2 Report Card.pdf</p>
                  <p className="text-xs text-gray-500">Uploaded 2 days ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Math Competition Certificate.pdf</p>
                  <p className="text-xs text-gray-500">Uploaded 1 week ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ userProfile }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Performance Analytics</h3>
      
      {/* Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="font-medium mb-4">Grade Progression</h4>
            {/* Chart would go here */}
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Grade progression chart</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-medium mb-4">Subject Performance</h4>
            {/* Radar chart would go here */}
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Subject performance radar chart</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Learning Metrics */}
      <Card>
        <div className="p-6">
          <h4 className="font-medium mb-4">Learning Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">156</p>
              <p className="text-sm text-gray-600">Total Study Hours</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">89%</p>
              <p className="text-sm text-gray-600">Assignment Completion</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">4.2</p>
              <p className="text-sm text-gray-600">Avg. Hours/Day</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">23</p>
              <p className="text-sm text-gray-600">Skills Mastered</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}