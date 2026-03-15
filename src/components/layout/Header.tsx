import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Menu as MenuIcon,
  Search,
  Bell,
  ChevronDown,
  Settings,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  onLogout: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userName = 'Admin',
  onLogout,
  className,
}) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);

  // Generate breadcrumbs from current path
  const breadcrumbs = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    pathParts.forEach((part, index) => {
      const name = part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const href = '/' + pathParts.slice(0, index + 1).join('/');
      items.push({ name, href });
    });

    return items;
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 flex-shrink-0',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center text-sm">
          <Link
            to="/dashboard"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Home
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium text-gray-900">{item.name}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Mobile page title */}
        <h1 className="sm:hidden text-lg font-semibold text-gray-900 truncate">
          {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Dashboard'}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg
                       placeholder:text-gray-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
            />
          </div>
        </form>

        {/* Search - Mobile */}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full"></span>
        </button>

        {/* Profile dropdown */}
        <Menu as="div" className="relative ml-2">
          <Menu.Button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
            </div>
            <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
          </Menu.Button>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 focus:outline-none z-50">
              <div className="px-3 py-2 border-b border-gray-100 lg:hidden">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>

              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/profile"
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm',
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-600'
                    )}
                  >
                    <User className="w-4 h-4" />
                    Your Profile
                  </Link>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/settings"
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm',
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-600'
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                )}
              </Menu.Item>

              <div className="border-t border-gray-100 my-1"></div>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onLogout}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm w-full text-left',
                      active ? 'bg-gray-50 text-error-600' : 'text-error-600'
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="absolute inset-x-0 top-16 bg-white border-b border-gray-200 p-4 md:hidden z-40">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search products, orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-12 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg
                         placeholder:text-gray-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;