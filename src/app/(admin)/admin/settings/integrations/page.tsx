'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Book, Key, Check, X, Eye, EyeOff, TestTube, 
  Loader2, AlertCircle, Shield, ExternalLink, Database
} from 'lucide-react';

interface IntegrationSettings {
  google_books_api_key: string;
  google_books_enabled: boolean;
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_role_key: string;
}

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<IntegrationSettings>({
    google_books_api_key: '',
    google_books_enabled: false,
    supabase_url: '',
    supabase_anon_key: '',
    supabase_service_role_key: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSupabaseKeys, setShowSupabaseKeys] = useState({
    url: false,
    anonKey: false,
    serviceKey: false
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/integrations');
      
      if (response.ok) {
        const data = await response.json();
        setSettings({
          google_books_api_key: data.google_books_api_key || '',
          google_books_enabled: data.google_books_enabled || false,
          supabase_url: data.supabase_url || '',
          supabase_anon_key: data.supabase_anon_key || '',
          supabase_service_role_key: data.supabase_service_role_key || ''
        });
      }
    } catch (error) {
      console.error('Error loading integration settings:', error);
      showMessage('error', 'Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showMessage('success', 'Integration settings saved successfully');
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

  const testGoogleBooksAPI = async () => {
    if (!settings.google_books_api_key) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: 'google_books',
          api_key: settings.google_books_api_key
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({ 
          success: true, 
          message: 'Connection successful! API key is valid.' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: data.error || 'Connection failed. Please check your API key.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Failed to test connection. Please try again.' 
      });
    } finally {
      setTesting(false);
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
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure API keys and settings for external services
            </p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="secondary">
              <Key className="h-4 w-4 mr-2" />
              Configure APIs
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditing(false);
                  loadSettings(); // Reset to saved values
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Security Notice */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              API keys are encrypted before storage and only accessible to administrators. 
              Never share your API keys publicly or commit them to version control.
            </p>
          </div>
        </div>
      </Card>

      {/* Google Books API */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Book className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Google Books API</h3>
            <p className="text-sm text-gray-500 mt-1">
              Enable automatic book information updates from Google Books
            </p>
            <a 
              href="https://console.cloud.google.com/apis/library/books.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              Get your API key from Google Cloud Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            {settings.google_books_enabled ? (
              <Badge className="bg-green-100 text-green-700">Enabled</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Google Books Integration</p>
              <p className="text-xs text-gray-500">Allow automatic book information synchronization</p>
            </div>
            {editing ? (
              <button
                onClick={() => setSettings({ 
                  ...settings, 
                  google_books_enabled: !settings.google_books_enabled 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.google_books_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.google_books_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : (
              <span className={`text-sm font-medium ${
                settings.google_books_enabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {settings.google_books_enabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.google_books_api_key}
                  onChange={(e) => setSettings({ ...settings, google_books_api_key: e.target.value })}
                  placeholder="Enter your Google Books API key"
                  disabled={!editing}
                  className="pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={testGoogleBooksAPI}
                variant="secondary"
                disabled={testing || !settings.google_books_api_key}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
            
            {/* Test Result */}
            {testResult && (
              <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {testResult.success ? (
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Usage Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>When enabled, book information can be automatically synced from Google Books</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Updates include descriptions, ISBNs, publication dates, and cover images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>You can manually trigger sync for individual books or batch sync multiple books</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>API quota: 1,000 requests per day (free tier)</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Supabase Configuration */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-green-50 rounded-lg">
            <Database className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Supabase Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Database and authentication service configuration
            </p>
            <a 
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2"
            >
              Manage your Supabase project
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="space-y-4">
          {/* Project URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSupabaseKeys.url ? 'text' : 'password'}
                  value={settings.supabase_url}
                  onChange={(e) => setSettings({ ...settings, supabase_url: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  disabled={!editing}
                  className="pr-10"
                />
                <button
                  onClick={() => setShowSupabaseKeys({...showSupabaseKeys, url: !showSupabaseKeys.url})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showSupabaseKeys.url ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Anonymous Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anonymous Key (Public)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSupabaseKeys.anonKey ? 'text' : 'password'}
                  value={settings.supabase_anon_key}
                  onChange={(e) => setSettings({ ...settings, supabase_anon_key: e.target.value })}
                  placeholder="eyJ..."
                  disabled={!editing}
                  className="pr-10"
                />
                <button
                  onClick={() => setShowSupabaseKeys({...showSupabaseKeys, anonKey: !showSupabaseKeys.anonKey})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showSupabaseKeys.anonKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Service Role Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Role Key (Secret)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSupabaseKeys.serviceKey ? 'text' : 'password'}
                  value={settings.supabase_service_role_key}
                  onChange={(e) => setSettings({ ...settings, supabase_service_role_key: e.target.value })}
                  placeholder="eyJ..."
                  disabled={!editing}
                  className="pr-10"
                />
                <button
                  onClick={() => setShowSupabaseKeys({...showSupabaseKeys, serviceKey: !showSupabaseKeys.serviceKey})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showSupabaseKeys.serviceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Supabase Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Status:</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Project URL:</span>
                <span className={`font-mono ${settings.supabase_url && settings.supabase_url !== '••••••••••••••••' ? 'text-green-700' : 'text-gray-500'}`}>
                  {settings.supabase_url && settings.supabase_url !== '••••••••••••••••' ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Anonymous Key:</span>
                <span className={`font-mono ${settings.supabase_anon_key && settings.supabase_anon_key !== '••••••••••••••••' ? 'text-green-700' : 'text-gray-500'}`}>
                  {settings.supabase_anon_key && settings.supabase_anon_key !== '••••••••••••••••' ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Role Key:</span>
                <span className={`font-mono ${settings.supabase_service_role_key && settings.supabase_service_role_key !== '••••••••••••••••' ? 'text-green-700' : 'text-gray-500'}`}>
                  {settings.supabase_service_role_key && settings.supabase_service_role_key !== '••••••••••••••••' ? 'Configured' : 'Not configured'}
                </span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Info:</strong> These settings are stored securely in the database and can be managed here. 
                  They serve as backup configuration and for administrative reference.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Coming Soon</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="p-2 bg-gray-100 rounded">
              <Key className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">OpenAI API</p>
              <p className="text-xs text-gray-500">AI-powered content generation</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="p-2 bg-gray-100 rounded">
              <Key className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Zoom Integration</p>
              <p className="text-xs text-gray-500">Virtual classroom sessions</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Success/Error Messages */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
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