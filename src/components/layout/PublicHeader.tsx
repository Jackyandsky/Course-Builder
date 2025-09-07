'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useMembership } from '@/hooks/useMembership';
import { Menu, X, ShoppingCart, User } from 'lucide-react';
import MiniCart from '@/components/cart/MiniCart';
import { MembershipAvatarBadge } from '@/components/ui/MembershipBadge';

interface MenuItem {
  id: string;
  title?: string;
  name?: string;
  public_slug?: string;
  menu_order: number;
}

interface DropdownContent {
  title: string;
  items: { 
    name: string; 
    href: string;
    subItems?: { name: string; href: string }[];
  }[];
}

interface CategorySection {
  title: string;
  categoryHref: string;
  items: { 
    name: string; 
    href: string;
  }[];
}

interface NavigationItem {
  name: string;
  href: string;
  hasDropdown: boolean;
  dropdownContent?: {
    column1: DropdownContent;
    column2: DropdownContent;
  };
  categoryDropdownContent?: {
    sections: CategorySection[];
  };
}

export default function PublicHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { membership } = useMembership();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [menuData, setMenuData] = useState<{
    courses: MenuItem[];
    books: MenuItem[];
    content: MenuItem[];
    contentByCategory: { [key: string]: MenuItem[] };
    categories: {
      courses: { id: string; name: string }[];
      books: { id: string; name: string }[];
      content: { id: string; name: string }[];
    };
  }>({
    courses: [],
    books: [],
    content: [],
    contentByCategory: {},
    categories: {
      courses: [],
      books: [],
      content: []
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Fetch menu items from the API
    const fetchMenuItems = async () => {
      try {
        // Add cache to prevent duplicate fetches in browser
        const response = await fetch('/api/navigation/menu', {
          cache: 'default', // Use browser cache
        });
        if (response.ok && mounted) {
          const data = await response.json();
          setMenuData({
            courses: data.courses || [],
            books: data.books || [],
            content: data.content || [],
            contentByCategory: data.contentByCategory || {},
            categories: data.categories || {
              courses: [],
              books: [],
              content: []
            }
          });
        } else if (!response.ok) {
          console.error('Menu API response not OK:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };
    
    fetchMenuItems();
    
    return () => {
      mounted = false;
    };
  }, []);

  const navigationItems: NavigationItem[] = [
    {
      name: 'Courses',
      href: '/courses',
      hasDropdown: true,
      dropdownContent: {
        column1: {
          title: 'Courses',
          items: [
            // Dynamic courses from database - ALL courses in 3 columns
            ...menuData.courses.map(course => ({
              name: course.title || '',
              href: course.public_slug ? `/courses/${course.public_slug}` : `/courses/${course.id}`
            }))
          ]
        },
        column2: {
          title: 'Categories',
          items: menuData.categories.courses.length > 0 
            ? menuData.categories.courses.map(cat => ({
                name: cat.name,
                href: `/courses?category=${encodeURIComponent(cat.name)}`
              }))
            : [
                { name: 'Systematic Writing', href: '/courses?category=Systematic%20Writing' },
                { name: 'Foreign Languages', href: '/courses?category=Foreign%20Languages' },
                { name: 'Standardized Testing', href: '/courses?category=Standardized%20Testing' },
                { name: 'Customized Programs', href: '/courses?category=Customized%20Programs' }
              ]
        }
      }
    },
    {
      name: 'Library',
      href: '/library',
      hasDropdown: true,
      dropdownContent: {
        column1: {
          title: 'Libraries',
          items: [
            // Dynamic books from database (up to 8)
            ...menuData.books.slice(0, 8).map(book => ({
              name: book.title || '',
              href: book.public_slug ? `/library/${book.public_slug}` : `/library/${book.id}`
            }))
          ]
        },
        column2: {
          title: 'Categories',
          items: menuData.categories.books.length > 0
            ? menuData.categories.books.map(cat => ({
                name: cat.name,
                href: `/library?category=${encodeURIComponent(cat.name)}`
              }))
            : [
                { name: 'Virtual Library', href: '/library?category=Virtual%20Library' },
                { name: 'Physical Library', href: '/library?category=Physical%20Library' },
                { name: 'Academic Resources', href: '/library?category=Academic' },
                { name: 'Professional Development', href: '/library?category=Professional' }
              ]
        }
      }
    },
    {
      name: 'Store',
      href: '/store',
      hasDropdown: true,
      categoryDropdownContent: {
        sections: (() => {
          const targetCategories = ['Standardizers', 'Complete Study Packages', 'Decoders', 'LEX'];
          
          return targetCategories.map(categoryName => {
            // Find the category in the database
            const category = menuData.categories.content.find(cat => 
              cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
              categoryName.toLowerCase().includes(cat.name.toLowerCase())
            );
            
            // Get content for this category
            const categoryItems = category && menuData.contentByCategory[category.id] 
              ? menuData.contentByCategory[category.id].slice(0, 8).map(item => ({
                  name: item.name || '',
                  href: item.public_slug ? `/store/${item.public_slug}` : `/store/${item.id}`
                }))
              : [];
            
            return {
              title: categoryName,
              categoryHref: `/store?category=${encodeURIComponent(categoryName)}`,
              items: categoryItems
            };
          });
        })()
      }
    },
    {
      name: 'Booking',
      href: '/booking',
      hasDropdown: true,
      dropdownContent: {
        column1: {
          title: 'Diagnostic Assessment',
          items: [
            { name: 'Grade 1-2', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 1', href: '/booking/diagnosis?grade=1' },
              { name: 'Grade 2', href: '/booking/diagnosis?grade=2' }
            ]},
            { name: 'Grade 3-4', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 3', href: '/booking/diagnosis?grade=3' },
              { name: 'Grade 4', href: '/booking/diagnosis?grade=4' }
            ]},
            { name: 'Grade 5-6', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 5', href: '/booking/diagnosis?grade=5' },
              { name: 'Grade 6', href: '/booking/diagnosis?grade=6' }
            ]},
            { name: 'Grade 7-8', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 7', href: '/booking/diagnosis?grade=7' },
              { name: 'Grade 8', href: '/booking/diagnosis?grade=8' }
            ]},
            { name: 'Grade 9-10', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 9', href: '/booking/diagnosis?grade=9' },
              { name: 'Grade 10', href: '/booking/diagnosis?grade=10' }
            ]},
            { name: 'Grade 11-12', href: '/booking/diagnosis', subItems: [
              { name: 'Grade 11', href: '/booking/diagnosis?grade=11' },
              { name: 'Grade 12', href: '/booking/diagnosis?grade=12' }
            ]}
          ]
        },
        column2: {
          title: 'Progress Review',
          items: [
            { name: 'Schedule Review', href: '/booking/progress-review' }
          ]
        }
      }
    },
    {
      name: 'About',
      href: '/about',
      hasDropdown: false
    },
    {
      name: 'Support',
      href: '/support',
      hasDropdown: false
    }
  ];

  return (
    <>
      {/* Header */}
      <header 
        className={`
          fixed top-0 left-0 right-0 z-[100] 
          transition-all duration-300
          ${scrolled 
            ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50' 
            : 'bg-white/90 backdrop-blur-xl'
          }
        `}
      >
        <nav className="mx-auto max-w-[980px] px-5">
          <div className="flex items-center justify-between h-11">
            {/* Logo and Title - Acts as Home Link */}
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <Image
                src="/api/logo"
                alt="IGPS Logo"
                width={100}
                height={30}
                className="h-[30px] w-auto"
              />
              <span className="text-xl font-semibold hidden md:inline">
                I GRAMMATICOS PLATFORM SOLUTION
              </span>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-6 list-none m-0 p-0">
              {navigationItems.map((item) => (
                <li 
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => {
                    if (item.hasDropdown) {
                      setActiveDropdown(item.name);
                    } else {
                      setActiveDropdown(null);
                    }
                  }}
                >
                  <Link 
                    href={item.href}
                    className="text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors py-3 font-normal"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMiniCartOpen(!isMiniCartOpen)}
                className="p-1.5 hover:bg-gray-100/50 rounded-full transition-colors relative"
                title="Shopping Cart"
              >
                <ShoppingCart className="h-[15px] w-[15px] text-[#1d1d1f]/80" />
                {/* Cart count badge */}
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
              {user ? (
                <Link 
                  href="/account"
                  className="relative p-1.5 hover:bg-gray-100/50 rounded-full transition-colors"
                  title="My Account"
                >
                  <User className="h-[15px] w-[15px] text-[#1d1d1f]/80" />
                  {membership && <MembershipAvatarBadge level={membership.level} />}
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors font-normal"
                >
                  Sign In
                </Link>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden p-1.5 hover:bg-gray-100/50 rounded-full transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-[15px] w-[15px] text-[#1d1d1f]/80" />
                ) : (
                  <Menu className="h-[15px] w-[15px] text-[#1d1d1f]/80" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Dropdown Menus */}
        {navigationItems.map((item) => (
          item.hasDropdown && activeDropdown === item.name && (
            <div 
              key={`${item.name}-dropdown`}
              className={item.name === 'Courses' ? "absolute top-full left-0 right-0 bg-white border-t border-gray-200/50 max-h-[53vh] overflow-y-auto" : "absolute top-full left-0 right-0 bg-white border-t border-gray-200/50"}
              style={{
                animation: 'dropdownFadeIn 0.32s cubic-bezier(0.4, 0, 0.6, 1)',
              }}
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className={item.name === 'Store' ? "max-w-[1700px] mx-auto px-[22px] py-10" : item.name === 'Courses' ? "max-w-[1400px] mx-auto px-[22px] py-10" : "max-w-[980px] mx-auto px-[22px] py-10"}>
                {/* Store Category Layout */}
                {item.name === 'Store' && item.categoryDropdownContent ? (
                  <div className="grid grid-cols-4 gap-[30px]">
                    {item.categoryDropdownContent.sections.map((section, index) => (
                      <div key={index} className="min-w-0">
                        <Link 
                          href={section.categoryHref}
                          className="text-[12px] text-[#6e6e73] font-normal mb-3 block hover:text-[#0066cc] transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {section.title}
                        </Link>
                        <ul className="space-y-[8px]">
                          {section.items.map((contentItem, itemIndex) => (
                            <li key={`${contentItem.href}-${itemIndex}`}>
                              <Link
                                href={contentItem.href}
                                className="text-[21px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.19048]"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {contentItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Default Two-Column Layout - Special handling for Courses */
                  <div className={item.name === 'Courses' ? "grid grid-cols-5 gap-[30px]" : "grid grid-cols-2 gap-[30px]"}>
                    {/* Column 1 - Content List (Courses/Books) */}
                    {item.name === 'Courses' ? (
                      // Special 4-column layout for Courses
                      <div className="col-span-4">
                        <p className="text-[12px] text-[#6e6e73] font-normal mb-3">
                          {item.dropdownContent?.column1.title}
                        </p>
                        <div className="grid grid-cols-4 gap-x-6">
                          {(() => {
                            const courses = item.dropdownContent?.column1.items || [];
                            const coursesPerColumn = Math.ceil(courses.length / 4);
                            const maxPerColumn = Math.min(coursesPerColumn, 60); // Cap at 60 items per column
                            const column1 = courses.slice(0, maxPerColumn);
                            const column2 = courses.slice(maxPerColumn, maxPerColumn * 2);
                            const column3 = courses.slice(maxPerColumn * 2, maxPerColumn * 3);
                            const column4 = courses.slice(maxPerColumn * 3, maxPerColumn * 4);
                            
                            return (
                              <>
                                <ul className="space-y-[4px]">
                                  {column1.map((subItem) => (
                                    <li key={subItem.href}>
                                      <Link
                                        href={subItem.href}
                                        className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859] truncate"
                                        onClick={() => setActiveDropdown(null)}
                                        title={subItem.name}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <ul className="space-y-[4px]">
                                  {column2.map((subItem) => (
                                    <li key={subItem.href}>
                                      <Link
                                        href={subItem.href}
                                        className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859] truncate"
                                        onClick={() => setActiveDropdown(null)}
                                        title={subItem.name}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <ul className="space-y-[4px]">
                                  {column3.map((subItem) => (
                                    <li key={subItem.href}>
                                      <Link
                                        href={subItem.href}
                                        className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859] truncate"
                                        onClick={() => setActiveDropdown(null)}
                                        title={subItem.name}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <ul className="space-y-[4px]">
                                  {column4.map((subItem) => (
                                    <li key={subItem.href}>
                                      <Link
                                        href={subItem.href}
                                        className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859] truncate"
                                        onClick={() => setActiveDropdown(null)}
                                        title={subItem.name}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      // Default layout for other menus
                      <div>
                        <p className="text-[12px] text-[#6e6e73] font-normal mb-3">
                          {item.dropdownContent?.column1.title}
                        </p>
                        <ul className="space-y-[8px]">
                          {item.dropdownContent?.column1.items.map((subItem) => (
                            <li key={subItem.href}>
                              {/* Special handling for Booking menu with subItems */}
                              {item.name === 'Booking' && subItem.subItems ? (
                                <div className="flex gap-8">
                                  {subItem.subItems.map((grade) => (
                                    <Link
                                      key={grade.href}
                                      href={grade.href}
                                      className="text-[21px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.19048]"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      {grade.name}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <Link
                                  href={subItem.href}
                                  className="text-[21px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.19048]"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  {subItem.name}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Column 2 - Categories */}
                    <div className={item.name === 'Courses' ? "" : ""}>
                      <p className="text-[12px] text-[#6e6e73] font-normal mb-3">
                        {item.dropdownContent?.column2.title}
                      </p>
                      <ul className="space-y-[8px]">
                        {item.dropdownContent?.column2.items.map((subItem, index) => (
                          <li key={`${subItem.href}-${index}`}>
                            {/* Special handling for Booking menu */}
                            {item.name === 'Booking' && subItem.name === 'Review' ? (
                              <p className="text-[12px] text-[#6e6e73] font-normal mt-4 mb-2">
                                {subItem.name}
                              </p>
                            ) : subItem.name === '' ? (
                              <div className="h-2" />
                            ) : item.name === 'Booking' && subItem.subItems ? (
                              <div className="flex gap-8">
                                {subItem.subItems.map((grade) => (
                                  <Link
                                    key={grade.href}
                                    href={grade.href}
                                    className="text-[21px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.19048]"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    {grade.name}
                                  </Link>
                                ))}
                              </div>
                            ) : subItem.href ? (
                              <Link
                                href={subItem.href}
                                className={
                                  item.name === 'Booking' 
                                    ? "text-[21px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.19048]"
                                    : item.name === 'Courses'
                                    ? "text-[12px] font-bold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859]"
                                    : "text-[12px] font-bold text-[#1d1d1f] hover:text-[#0066cc] transition-colors block leading-[1.42859]"
                                }
                                onClick={() => setActiveDropdown(null)}
                              >
                                {subItem.name}
                              </Link>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ))}

        {/* Backdrop when dropdown is active */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            style={{ 
              zIndex: -1,
              animation: 'backdropFadeIn 0.3s cubic-bezier(0.4, 0, 0.6, 1)'
            }}
            onClick={() => setActiveDropdown(null)}
          />
        )}
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-white pt-16 lg:hidden">
          <nav className="px-5 py-4">
            <ul className="space-y-4">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="block text-lg font-medium text-gray-900 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              
              {/* User-specific links when logged in */}
              {user && (
                <li>
                  <Link
                    href="/account"
                    className="block text-lg font-medium text-gray-900 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                </li>
              )}
              
              {/* Sign In link when not logged in */}
              {!user && (
                <li>
                  <Link
                    href="/login"
                    className="block text-lg font-medium text-gray-900 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}

      {/* Mini Cart */}
      <MiniCart 
        isOpen={isMiniCartOpen} 
        onClose={() => setIsMiniCartOpen(false)} 
      />

    </>
  );
}