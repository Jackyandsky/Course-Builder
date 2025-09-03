'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Globe, Mail, Phone, Building, MapPin,
  Clock, Calendar, DollarSign, Check, X,
  Save, Edit2, Loader2, Key, Shield, Database
} from 'lucide-react';

interface SystemSettings {
  site_name: string;
  site_url: string;
  admin_email: string;
  support_email: string;
  support_phone: string;
  company_name: string;
  company_address: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: '12h' | '24h';
  allow_registration: boolean;
  require_email_verification: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export default function AdminGeneralSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'Course Builder',
    site_url: 'https://coursebuilder.com',
    admin_email: 'admin@coursebuilder.com',
    support_email: 'support@coursebuilder.com',
    support_phone: '+1 (555) 123-4567',
    company_name: 'Course Builder Inc.',
    company_address: '123 Main St, City, State 12345',
    timezone: 'America/New_York',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    allow_registration: true,
    require_email_verification: true,
    maintenance_mode: false,
    maintenance_message: 'We are currently performing maintenance. Please check back soon.'
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load settings from database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        
        // Convert array of settings to object
        // Note: value field is JSONB, so it can be any type
        const settingsObj: any = {};
        data.forEach((setting: any) => {
          settingsObj[setting.key] = setting.value;
        });
        
        setSettings({
          site_name: settingsObj.site_name || 'Course Builder',
          site_url: settingsObj.site_url || process.env.NEXT_PUBLIC_APP_URL || '',
          admin_email: settingsObj.admin_email || '',
          support_email: settingsObj.support_email || '',
          support_phone: settingsObj.support_phone || '',
          company_name: settingsObj.company_name || '',
          company_address: settingsObj.company_address || '',
          timezone: settingsObj.timezone || 'America/New_York',
          currency: settingsObj.currency || 'USD',
          date_format: settingsObj.date_format || 'MM/DD/YYYY',
          time_format: settingsObj.time_format || '12h',
          allow_registration: settingsObj.allow_registration ?? true,
          require_email_verification: settingsObj.require_email_verification ?? true,
          maintenance_mode: settingsObj.maintenance_mode ?? false,
          maintenance_message: settingsObj.maintenance_message || 'We are currently performing maintenance.'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare settings for API
      const settingsArray = Object.entries(settings).map(([key, value]) => {
        let category = 'general';
        if (['company_name', 'company_address', 'support_phone'].includes(key)) {
          category = 'company';
        } else if (['timezone', 'currency', 'date_format', 'time_format'].includes(key)) {
          category = 'regional';
        } else if (['allow_registration', 'require_email_verification', 'maintenance_mode', 'maintenance_message'].includes(key)) {
          category = 'system';
        }
        
        return {
          key,
          value,
          category
        };
      });

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsArray }),
      });

      if (response.ok) {
        showMessage('success', 'Settings saved successfully');
        setEditing(false);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Keys & Integrations Notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Configuration Storage</h3>
            <p className="text-sm text-blue-700 mt-1">
              Sensitive API keys are stored in environment variables (.env.local). 
              User-configurable settings are stored in the database.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700">
                  API Keys: Stored in .env.local (Supabase, Stripe, etc.)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700">
                  Settings: Stored in database (site info, preferences, etc.)
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Site Information */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Site Information</h2>
            <p className="text-sm text-gray-500 mt-1">
              Basic information about your site
            </p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="secondary">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setEditing(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="inline h-4 w-4 mr-1" />
              Site Name
            </label>
            {editing ? (
              <Input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.site_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site URL
            </label>
            {editing ? (
              <Input
                type="url"
                value={settings.site_url}
                onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.site_url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />
              Admin Email
            </label>
            {editing ? (
              <Input
                type="email"
                value={settings.admin_email}
                onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.admin_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Support Email
            </label>
            {editing ? (
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.support_email}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Company Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="inline h-4 w-4 mr-1" />
              Company Name
            </label>
            {editing ? (
              <Input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.company_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />
              Support Phone
            </label>
            {editing ? (
              <Input
                type="tel"
                value={settings.support_phone}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.support_phone}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              Company Address
            </label>
            {editing ? (
              <Input
                type="text"
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{settings.company_address}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Regional Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="inline h-4 w-4 mr-1" />
              Timezone
            </label>
            {editing ? (
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{settings.timezone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Currency
            </label>
            {editing ? (
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{settings.currency}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Format
            </label>
            {editing ? (
              <select
                value={settings.date_format}
                onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{settings.date_format}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Format
            </label>
            {editing ? (
              <select
                value={settings.time_format}
                onChange={(e) => setSettings({ ...settings, time_format: e.target.value as '12h' | '24h' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">
                {settings.time_format === '24h' ? '24-hour' : '12-hour (AM/PM)'}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* System Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Allow Registration</p>
              <p className="text-xs text-gray-500">Allow new users to register</p>
            </div>
            {editing ? (
              <button
                onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allow_registration ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allow_registration ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : (
              <span className={`text-sm ${settings.allow_registration ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.allow_registration ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Verification</p>
              <p className="text-xs text-gray-500">Require email verification for new users</p>
            </div>
            {editing ? (
              <button
                onClick={() => setSettings({ ...settings, require_email_verification: !settings.require_email_verification })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.require_email_verification ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.require_email_verification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : (
              <span className={`text-sm ${settings.require_email_verification ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.require_email_verification ? 'Required' : 'Not Required'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-xs text-gray-500">Show maintenance message to visitors</p>
            </div>
            {editing ? (
              <button
                onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : (
              <span className={`text-sm ${settings.maintenance_mode ? 'text-red-600' : 'text-gray-500'}`}>
                {settings.maintenance_mode ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>

          {settings.maintenance_mode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Message
              </label>
              {editing ? (
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-900">{settings.maintenance_message}</p>
              )}
            </div>
          )}
        </div>
      </Card>

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