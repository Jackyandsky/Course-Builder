'use client';

import { useState, useEffect } from 'react';

interface HomepageItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  short_description?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  public_slug?: string;
  homepage_order: number;
  price?: number;
  is_free?: boolean;
  author?: string;
  featured?: boolean;
}

interface HomepageData {
  courses: HomepageItem[];
  books: HomepageItem[];
  content: HomepageItem[];
}

export function useHomepageItems() {
  const [homepageData, setHomepageData] = useState<HomepageData>({
    courses: [],
    books: [],
    content: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const response = await fetch('/api/navigation/homepage');
      if (response.ok) {
        const data = await response.json();
        setHomepageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch homepage items:', error);
    } finally {
      setLoading(false);
    }
  };

  return { homepageData, loading, refetch: fetchHomepageData };
}