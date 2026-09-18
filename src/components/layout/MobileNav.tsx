import React from 'react';
import { MobileNavDrawer } from '../Drawer';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ open, onClose, onLogout }) => (
  <MobileNavDrawer open={open} onClose={onClose} title="Menu">
    <Sidebar onNavigate={onClose} onLogout={onLogout} className="max-w-full" />
  </MobileNavDrawer>
);

export default MobileNav;
