import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Sidebar, Header, MobileNav } from '../components/layout';
import { Drawer } from '../components';

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileDrawerOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
          userName={user?.name}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="py-6">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        position="left"
        title="Menu"
        className="w-72"
      >
        <div className="flex flex-col h-full -mx-6">
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Sidebar Navigation */}
            <MobileSidebarContent onLogout={handleLogout} onClose={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

// Mobile sidebar content component
interface MobileSidebarContentProps {
  onLogout: () => void;
  onClose: () => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({ onLogout, onClose }) => {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {/* Quick Links */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Quick Links
      </div>
      
      <MobileNavLink href="/dashboard" icon="home" onClose={onClose}>
        Dashboard
      </MobileNavLink>
      <MobileNavLink href="/orders" icon="orders" onClose={onClose}>
        Orders
      </MobileNavLink>
      <MobileNavLink href="/products" icon="products" onClose={onClose}>
        Products
      </MobileNavLink>
      <MobileNavLink href="/customers" icon="customers" onClose={onClose}>
        Customers
      </MobileNavLink>
      
      <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Management
      </div>
      
      <MobileNavLink href="/categories" icon="categories" onClose={onClose}>
        Categories
      </MobileNavLink>
      <MobileNavLink href="/coupons" icon="coupons" onClose={onClose}>
        Coupons
      </MobileNavLink>
      <MobileNavLink href="/marketing" icon="marketing" onClose={onClose}>
        Marketing
      </MobileNavLink>
      <MobileNavLink href="/shipping" icon="shipping" onClose={onClose}>
        Shipping
      </MobileNavLink>
      
      <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        System
      </div>
      
      <MobileNavLink href="/settings" icon="settings" onClose={onClose}>
        Settings
      </MobileNavLink>
      <MobileNavLink href="/analytics" icon="analytics" onClose={onClose}>
        Analytics
      </MobileNavLink>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-error-600 rounded-lg hover:bg-error-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  );
};

// Mobile navigation link component
interface MobileNavLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  onClose: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ href, icon, children, onClose }) => {
  const handleClick = () => {
    onClose();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      {children}
    </a>
  );
};

export default AdminLayout;