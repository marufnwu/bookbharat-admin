import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Sidebar, Header, MobileNav, AgencyCredit } from '../components/layout';
import CommandPalette, { useCommandPaletteHotkey } from '../components/CommandPalette';
import ErrorBoundary from '../components/ErrorBoundary';

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // ⌘K / Ctrl+K anywhere in the admin opens the palette.
  useCommandPaletteHotkey(openPalette);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileDrawerOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const handleLogout = () => {
    setMobileDrawerOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex overflow-hidden bg-gray-50">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar collapsed={sidebarCollapsed} onLogout={handleLogout} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setMobileDrawerOpen(true)}
          menuOpen={mobileDrawerOpen}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
          userName={user?.name}
          onLogout={handleLogout}
          onOpenCommandPalette={openPalette}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </div>
        </main>

        {/*
          Footer strip. The shell is h-screen with <main> as flex-1, so this sits
          as a persistent band at the bottom of the content column rather than
          scrolling with the page — which is the point: an agency credit that
          only appears at the end of a long orders table is a credit nobody sees.
        */}
        <footer className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-8xl items-center justify-end px-4 py-2.5 sm:px-6 lg:px-8">
            <AgencyCredit />
          </div>
        </footer>
      </div>

      <MobileNav
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onLogout={handleLogout}
      />

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
};

export default AdminLayout;
