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

export function useNavigationMenu() {
  const [menuData, setMenuData] = useState<NavigationData>({
    courses: [],
    books: [],
    content: [],
    contentByCategory: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const response = await fetch('/api/navigation/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
      }
    } catch (error) {
      console.error('Failed to fetch navigation menu:', error);
    } finally {
      setLoading(false);
    }
  };

  return { menuData, loading, refetch: fetchMenuData };
}