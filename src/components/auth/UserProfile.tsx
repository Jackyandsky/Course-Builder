'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function UserProfile() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const userDisplayName = user.user_metadata?.full_name || 
                          user.user_metadata?.first_name || 
                          user.email?.split('@')[0] || 
                          'User';

  const userInitials = userDisplayName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-3 text-sm rounded-full p-2 hover:bg-gray-100 transition-colors">
        {user.user_metadata?.avatar_url ? (
          <img
            className="h-8 w-8 rounded-full"
            src={user.user_metadata.avatar_url}
            alt={userDisplayName}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
            {userInitials}
          </div>
        )}
        <span className="hidden md:block text-gray-700 font-medium">
          {userDisplayName}
        </span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={pathname.startsWith('/admin') ? '/admin/settings' : '/account/settings'}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm text-gray-700',
                    active && 'bg-gray-100'
                  )}
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                  {pathname.startsWith('/admin') ? 'Settings' : 'Account Settings'}
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={signOut}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm text-gray-700',
                    active && 'bg-gray-100'
                  )}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
