'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
// TODO: Import and use dynamic menu items based on visibility fields
// import { useNavigationMenu } from '@/hooks/useNavigationMenu';
// const { menuData } = useNavigationMenu();
// Use menuData.courses, menuData.books, menuData.content for dynamic menu items
// These will be filtered by show_on_menu=true and ordered by menu_order

export default function PublicHeader() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl h-[50px]">
      <div className="max-w-[1400px] mx-auto h-full">
        <div className="flex items-center justify-between h-full px-5">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-white no-underline">
              <Image src="/api/logo" alt="IGPS Logo" width={100} height={30} className="h-[30px] w-auto" />
              <span className="text-xl font-semibold hidden md:inline">I GRAMMATICOS PLATFORM SOLUTION</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center h-[50px] list-none m-0 p-0 gap-2">
            <li className="relative h-[50px] flex items-center">
              <Link href="/" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                Home
              </Link>
            </li>
            
            {/* Courses Dropdown */}
            <li 
              className="relative h-[50px] flex items-center"
              onMouseEnter={() => setActiveDropdown('courses')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link href="/courses" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                Courses
                <span className="ml-1 text-[10px] opacity-60">▾</span>
              </Link>
              {activeDropdown === 'courses' && (
                <div className="absolute top-[50px] left-0 bg-black/85 backdrop-blur-xl min-w-[240px] opacity-100 visible transform-none transition-all duration-300 rounded-b-lg py-5 shadow-lg">
                  <div className="px-5">
                    <h3 className="text-white/60 text-[11px] uppercase tracking-wider mb-2.5 font-semibold">Categories</h3>
                    <ul className="list-none p-0 m-0">
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Reading%20%26%20Writing" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Reading & Writing
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Close%20Reading" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Close Reading
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Systematic%20Writing" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Systematic Writing
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Foreign%20Languages" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Foreign Languages
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Standardized%20Testing" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Standardized Testing
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/courses?category=Customized%20Programs" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Customized Programs
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Library Dropdown */}
            <li 
              className="relative h-[50px] flex items-center"
              onMouseEnter={() => setActiveDropdown('library')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link href="/library" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                Library
                <span className="ml-1 text-[10px] opacity-60">▾</span>
              </Link>
              {activeDropdown === 'library' && (
                <div className="absolute top-[50px] left-0 bg-black/85 backdrop-blur-xl min-w-[180px] opacity-100 visible transform-none transition-all duration-300 rounded-b-lg py-5 shadow-lg">
                  <div className="px-5">
                    <ul className="list-none p-0 m-0">
                      <li className="my-2">
                        <Link 
                          href="/library?category=Virtual%20Library" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Virtual Library
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/library?category=Physical%20Library" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Physical Library
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Store Dropdown */}
            <li 
              className="relative h-[50px] flex items-center"
              onMouseEnter={() => setActiveDropdown('store')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link href="/store" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                Store
                <span className="ml-1 text-[10px] opacity-60">▾</span>
              </Link>
              {activeDropdown === 'store' && (
                <div className="absolute top-[50px] left-0 bg-black/85 backdrop-blur-xl min-w-[240px] opacity-100 visible transform-none transition-all duration-300 rounded-b-lg py-5 shadow-lg">
                  <div className="px-5">
                    <ul className="list-none p-0 m-0">
                      <li className="my-2">
                        <Link 
                          href="/store?category=Decoders" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Decoders
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/store?category=Standardizers" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Standardizers
                        </Link>
                        {/* Subsection for Complete Study Packages */}
                        <Link 
                          href="/store?category=Complete%20Study%20Packages" 
                          className="block text-white/60 text-[12px] hover:text-white transition-opacity duration-200 py-1 pl-4 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          → Complete Study Packages
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/store?category=LEX" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          LEX Vocabulary
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            <li className="relative h-[50px] flex items-center">
              <Link href="/about" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                About Us
              </Link>
            </li>

            {/* Booking Dropdown */}
            <li 
              className="relative h-[50px] flex items-center"
              onMouseEnter={() => setActiveDropdown('booking')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link href="/booking" className="text-white/80 hover:text-white text-[13px] transition-opacity duration-300 px-2.5 h-[50px] flex items-center no-underline">
                Booking
                <span className="ml-1 text-[10px] opacity-60">▾</span>
              </Link>
              {activeDropdown === 'booking' && (
                <div className="absolute top-[50px] left-0 bg-black/85 backdrop-blur-xl min-w-[180px] opacity-100 visible transform-none transition-all duration-300 rounded-b-lg py-5 shadow-lg">
                  <div className="px-5">
                    <ul className="list-none p-0 m-0">
                      <li className="my-2">
                        <Link 
                          href="/booking/diagnosis" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Diagnosis
                        </Link>
                      </li>
                      <li className="my-2">
                        <Link 
                          href="/booking/progress-review" 
                          className="block text-white/80 text-[13px] hover:text-white transition-opacity duration-200 py-1.5 no-underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Progress Review
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Auth */}
            <li className="relative h-[50px] flex items-center">
              {user ? (
                <Link href="/admin" className="text-[#2997ff] hover:text-[#0071e3] text-[13px] transition-colors px-2.5 h-[50px] flex items-center no-underline">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="text-[#2997ff] hover:text-[#0071e3] text-[13px] transition-colors px-2.5 h-[50px] flex items-center no-underline">
                  Sign In
                </Link>
              )}
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl">
          <div className="px-5 py-4 space-y-3">
            <Link href="/" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <div>
              <Link href="/courses" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                Courses
              </Link>
            </div>
            <div>
              <Link href="/library" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                Library
              </Link>
            </div>
            <div>
              <Link href="/store" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                Store
              </Link>
              <div className="pl-4 space-y-1">
                <Link href="/store?category=Decoders" className="block text-white/60 hover:text-white text-xs py-1" onClick={() => setMobileMenuOpen(false)}>
                  Decoders
                </Link>
                <Link href="/store?category=Standardizers" className="block text-white/60 hover:text-white text-xs py-1" onClick={() => setMobileMenuOpen(false)}>
                  Standardizers
                </Link>
                <Link href="/store?category=Complete%20Study%20Packages" className="block text-white/50 hover:text-white text-xs py-1 pl-4" onClick={() => setMobileMenuOpen(false)}>
                  → Complete Study Packages
                </Link>
                <Link href="/store?category=LEX" className="block text-white/60 hover:text-white text-xs py-1" onClick={() => setMobileMenuOpen(false)}>
                  LEX Vocabulary
                </Link>
              </div>
            </div>
            <Link href="/about" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
              About Us
            </Link>
            <Link href="/booking" className="block text-white/80 hover:text-white text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
              Booking
            </Link>
            {user ? (
              <Link href="/admin" className="block text-[#2997ff] hover:text-[#0071e3] text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="block text-[#2997ff] hover:text-[#0071e3] text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}