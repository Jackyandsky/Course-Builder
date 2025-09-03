'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  CreditCard, Key, Shield, AlertCircle, Check, X,
  Save, Edit2, Loader2, TestTube, Globe, Webhook
} from 'lucide-react';

interface PaymentSettings {
  stripe_mode: 'test' | 'live';
  stripe_test_publishable_key: string;
  stripe_test_secret_key: string;
  stripe_live_publishable_key: string;
  stripe_live_secret_key: string;
  stripe_webhook_secret: string;
  payment_methods: string[];
  currency: string;
  tax_enabled: boolean;
  tax_percentage: number;
  auto_tax: boolean;
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_mode: 'test',
    stripe_test_publishable_key: '',
    stripe_test_secret_key: '',
    stripe_live_publishable_key: '',
    stripe_live_secret_key: '',
    stripe_webhook_secret: '',
    payment_methods: ['card'],
    currency: 'CAD',
    tax_enabled: false,
    tax_percentage: 0,
    auto_tax: false
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/payments');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      showMessage('error', 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showMessage('success', 'Payment settings saved successfully');
        setEditing(false);
        setShowKeys(false);
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

  const testConnection = async () => {
    try {
      const response = await fetch('/api/admin/settings/payments/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: settings.stripe_mode,
          key: settings.stripe_mode === 'test' ? 
            settings.stripe_test_secret_key : 
            settings.stripe_live_secret_key
        }),
      });

      if (response.ok) {
        showMessage('success', 'Stripe connection successful');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Connection failed');
      }
    } catch (error) {
      showMessage('error', 'Failed to test connection');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure Stripe and payment options</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="secondary">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditing(false);
                setShowKeys(false);
                loadSettings();
              }}
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

      {/* Security Notice */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Security Notice</p>
            <p className="mt-1">API keys are encrypted before storage and only accessible to admin users.</p>
          </div>
        </div>
      </Card>

      {/* Stripe Mode */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stripe Mode</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => editing && setSettings({ ...settings, stripe_mode: 'test' })}
            disabled={!editing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              settings.stripe_mode === 'test'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
            } ${!editing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <TestTube className="inline h-4 w-4 mr-2" />
            Test Mode
          </button>
          <button
            onClick={() => editing && setSettings({ ...settings, stripe_mode: 'live' })}
            disabled={!editing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              settings.stripe_mode === 'live'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
            } ${!editing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <Globe className="inline h-4 w-4 mr-2" />
            Live Mode
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {settings.stripe_mode === 'test' 
            ? 'Test mode - Use test cards for development'
            : 'Live mode - Real payments will be processed'}
        </p>
      </Card>

      {/* API Keys */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Stripe API Keys</h3>
          {editing && (
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showKeys ? 'Hide Keys' : 'Show Keys'}
            </button>
          )}
        </div>

        {settings.stripe_mode === 'test' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Publishable Key
              </label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={settings.stripe_test_publishable_key}
                onChange={(e) => setSettings({ ...settings, stripe_test_publishable_key: e.target.value })}
                disabled={!editing}
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Secret Key
              </label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={settings.stripe_test_secret_key}
                onChange={(e) => setSettings({ ...settings, stripe_test_secret_key: e.target.value })}
                disabled={!editing}
                placeholder="sk_test_..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Live Publishable Key
              </label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={settings.stripe_live_publishable_key}
                onChange={(e) => setSettings({ ...settings, stripe_live_publishable_key: e.target.value })}
                disabled={!editing}
                placeholder="pk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Live Secret Key
              </label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={settings.stripe_live_secret_key}
                onChange={(e) => setSettings({ ...settings, stripe_live_secret_key: e.target.value })}
                disabled={!editing}
                placeholder="sk_live_..."
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Webhook className="inline h-4 w-4 mr-1" />
            Webhook Secret
          </label>
          <Input
            type={showKeys ? 'text' : 'password'}
            value={settings.stripe_webhook_secret}
            onChange={(e) => setSettings({ ...settings, stripe_webhook_secret: e.target.value })}
            disabled={!editing}
            placeholder="whsec_..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Webhook endpoint: {typeof window !== 'undefined' && window.location.origin}/api/webhooks/stripe
          </p>
        </div>

        {!editing && (
          <Button onClick={testConnection} variant="secondary" className="mt-4">
            <TestTube className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
        )}
      </Card>

      {/* Payment Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Options</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Methods
            </label>
            <div className="space-y-2">
              {['card', 'alipay', 'wechat_pay'].map((method) => (
                <label key={method} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes(method)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          payment_methods: [...settings.payment_methods, method]
                        });
                      } else {
                        setSettings({
                          ...settings,
                          payment_methods: settings.payment_methods.filter(m => m !== method)
                        });
                      }
                    }}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {method.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Tax</p>
              <p className="text-xs text-gray-500">Add tax to purchases</p>
            </div>
            <button
              onClick={() => editing && setSettings({ ...settings, tax_enabled: !settings.tax_enabled })}
              disabled={!editing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.tax_enabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${!editing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.tax_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.tax_enabled && (
            <div className="ml-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Percentage
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.tax_percentage}
                  onChange={(e) => setSettings({ ...settings, tax_percentage: parseFloat(e.target.value) })}
                  disabled={!editing}
                  placeholder="e.g., 13"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_tax}
                  onChange={(e) => setSettings({ ...settings, auto_tax: e.target.checked })}
                  disabled={!editing}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Use Stripe Tax (automatic tax calculation)
                </label>
              </div>
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