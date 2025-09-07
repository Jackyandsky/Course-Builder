'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type MembershipLevel = 'basic' | 'standard' | 'premium';

interface MembershipInfo {
  level: MembershipLevel;
  packageName?: string;
  purchaseDate?: string;
  features: string[];
}

export function useMembership() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<MembershipInfo>({
    level: 'basic',
    features: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMembership({ level: 'basic', features: [] });
      setLoading(false);
      return;
    }

    const fetchMembership = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check session storage cache first (SSR safe)
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          const cacheKey = `membership-${user.id}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache for 10 minutes
            if (Date.now() - timestamp < 600000) {
              setMembership(data);
              setLoading(false);
              return;
            }
          }
        }
        
        const response = await fetch('/api/account/membership', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch membership');
        }
        
        const data = await response.json();
        
        // Cache the result (SSR safe)
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          const cacheKey = `membership-${user.id}`;
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
        
        setMembership(data);
      } catch (err) {
        console.error('Error fetching membership:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMembership({ level: 'basic', features: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [user]);

  const isPremium = membership.level === 'premium';
  const isStandard = membership.level === 'standard' || membership.level === 'premium';
  
  return {
    membership,
    loading,
    error,
    isPremium,
    isStandard,
    refreshMembership: () => {
      if (user && typeof window !== 'undefined') {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(`membership-${user.id}`);
        }
        const event = new Event('membership-refresh');
        window.dispatchEvent(event);
      }
    }
  };
}