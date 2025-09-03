// In-memory cache for categories with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CategoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  // Prefetch categories on mount
  async prefetchCategories(): Promise<void> {
    try {
      const response = await fetch('/api/categories?type=content');
      if (response.ok) {
        const data = await response.json();
        this.set('content-categories', data);
        
        // Prefetch subcategories in parallel
        const subPromises = data.map((cat: any) => 
          fetch(`/api/categories?parent_id=${cat.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(subData => {
              if (subData) {
                this.set(`subcategories-${cat.id}`, subData);
              }
            })
        );
        
        await Promise.all(subPromises);
      }
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  }
}

export const categoryCache = new CategoryCache();