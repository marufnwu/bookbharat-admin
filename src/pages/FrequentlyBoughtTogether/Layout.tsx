import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LinkIcon, TagIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const BundleManagerLayout: React.FC = () => {
  const location = useLocation();

  const tabs = [
    {
      name: 'Associations',
      href: '/bundle-manager/associations',
      icon: LinkIcon,
      description: 'Manage frequently bought together products',
    },
    {
      name: 'Discount Rules',
      href: '/bundle-manager/discount-rules',
      icon: TagIcon,
      description: 'Configure bundle discount rules',
    },
    {
      name: 'Analytics',
      href: '/bundle-manager/analytics',
      icon: ChartBarIcon,
      description: 'Track bundle performance metrics',
    },
  ];

  const currentTab = tabs.find(tab => location.pathname.startsWith(tab.href));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bundle Manager</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage frequently bought together products and bundle discounts
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname.startsWith(tab.href);
              
              return (
                <NavLink
                  key={tab.name}
                  to={tab.href}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Tab Description */}
        {currentTab && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">{currentTab.description}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BundleManagerLayout;