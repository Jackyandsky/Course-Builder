'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  CogIcon,
  DocumentTextIcon,
  LanguageIcon,
  KeyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/components/auth/UserProfile';
import { cn } from '@/lib/utils';
import { contentService } from '@/lib/supabase/content';
import { ProprietaryProductCategory } from '@/types/content';

// Icon mapping for content categories
const categoryIcons: Record<string, any> = {
  'Decoders': KeyIcon,
  'Complete Study Packages': CubeIcon,
  'Standardizers': ClipboardDocumentCheckIcon,
  'LEX': LanguageIcon,
  'default': DocumentTextIcon,
};

// Function to generate URL-friendly slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

// Navigation item types
interface BaseNavigationItem {
  name: string;
  icon: any;
}

interface LinkNavigationItem extends BaseNavigationItem {
  href: string;
  isCategory?: never;
  children?: never;
  isSubsection?: boolean;
}

interface CategoryNavigationItem extends BaseNavigationItem {
  isCategory: true;
  children: LinkNavigationItem[];
  href?: never;
}

type NavigationItem = LinkNavigationItem | CategoryNavigationItem;

const staticNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Courses', href: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Books', href: '/admin/books', icon: BookOpenIcon },
  { name: 'Vocabulary', href: '/admin/vocabulary', icon: LanguageIcon },
];

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Content Products', 'Tools']);
  const [contentCategories, setContentCategories] = useState<any[]>([]);
  const [navigation, setNavigation] = useState<NavigationItem[]>(() => {
    // Try to get cached navigation from sessionStorage first
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('admin-navigation-cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Restore icons from the mapping
          const restoreIcons = (items: any[]): NavigationItem[] => {
            return items.map(item => {
              if (item.isCategory && item.children) {
                return {
                  ...item,
                  icon: categoryIcons[item.name] || CubeIcon,
                  children: item.children.map((child: any) => ({
                    ...child,
                    icon: categoryIcons[child.name] || categoryIcons.default
                  }))
                };
              }
              return {
                ...item,
                icon: staticNavigation.find(s => s.name === item.name)?.icon ||
                      categoryIcons[item.name] || categoryIcons.default
              };
            });
          };
          return restoreIcons(parsed);
        } catch (e) {
          console.log('Failed to parse cached navigation');
        }
      }
    }
    
    // Initialize with static navigation as fallback
    const fallbackNav = [...staticNavigation];
    const fallbackContentItem: CategoryNavigationItem = {
      name: 'Content Products',
      icon: CubeIcon,
      isCategory: true,
      children: [
        { name: 'Decoders', href: '/admin/decoders', icon: KeyIcon },
        { name: 'Standardizers', href: '/admin/standardizers', icon: ClipboardDocumentCheckIcon },
        { name: 'Complete Study Packages', href: '/admin/complete-study-packages', icon: CubeIcon, isSubsection: true },
        { name: 'LEX', href: '/admin/lex', icon: LanguageIcon }
      ]
    };
    const fallbackToolsItem: CategoryNavigationItem = {
      name: 'Tools',
      icon: WrenchScrewdriverIcon,
      isCategory: true,
      children: [
        { name: 'Essay Builder', href: '/admin/tools/essay-builder', icon: PencilSquareIcon }
      ]
    };
    fallbackNav.splice(fallbackNav.length, 0, fallbackContentItem);
    fallbackNav.splice(fallbackNav.length, 0, fallbackToolsItem);
    fallbackNav.push({ name: 'Users', href: '/admin/users', icon: UsersIcon });
    return fallbackNav;
  });
  const pathname = usePathname();

  // Load content categories with non-blocking approach
  useEffect(() => {
    let mounted = true;
    
    const loadCategories = async () => {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        // Fetch root categories with timeout and skip counts for faster loading
        const response = await fetch('/api/categories?parent_id=null&type=content&skipCounts=true', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const categories = await response.json();
        
        if (!mounted) return; // Check if still mounted
        
        setContentCategories(categories);
        
        // Build navigation items for each category
        const navigationItems: any[] = [];
        
        // Use Promise.all for parallel loading of subcategories
        const subcategoryPromises = categories.map(async (cat: any) => {
          try {
            // Only fetch subcategories for Standardizers
            if (cat.name === 'Standardizers') {
              const subController = new AbortController();
              const subTimeoutId = setTimeout(() => subController.abort(), 2000);
              
              const subResponse = await fetch(`/api/categories?parent_id=${cat.id}&skipCounts=true`, {
                signal: subController.signal
              });
              clearTimeout(subTimeoutId);
              
              if (subResponse.ok) {
                const subcategories = await subResponse.json();
                return { category: cat, subcategories };
              }
            }
            return { category: cat, subcategories: [] };
          } catch (error) {
            console.error(`Failed to load subcategories for ${cat.name}:`, error);
            return { category: cat, subcategories: [] };
          }
        });
        
        const results = await Promise.all(subcategoryPromises);
        
        if (!mounted) return; // Check again after async operations
        
        // Build navigation from results
        for (const { category, subcategories } of results) {
          navigationItems.push({
            name: category.name,
            href: `/admin/${generateSlug(category.name)}`,
            icon: categoryIcons[category.name] || categoryIcons.default,
          });
          
          // Add subcategories if any
          if (category.name === 'Standardizers' && subcategories && subcategories.length > 0) {
            subcategories.forEach((sub: any) => {
              navigationItems.push({
                name: sub.name,
                href: `/admin/${generateSlug(sub.name)}`,
                icon: categoryIcons[sub.name] || categoryIcons.default,
                isSubsection: true,
              });
            });
          }
        }
        
        // Build dynamic navigation for content categories
        const contentProductItem: CategoryNavigationItem = {
          name: 'Content Products',
          icon: CubeIcon,
          isCategory: true,
          children: navigationItems
        };
        
        // Add Tools section to navigation
        const toolsItem: CategoryNavigationItem = {
          name: 'Tools',
          icon: WrenchScrewdriverIcon,
          isCategory: true,
          children: [
            { name: 'Essay Builder', href: '/admin/tools/essay-builder', icon: PencilSquareIcon }
          ]
        };
        
        // Update navigation if still mounted
        if (mounted) {
          const newNav = [...staticNavigation];
          newNav.splice(newNav.length, 0, contentProductItem);
          newNav.splice(newNav.length, 0, toolsItem);
          newNav.push({ name: 'Users', href: '/admin/users', icon: UsersIcon });
          
          setNavigation(newNav);
          
          // Cache the navigation structure (without icons since they can't be serialized)
          if (typeof window !== 'undefined') {
            const navToCache = newNav.map(item => {
              if ('isCategory' in item && item.isCategory) {
                return {
                  name: item.name,
                  isCategory: true,
                  children: item.children.map(child => ({
                    name: child.name,
                    href: child.href,
                    isSubsection: child.isSubsection
                  }))
                };
              }
              return {
                name: item.name,
                href: item.href
              };
            });
            sessionStorage.setItem('admin-navigation-cache', JSON.stringify(navToCache));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Category loading timed out, using fallback navigation');
        } else {
          console.error('Failed to load content categories:', error);
        }
        // Navigation already initialized with fallback, no need to update
      }
    };

    // Load categories in background without blocking UI
    loadCategories();
    
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const renderNavigationItem = (item: NavigationItem, isMobile: boolean = false) => {
    if (item.isCategory) {
      // Always show expanded for Content Products
      return (
        <li key={item.name}>
          <div className="w-full group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700">
            <item.icon
              className="h-6 w-6 shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">{item.name}</span>
          </div>
          {item.children && (
            <ul className="ml-6 mt-1 space-y-1">
              {item.children.map((child: any) => {
                // Check if this is a subsection
                const isSubsection = child.isSubsection || false;
                // Check if this child is active
                const isChildActive = pathname.startsWith(child.href);
                
                return (
                  <li key={child.name}>
                    <Link
                      href={child.href}
                      className={cn(
                        isChildActive
                          ? 'bg-gray-50 text-primary-600'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6',
                        isSubsection ? 'ml-4 text-xs' : 'font-semibold'
                      )}
                      onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                    >
                      <child.icon
                        className={cn(
                          isChildActive
                            ? 'text-primary-600'
                            : 'text-gray-400 group-hover:text-primary-600',
                          isSubsection ? 'h-5 w-5 shrink-0' : 'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {child.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    } else {
      // Check if this is the active route
      const isActive = item.href === '/admin' 
        ? pathname === '/admin'
        : pathname.startsWith(item.href);
      
      return (
        <li key={item.name}>
          <Link
            href={item.href}
            className={cn(
              isActive
                ? 'bg-gray-50 text-primary-600'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
            )}
            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
          >
            <item.icon
              className={cn(
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 group-hover:text-primary-600',
                'h-6 w-6 shrink-0'
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        </li>
      );
    }
  };

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-xl font-bold text-primary-600">Admin Dashboard</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => renderNavigationItem(item, true))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-primary-600">Admin Dashboard</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => renderNavigationItem(item, false))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Top navigation - Similar to account header */}
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-x-4">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-blue-600">IGPS</span>
                </Link>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Dashboard Switcher */}
                <Link
                  href="/account"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Switch to Account Dashboard"
                >
                  <span className="hidden sm:inline">Account Dashboard</span>
                  <UsersIcon className="h-5 w-5 sm:hidden" aria-hidden="true" />
                </Link>
                <UserProfile />
              </div>
            </div>
          </div>
        </nav>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}