'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function TestAuthPage() {
  const { user } = useAuth();
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    if (!user) {
      setAuthData({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    try {
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setAuthData({
        user_id: user.id,
        email: user.email,
        profile,
        profile_error: profileError?.message
      });
    } catch (error: any) {
      setAuthData({ error: error.message });
    }
    setLoading(false);
  };

  const testUserCreation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-auth');
      const data = await response.json();
      setAuthData(data);
    } catch (error: any) {
      setAuthData({ error: error.message });
    }
    setLoading(false);
  };

  const testCreateTeacher = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test.teacher.${Date.now()}@example.com`,
          full_name: 'Test Teacher',
          role: 'teacher',
          send_invitation: true
        })
      });
      
      const data = await response.json();
      console.log('Create teacher response:', data);
      setAuthData((prev: any) => ({
        ...prev,
        create_teacher_result: data,
        create_teacher_status: response.status
      }));
    } catch (error: any) {
      setAuthData((prev: any) => ({
        ...prev,
        create_teacher_error: error.message
      }));
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      
      <div className="flex gap-4">
        <Button onClick={checkAuth} disabled={loading}>
          Check Auth Status
        </Button>
        <Button onClick={testUserCreation} disabled={loading}>
          Test Full Auth Check
        </Button>
        <Button onClick={testCreateTeacher} disabled={loading}>
          Test Create Teacher
        </Button>
      </div>

      <Card>
        <Card.Content className="p-6">
          <pre className="text-sm overflow-auto">
            {loading ? 'Loading...' : JSON.stringify(authData, null, 2)}
          </pre>
        </Card.Content>
      </Card>
    </div>
  );
}