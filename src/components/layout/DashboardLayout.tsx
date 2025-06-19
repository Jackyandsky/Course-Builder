'use client';

import { Fragment, useState } from 'react';
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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/components/auth/UserProfile';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Courses', href: '/courses', icon: AcademicCapIcon },
  { name: 'Schedules', href: '/schedules', icon: CalendarIcon },
  { name: 'Lessons', href: '/lessons', icon: ClockIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
  { name: 'Objectives', href: '/objectives', icon: DocumentTextIcon },
  { name: 'Methods', href: '/methods', icon: CogIcon },
  { name: 'Books', href: '/books', icon: BookOpenIcon },
  { name: 'Vocabulary', href: '/vocabulary', icon: LanguageIcon },
  {
    name: 'Proprietary Product',
    icon: CogIcon,
    isCategory: true,
    children: [
      { name: 'Decoders', href: '/decoders', icon: KeyIcon },
    ]
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Proprietary Product']);
  const pathname = usePathname();

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const renderNavigationItem = (item: any, isMobile: boolean = false) => {
    if (item.isCategory) {
      const isExpanded = expandedCategories.includes(item.name);
      return (
        <li key={item.name}>
          <button
            onClick={() => toggleCategory(item.name)}
            className="w-full group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-primary-600 hover:bg-gray-50"
          >
            <item.icon
              className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-primary-600"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {isExpanded && item.children && (
            <ul className="ml-6 mt-1 space-y-1">
              {item.children.map((child: any) => (
                <li key={child.name}>
                  <Link
                    href={child.href}
                    className={cn(
                      pathname === child.href
                        ? 'bg-gray-50 text-primary-600'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                  >
                    <child.icon
                      className={cn(
                        pathname === child.href
                          ? 'text-primary-600'
                          : 'text-gray-400 group-hover:text-primary-600',
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    } else {
      return (
        <li key={item.name}>
          <Link
            href={item.href}
            className={cn(
              pathname === item.href
                ? 'bg-gray-50 text-primary-600'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
            )}
            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
          >
            <item.icon
              className={cn(
                pathname === item.href
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
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
                    <h1 className="text-xl font-bold text-primary-600">Course Builder</h1>
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
            <h1 className="text-xl font-bold text-primary-600">Course Builder</h1>
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
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <UserProfile />
            </div>
          </div>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
