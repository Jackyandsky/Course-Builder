'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Settings, Tag, Globe, CreditCard
} from 'lucide-react';

const settingsSections = [
  {
    title: 'Content Management',
    items: [
      { name: 'Categories', href: '/admin/settings/categories', icon: Tag, 
        description: 'Manage content categories and hierarchies' },
    ]
  },
  {
    title: 'System Configuration',
    items: [
      { name: 'General', href: '/admin/settings', icon: Settings,
        description: 'General system settings' },
      { name: 'Payments', href: '/admin/settings/payments', icon: CreditCard,
        description: 'Stripe and payment configuration' },
      { name: 'Integrations', href: '/admin/settings/integrations', icon: Globe,
        description: 'Third-party integrations and API keys' },
    ]
  }
];

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure and manage your course builder system
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-72 space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-start p-3 rounded-lg transition-all
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <item.icon className={`
                        h-5 w-5 mt-0.5 mr-3 flex-shrink-0
                        ${isActive ? 'text-white' : 'text-gray-400'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Main Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}