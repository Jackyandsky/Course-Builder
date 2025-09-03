'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { User, Check, X } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    course_updates: true,
    newsletter: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/account/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          // Fallback to user metadata if API fails
          setProfile({
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            bio: user.user_metadata?.bio || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user metadata
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          bio: user.user_metadata?.bio || '',
          avatar_url: user.user_metadata?.avatar_url || ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      showMessage('success', 'Settings saved successfully');
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showMessage('error', error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile and preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
            {!editing ? (
              <button 
                onClick={() => setEditing(true)} 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Compact Profile Form */}
          <div className="space-y-3">
            {/* Avatar Row */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{profile.full_name || 'Your Name'}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>

            {/* Name Field */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="text-sm text-gray-600">Name</label>
              <div className="col-span-2">
                {editing ? (
                  <Input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Full name"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{profile.full_name || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="text-sm text-gray-600">Email</label>
              <div className="col-span-2">
                <p className="text-sm text-gray-900">{profile.email}</p>
              </div>
            </div>

            {/* Phone Field */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="text-sm text-gray-600">Phone</label>
              <div className="col-span-2">
                {editing ? (
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Phone number"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{profile.phone || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Security */}
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Notifications</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Email updates</label>
                <button
                  onClick={() => setNotifications({ ...notifications, email_notifications: !notifications.email_notifications })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notifications.email_notifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifications.email_notifications ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Course updates</label>
                <button
                  onClick={() => setNotifications({ ...notifications, course_updates: !notifications.course_updates })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notifications.course_updates ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifications.course_updates ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Newsletter</label>
                <button
                  onClick={() => setNotifications({ ...notifications, newsletter: !notifications.newsletter })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notifications.newsletter ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifications.newsletter ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Security</h2>
            
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                Change Password
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                Manage Sessions
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                Two-Factor Authentication
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <h2 className="text-base font-semibold text-red-600 mb-3">Danger Zone</h2>
            <button className="text-sm text-red-600 hover:text-red-700">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
}