'use client';

import { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  title?: string;
  name?: string;
  public_slug?: string;
  menu_order: number;
}

interface NavigationData {
  courses: MenuItem[];
  books: MenuItem[];
  content: MenuItem[];
  contentByCategory: Record<string, MenuItem[]>;
}

// Cache key and duration
const CACHE_KEY = 'navigation-menu-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: NavigationData;
  timestamp: number;
}

export function useNavigationMenu() {
  const [menuData, setMenuData] = useState<NavigationData>({
    courses: [],
    books: [],
    content: [],
    contentByCategory: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from cache first
    const cached = loadFromCache();
    if (cached) {
      setMenuData(cached);
      setLoading(false);
      
      // Still fetch in background to refresh if needed
      fetchMenuData(true);
    } else {
      fetchMenuData(false);
    }
  }, []);

  const loadFromCache = (): NavigationData | null => {
    // Don't access sessionStorage during SSR
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return null;
    }
    
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          return parsedCache.data;
        }
      }
    } catch (error) {
      console.error('Error loading navigation cache:', error);
    }
    return null;
  };

  const saveToCache = (data: NavigationData) => {
    // Don't access sessionStorage during SSR
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }
    
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving navigation cache:', error);
    }
  };

  const fetchMenuData = async (isBackgroundRefresh: boolean = false) => {
    try {
      // Add timeout to prevent long blocking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch('/api/navigation/menu', {
        signal: controller.signal,
        // Use cache-first strategy
        cache: 'force-cache',
        next: { revalidate: 300 } // Revalidate every 5 minutes
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
        saveToCache(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Navigation menu fetch timed out');
      } else {
        console.error('Failed to fetch navigation menu:', error);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const clearCache = () => {
    // Don't access sessionStorage during SSR
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }
    
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing navigation cache:', error);
    }
  };

  return { 
    menuData, 
    loading, 
    refetch: () => {
      clearCache();
      return fetchMenuData(false);
    }
  };
}