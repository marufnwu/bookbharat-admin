import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X,
  Home,
  ShoppingBag,
  ShoppingCart,
  Users,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  FolderOpen,
  Star,
  Ticket,
  Truck,
  Sparkles,
  Layers,
  FileText,
  Navigation,
  Layout,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Bell,
  Server,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../auth/useAuth';
import { NotificationToast } from '../components';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },

  // Product Management
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Categories', href: '/categories', icon: FolderOpen },
  { name: 'Reviews', href: '/reviews', icon: Star },

  // Order Management
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Shipping', href: '/shipping', icon: Truck },

  // Customer Management
  { name: 'Customers', href: '/customers', icon: Users },

  // Marketing & Promotions
  { name: 'Coupons', href: '/coupons', icon: Ticket },
  {
    name: 'Bundle Manager',
    href: '/bundle-manager',
    icon: Sparkles,
    children: [
      { name: 'Associations', href: '/bundle-manager/associations', icon: Sparkles },
      { name: 'Discount Rules', href: '/bundle-manager/discount-rules', icon: CreditCard },
      { name: 'Analytics', href: '/bundle-manager/analytics', icon: Star },
    ]
  },

  // Content Management
  {
    name: 'Content Management',
    href: '/content',
    icon: FileText,
    children: [
      { name: 'Hero Section', href: '/hero-config', icon: Layout },
      { name: 'Navigation Menu', href: '/navigation-menu', icon: Navigation },
      { name: 'Content Pages', href: '/content-pages', icon: FileText },
    ]
  },

  // Settings & Configuration
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings/general', icon: Settings },
      { name: 'Site Settings', href: '/settings/site', icon: Globe },
      { name: 'Payment Gateways', href: '/settings/payment', icon: CreditCard },
      { name: 'Shipping Zones', href: '/settings/shipping', icon: Truck },
      { name: 'Order Charges', href: '/settings/charges', icon: Receipt },
      { name: 'Tax Configuration', href: '/settings/taxes', icon: DollarSign },
      { name: 'Email Templates', href: '/settings/email', icon: Mail },
      { name: 'Notifications', href: '/settings/notifications', icon: Bell },
    ]
  },

  // System Administration
  {
    name: 'System',
    href: '/system',
    icon: Shield,
    children: [
      { name: 'Admin Users', href: '/users', icon: UserCheck },
      { name: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
      { name: 'System Management', href: '/settings/system', icon: Server },
    ]
  },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-expand parent items if we're on a child route
  React.useEffect(() => {
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => isCurrentPath(child.href));
        if (hasActiveChild && !expandedItems.includes(item.name)) {
          setExpandedItems((prev) => [...prev, item.name]);
        }
      }
    });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCurrentPath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">BookBharat Admin</span>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={`${
                            item.children.some(child => isCurrentPath(child.href))
                              ? 'bg-blue-100 text-blue-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded(item.name) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isExpanded(item.name) && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                to={child.href}
                                className={`${
                                  isCurrentPath(child.href)
                                    ? 'bg-blue-50 text-blue-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } group flex items-center px-2 py-2 text-sm rounded-md transition-colors`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <child.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? 'bg-blue-100 text-blue-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-r border-gray-200">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">BookBharat</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={`${
                            item.children.some(child => isCurrentPath(child.href))
                              ? 'bg-blue-100 text-blue-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded(item.name) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isExpanded(item.name) && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                to={child.href}
                                className={`${
                                  isCurrentPath(child.href)
                                    ? 'bg-blue-50 text-blue-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } group flex items-center px-2 py-2 text-sm rounded-md transition-colors`}
                              >
                                <child.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? 'bg-blue-100 text-blue-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-gray-200 py-4 px-2">
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {(() => {
                  const path = location.pathname.split('/').filter(Boolean);
                  const currentNav = navigation.find(item => {
                    if (item.children) {
                      return item.children.some(child => isCurrentPath(child.href));
                    }
                    return isCurrentPath(item.href);
                  });

                  if (currentNav?.children) {
                    const child = currentNav.children.find(c => isCurrentPath(c.href));
                    if (child) return child.name;
                  }

                  return currentNav?.name || path.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ') || 'Dashboard';
                })()}
              </h1>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <Menu as="div" className="ml-3 relative">
                <div>
                  <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-700 text-sm font-medium hidden md:block">
                      {user?.name}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400 hidden md:block" />
                  </Menu.Button>
                </div>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700`}
                        >
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            Your Profile
                          </div>
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700`}
                        >
                          <div className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </div>
                        </Link>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-100"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          <div className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Notifications */}
      <NotificationToast />
    </div>
  );
};

export default AdminLayout;