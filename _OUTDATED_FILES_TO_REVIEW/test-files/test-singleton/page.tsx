'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TestSingletonPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    
    try {
      // Test 1: Check if multiple calls return same instance
      const client1 = createSupabaseClient();
      const client2 = createSupabaseClient();
      const client3 = createSupabaseClient();
      
      const instanceTests = {
        'client1 === client2': client1 === client2,
        'client1 === client3': client1 === client3,
        'client2 === client3': client2 === client3,
      };
      
      // Test 2: Session consistency
      const { data: session1 } = await client1.auth.getSession();
      const { data: session2 } = await client2.auth.getSession();
      const { data: session3 } = await client3.auth.getSession();
      
      const sessionTests = {
        hasSession1: !!session1.session,
        hasSession2: !!session2.session,
        hasSession3: !!session3.session,
        allSessionsMatch: session1.session?.user?.id === session2.session?.user?.id && 
                         session2.session?.user?.id === session3.session?.user?.id
      };
      
      // Test 3: Database query consistency
      const start = Date.now();
      const [result1, result2, result3] = await Promise.all([
        client1.from('user_profiles').select('*', { count: 'exact', head: true }),
        client2.from('user_profiles').select('*', { count: 'exact', head: true }),
        client3.from('user_profiles').select('*', { count: 'exact', head: true })
      ]);
      const queryTime = Date.now() - start;
      
      // Test 4: Memory test - create many references
      const memoryTest = [];
      for (let i = 0; i < 100; i++) {
        memoryTest.push(createSupabaseClient());
      }
      const allSameInstance = memoryTest.every(client => client === client1);
      
      setResults({
        timestamp: new Date().toISOString(),
        environment: 'client',
        instanceTests,
        sessionTests,
        databaseTests: {
          count1: result1.count,
          count2: result2.count,
          count3: result3.count,
          allCountsMatch: result1.count === result2.count && result2.count === result3.count,
          queryTime: `${queryTime}ms`
        },
        memoryTest: {
          created100References: true,
          allSameInstance,
          conclusion: allSameInstance ? 
            '✅ Singleton working correctly - all 100 references point to same instance' : 
            '❌ Singleton not working - multiple instances created'
        }
      });
      
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Supabase Singleton Test</h1>
          <p className="text-gray-600">Testing if Supabase client follows "one entity per lifecycle" principle</p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run Tests Again'}
        </Button>
      </div>

      {results && (
        <Card>
          <Card.Header>
            <Card.Title>Test Results</Card.Title>
          </Card.Header>
          <Card.Content>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Expected Behavior</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-2">
          <p>✅ All client instances should be the same (singleton pattern)</p>
          <p>✅ Sessions should be consistent across all instances</p>
          <p>✅ Database queries should return same results</p>
          <p>✅ Creating 100 references should all point to same instance</p>
          <p>✅ Tab switching should maintain session (check console logs)</p>
        </Card.Content>
      </Card>
    </div>
  );
}