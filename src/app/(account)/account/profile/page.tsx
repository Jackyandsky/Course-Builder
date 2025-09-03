'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Camera, Save, Edit2, Globe, Briefcase,
  GraduationCap, Award, Star, BookOpen, Share2
} from 'lucide-react';
import { SocialMediaInput, SocialMediaData } from '@/components/ui/SocialMediaInput';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  bio?: string;
  occupation?: string;
  education_level?: string;
  interests?: string[];
  avatar_url?: string;
  created_at: string;
  learning_goals?: string;
  preferred_language?: string;
  timezone?: string;
  social_media?: SocialMediaData;
}

interface LearningStats {
  courses_enrolled: number;
  courses_completed: number;
  total_learning_hours: number;
  certificates_earned: number;
  current_streak: number;
  longest_streak: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = getSingletonSupabaseClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LearningStats>({
    courses_enrolled: 0,
    courses_completed: 0,
    total_learning_hours: 0,
    certificates_earned: 0,
    current_streak: 0,
    longest_streak: 0
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLearningStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!supabase || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const profileData = data || {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      };

      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningStats = async () => {
    if (!supabase || !user) return;
    
    try {
      // Fetch enrolled courses
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'course');

      setStats(prev => ({
        ...prev,
        courses_enrolled: purchases?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    if (!supabase || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setProfile(formData as UserProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadAvatar = async (file: File) => {
    // Future implementation: Upload to Supabase Storage
    console.log('Uploading avatar:', file.name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="p-8">
        <div className="flex items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()
                )}
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="flex-1 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {editing ? (
                    <Input
                      value={formData.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {profile?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {editing ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {profile?.phone || 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  {editing ? (
                    <Input
                      value={formData.occupation || ''}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Your occupation"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      {profile?.occupation || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-gray-600" />
                Social Media
              </h3>
              <SocialMediaInput
                value={formData.social_media || {}}
                onChange={(value) => handleInputChange('social_media', value as any)}
                editing={editing}
              />
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  {editing ? (
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street address"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  {editing ? (
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.city || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  {editing ? (
                    <Input
                      value={formData.province || ''}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      placeholder="Province"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.province || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  {editing ? (
                    <Input
                      value={formData.postal_code || ''}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="A1B 2C3"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.postal_code || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  {editing ? (
                    <Input
                      value={formData.country || 'Canada'}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      {profile?.country || 'Canada'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Preferences */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-600" />
                Learning Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Goals
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.learning_goals || ''}
                      onChange={(e) => handleInputChange('learning_goals', e.target.value)}
                      placeholder="What are your learning goals?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.learning_goals || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.bio || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex items-center gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  setFormData(profile || {});
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Learning Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-gray-600" />
          Learning Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.courses_enrolled}</div>
            <p className="text-sm text-gray-600 mt-1">Courses Enrolled</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.courses_completed}</div>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.total_learning_hours}</div>
            <p className="text-sm text-gray-600 mt-1">Learning Hours</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.certificates_earned}</div>
            <p className="text-sm text-gray-600 mt-1">Certificates</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.current_streak}</div>
            <p className="text-sm text-gray-600 mt-1">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats.longest_streak}</div>
            <p className="text-sm text-gray-600 mt-1">Best Streak</p>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          Account Information
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Unknown'}
          </p>
          <p className="text-sm text-gray-600">
            User ID: {user?.id}
          </p>
        </div>
      </Card>
    </div>
  );
}