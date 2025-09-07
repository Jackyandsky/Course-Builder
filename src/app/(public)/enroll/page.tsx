'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, Check, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Service {
  order: number;
  name: string;
  description: string;
}

interface Package {
  id: string;
  title: string;
  description: string;
  recommended_level: string;
  services: Service[];
  price: number;
  payment_type: 'direct' | 'booking';
  is_active: boolean;
  features: string[];
  duration_months: number | null;
  display_order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price?: number;
  thumbnail_url?: string;
  public_slug?: string;
}

// Simplified cache configuration for better performance
const PACKAGES_CACHE_KEY = 'enroll-packages-cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes stale check

interface CacheData {
  packages: Package[];
  timestamp: number;
}

export default function EnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addToCart, items: cartItems, loading: cartLoading } = useCart();
  const { showInfo, showWarning } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [packages, setPackages] = useState<Package[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [dataAge, setDataAge] = useState<number>(0);
  const [localNotification, setLocalNotification] = useState<{ type: 'info' | 'warning' | 'success'; message: string } | null>(null);
  
  // Memoize courseId to prevent unnecessary re-renders
  const courseId = useMemo(() => searchParams.get('courseId') || '', [searchParams]);
  
  // Auto-clear local notification after 3 seconds
  useEffect(() => {
    if (localNotification) {
      const timer = setTimeout(() => {
        setLocalNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [localNotification]);

  // Simplified cache loading with SSR safety
  const loadCachedPackages = useCallback((): { packages: Package[] | null; isStale: boolean } => {
    // Don't access sessionStorage during SSR
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return { packages: null, isStale: false };
    }
    
    try {
      const cacheKey = courseId ? `${PACKAGES_CACHE_KEY}-${courseId}` : PACKAGES_CACHE_KEY;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        const now = Date.now();
        const age = now - cacheData.timestamp;
        
        if (age < CACHE_DURATION) {
          const isStale = age > STALE_THRESHOLD;
          setDataAge(age);
          return { packages: cacheData.packages, isStale };
        }
      }
    } catch (error) {
      console.error('Error loading cached packages:', error);
    }
    return { packages: null, isStale: false };
  }, [courseId]);

  // Save packages to cache with SSR safety
  const savePackagesToCache = useCallback((packagesData: Package[]) => {
    // Don't access sessionStorage during SSR
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }
    
    try {
      const cacheKey = courseId ? `${PACKAGES_CACHE_KEY}-${courseId}` : PACKAGES_CACHE_KEY;
      const cacheData: CacheData = {
        packages: packagesData,
        timestamp: Date.now()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving packages to cache:', error);
    }
  }, [courseId]);

  const fetchData = useCallback(async (isBackgroundRefresh: boolean = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      // Reduced timeout for better UX - 3 seconds max
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Simplified fetch with better caching
      const packagesUrl = courseId 
        ? `/api/packages?active=true&course_id=${courseId}`
        : `/api/packages?active=true`;
      
      const packagesResponse = await fetch(packagesUrl, { 
        signal: controller.signal,
        cache: isBackgroundRefresh ? 'force-cache' : 'default',
        headers: {
          'Cache-Control': isBackgroundRefresh ? 'max-age=300' : 'max-age=60'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
        savePackagesToCache(packagesData);
        
        // Auto-select package only on first load
        if (!selectedPackage && packagesData.length > 0) {
          if (packagesData.length === 1) {
            setSelectedPackage(packagesData[0].id);
          } else {
            const recommended = packagesData.find((p: Package) => 
              p.recommended_level?.toLowerCase() === 'intermediate'
            );
            setSelectedPackage(recommended?.id || packagesData[0].id);
          }
        }
        
        // Fetch course data separately if needed
        if (courseId && !course) {
          try {
            const courseResponse = await fetch(`/api/public/courses/${courseId}`, {
              cache: 'default',
              headers: { 'Cache-Control': 'max-age=300' }
            });
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              setCourse(courseData);
            }
          } catch (courseError) {
            console.debug('Course fetch failed:', courseError);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request timed out, using cached data');
      } else {
        console.error('Error fetching packages:', error);
      }
      
      // If no cached data and fetch failed, try once more with minimal timeout
      if (packages.length === 0 && !isBackgroundRefresh) {
        try {
          const fallbackResponse = await fetch('/api/packages?active=true', {
            signal: AbortSignal.timeout(1000) // 1 second timeout for fallback
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
              setPackages(fallbackData);
              savePackagesToCache(fallbackData);
            }
          }
        } catch (fallbackError) {
          console.debug('Fallback request also failed:', fallbackError);
        }
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, [courseId, selectedPackage, course, savePackagesToCache]);

  useEffect(() => {
    // Simplified loading with cache check
    const { packages: cachedPackages, isStale } = loadCachedPackages();
    
    if (cachedPackages && cachedPackages.length > 0) {
      setPackages(cachedPackages);
      setLoading(false);
      
      // Refresh in background if stale
      if (isStale) {
        fetchData(true);
      }
    } else {
      // Fetch fresh data
      fetchData(false);
    }
  }, [courseId, loadCachedPackages, fetchData]);

  // Simplified cache invalidation - only check on focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const { packages: cachedPackages, isStale } = loadCachedPackages();
        if (isStale) {
          fetchData(true); // Background refresh when page becomes visible
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadCachedPackages, fetchData]);

  const handleContinue = async () => {
    if (!selectedPackage) return;
    
    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    // Clear any existing notification
    setLocalNotification(null);

    // Check if the package and course are already in the cart
    if (isCompleteSetInCart) {
      setLocalNotification({
        type: 'info',
        message: 'Already in cart! Ready to checkout →'
      });
      return;
    }

    // Quick course ownership check (non-blocking)
    if (courseId && user) {
      fetch(`/api/courses/${courseId}/purchase-status`, { 
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (data?.purchased) {
            setLocalNotification({
              type: 'info',
              message: 'You already own this course!'
            });
          }
        })
        .catch(() => {
          // Silently fail - user can still proceed
        });
    }

    // Check payment type to determine the flow
    if (pkg.payment_type === 'direct') {
      // Direct purchase - add to cart
      if (!user) {
        // Use streamlined enrollment auth page for better UX
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/enroll/auth?redirect=${encodeURIComponent(currentUrl)}&courseId=${courseId || ''}`);
        return;
      }

      try {
        setAddingToCart(true);
        
        // Add package to cart
        await addToCart({
          item_type: 'package',
          item_id: pkg.id,
          title: pkg.title,
          price: pkg.price,
          thumbnail_url: undefined,
          slug: pkg.id,
        });
        
        // If there's a course associated, add it to cart as well
        if (courseId && course) {
          await addToCart({
            item_type: 'course',
            item_id: courseId,
            title: course.title,
            price: 0, // Course price is included in package price
            thumbnail_url: course.thumbnail_url,
            slug: course.public_slug || courseId,
          });
        }
        
        // Show success notification
        setLocalNotification({
          type: 'success',
          message: 'Added to cart! ✓'
        });
        
      } catch (error) {
        console.error('Error adding package and course to cart:', error);
        setLocalNotification({
          type: 'warning',
          message: 'Oops! Please try again.'
        });
      } finally {
        setAddingToCart(false);
      }
    } else {
      // Booking flow - continue to commitment page
      const params = new URLSearchParams();
      params.append('packageId', selectedPackage);
      if (courseId) params.append('courseId', courseId);
      router.push(`/enroll/commitment?${params.toString()}`);
    }
  };

  // Memoized cart calculations to prevent unnecessary re-renders
  const isPackageInCart = useMemo(() => 
    selectedPackage ? cartItems.some(item => item.item_type === 'package' && item.item_id === selectedPackage) : false,
    [selectedPackage, cartItems]
  );
  
  const isCourseInCart = useMemo(() => 
    courseId ? cartItems.some(item => item.item_type === 'course' && item.item_id === courseId) : true,
    [courseId, cartItems]
  );
  
  const isCompleteSetInCart = useMemo(() => 
    isPackageInCart && isCourseInCart,
    [isPackageInCart, isCourseInCart]
  );

  const getPopularityText = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'Perfect for beginners';
      case 'intermediate':
        return 'Most popular choice';
      case 'advanced':
        return 'For serious learners';
      default:
        return 'Recommended';
    }
  };

  // Enhanced loading state with better skeleton and timeout protection
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--igps-landing-background)]">
        <div className="max-w-[1200px] mx-auto px-[20px] py-[80px]">
          <div className="text-center mb-[60px]">
            <div className="h-[48px] w-[min(600px,90%)] bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-[24px] w-[min(400px,70%)] bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-[20px] mb-[60px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[14px] p-[30px] shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                {/* More detailed skeleton */}
                <div className="space-y-4">
                  <div className="h-[24px] w-[80%] bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-[32px] w-[60%] bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-[16px] w-[90%] bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-[16px] w-[70%] bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-2 mt-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center space-x-2">
                        <div className="h-[16px] w-[16px] bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-[16px] w-[80%] bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500 mb-4">
            {dataAge > 0 
              ? `Refreshing packages... (using cached data from ${Math.round(dataAge / 1000)}s ago)`
              : 'Loading enrollment packages...'
            }
          </div>
          {loading && (
            <div className="text-center text-xs text-gray-400">
              This should only take a few seconds. If loading persists, please refresh the page.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--igps-landing-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[var(--igps-landing-text-color)]">No packages available at this time.</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 text-[var(--igps-landing-btn-color)] hover:underline"
          >
            ← Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--igps-landing-background)]" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
      <div className="max-w-[1200px] mx-auto px-[20px] py-[80px]">
        <div className="text-center mb-[60px]">
          <h1 className="text-[48px] font-bold mb-[18px] text-[var(--igps-landing-text-color)] tracking-[-0.022em] leading-[1.08]" style={{ fontWeight: 700 }}>
            Choose Your <em className="text-[var(--igps-landing-btn-color)] not-italic">Educational Journey</em>
          </h1>
          {course && (
            <p className="text-[18px] text-[var(--igps-landing-text-color)] mb-[8px]">
              For: <strong>{course.title}</strong>
            </p>
          )}
          <p className="text-[24px] font-medium max-w-[800px] mx-auto text-[var(--igps-landing-text-color)] leading-[1.1]" style={{ fontWeight: 500 }}>
            Select the program package that perfectly aligns with your <strong>academic goals</strong> and learning commitment
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid lg:grid-cols-3 gap-[20px] mb-[60px]">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative cursor-pointer transition-all duration-300 bg-white rounded-[14px] border-0 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-[3px] ${
                selectedPackage === pkg.id
                  ? 'ring-2 ring-[var(--igps-landing-btn-color)] shadow-[0_4px_16px_rgba(0,113,227,0.15)]'
                  : ''
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {/* Payment Type Badge - Top Right Corner */}
              <div className="absolute top-[12px] right-[12px]">
                <span className={`inline-block px-[8px] py-[2px] rounded-[6px] text-[10px] font-medium uppercase tracking-[0.05em] ${
                  pkg.payment_type === 'direct' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {pkg.payment_type === 'direct' ? 'Instant Access' : 'Schedule Consultation'}
                </span>
              </div>
              
              <div className="p-[30px] pt-[40px] text-center">
                <div className="mb-[20px]">
                  <h3 className="text-[28px] font-bold mb-[6px] text-[var(--igps-landing-text-color)] leading-[1.125]" style={{ fontWeight: 700 }}>
                    {pkg.title}
                  </h3>
                  <div className="text-[24px] font-bold text-[var(--igps-landing-btn-color)] mb-[8px]">
                    ${pkg.price}
                  </div>
                  <p className="text-[16px] font-medium text-[var(--igps-landing-text-color)] mb-[12px] leading-[1.25]" style={{ fontWeight: 500 }}>
                    {pkg.description}
                  </p>
                  <div className="inline-block bg-[#f8f8f8] text-[var(--igps-landing-btn-color)] px-[10px] py-[4px] rounded-[8px] text-[11px] font-medium uppercase tracking-[0.05em]" style={{ fontWeight: 500 }}>
                    {getPopularityText(pkg.recommended_level)}
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-[8px] mb-[20px] text-left">
                  {pkg.services
                    .sort((a, b) => a.order - b.order)
                    .map((service, index) => (
                      <div key={index} className="flex items-start gap-[10px]">
                        <Check className="h-[16px] w-[16px] text-[var(--igps-landing-btn-color)] mt-[1px] flex-shrink-0" />
                        <div>
                          <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.4] font-medium" style={{ fontWeight: 500 }}>
                            {service.name}
                          </span>
                          {service.description && (
                            <p className="text-[11px] text-[#86868b] leading-[1.4]">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="border-t pt-[12px]">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-[6px] mb-[4px]">
                        <div className="w-[4px] h-[4px] bg-[var(--igps-landing-btn-color)] rounded-full" />
                        <span className="text-[11px] text-[var(--igps-landing-text-color)]">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center relative">
          {/* Local Notification - Floating above the button */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 pointer-events-none transition-all duration-300 ease-out ${
            localNotification ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-0'
          }`}>
            {localNotification && (
              <div className={`px-5 py-3 rounded-full shadow-xl backdrop-blur-sm flex items-center gap-3 whitespace-nowrap ${
                localNotification.type === 'success' 
                  ? 'bg-green-600/95 text-white' 
                  : localNotification.type === 'warning'
                  ? 'bg-amber-600/95 text-white'
                  : 'bg-blue-600/95 text-white'
              }`}>
                <div className="flex-shrink-0">
                  {localNotification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                  {localNotification.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                  {localNotification.type === 'info' && <Info className="h-4 w-4" />}
                </div>
                <p className="text-sm font-medium pr-1">{localNotification.message}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={isCompleteSetInCart && packages.find(p => p.id === selectedPackage)?.payment_type === 'direct' 
              ? () => router.push('/checkout') 
              : handleContinue}
            disabled={!selectedPackage || addingToCart || cartLoading}
            className={`inline-block px-[30px] py-[12px] rounded-[980px] text-[17px] font-normal transition-all duration-200 no-underline ${
              selectedPackage && !addingToCart && !cartLoading
                ? 'bg-[var(--igps-landing-btn-color)] text-white hover:bg-[#0077ed] cursor-pointer'
                : 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
            }`}
            style={{ fontWeight: 400 }}
          >
            {!selectedPackage ? (
              'Please select your package'
            ) : addingToCart || cartLoading ? (
              <span className="flex items-center gap-[8px]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {courseId ? 'Adding package + course...' : 'Adding to cart...'}
              </span>
            ) : isCompleteSetInCart && packages.find(p => p.id === selectedPackage)?.payment_type === 'direct' ? (
              <span className="flex items-center gap-[8px]">
                <strong>Go to Checkout</strong>
                <ArrowRight className="h-[16px] w-[16px]" />
              </span>
            ) : (
              <span className="flex items-center gap-[8px]">
                <strong>
                  {packages.find(p => p.id === selectedPackage)?.payment_type === 'direct' 
                    ? courseId ? 'Add Package + Course to Cart' : 'Add Package to Cart'
                    : 'Continue with Selected Package'}
                </strong>
                <ArrowRight className="h-[16px] w-[16px]" />
              </span>
            )}
          </button>
          {selectedPackage && !isCompleteSetInCart && (
            <p className="text-[13px] text-[#86868b] mt-[15px] leading-[1.5]" style={{ fontWeight: 400 }}>
              {packages.find(p => p.id === selectedPackage)?.payment_type === 'direct' 
                ? courseId 
                  ? <>Next: <em>Review package + course in cart</em></>
                  : <>Next: <em>Review package in cart</em></>
                : <>Next: Design your <em>personalized study schedule</em></>}
            </p>
          )}
          {selectedPackage && isCompleteSetInCart && packages.find(p => p.id === selectedPackage)?.payment_type === 'direct' && (
            <p className="text-[13px] text-green-600 mt-[15px] leading-[1.5]" style={{ fontWeight: 400 }}>
              ✓ {courseId ? 'Package + Course' : 'Package'} added to cart! <em>Ready for checkout</em>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}