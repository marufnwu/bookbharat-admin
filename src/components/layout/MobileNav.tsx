import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ShoppingBag, User, MoreHorizontal, Package, Truck, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Drawer } from '../Drawer';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNavItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Profile', href: '/profile', icon: User },
];

interface MobileNavProps {
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ className }) => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const isCurrentPath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40',
          'pb-safe', // Safe area padding for iOS
          'md:hidden', // Hidden on desktop
          className
        )}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => {
            const isActive = isCurrentPath(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full',
                  'text-sm transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 mb-1',
                    isActive && 'stroke-[2.5px]'
                  )}
                />
                <span className={cn('text-xs', isActive && 'font-medium')}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full',
              'text-sm text-gray-500 hover:text-gray-700 transition-colors'
            )}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* More Navigation Drawer */}
      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        position="bottom"
        title="More"
        className="h-auto max-h-[70vh]"
      >
        <div className="grid grid-cols-3 gap-4 py-4">
          <MoreNavItem
            icon={Package}
            label="Categories"
            href="/categories"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Truck}
            label="Create Shipment"
            href="/orders/create-shipment"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={ShoppingCart}
            label="Customers"
            href="/customers"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Package}
            label="Preorders"
            href="/preorders"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Package}
            label="Coupons"
            href="/coupons"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Package}
            label="Shipping"
            href="/shipping"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Package}
            label="Analytics"
            href="/analytics"
            onClick={() => setMoreOpen(false)}
          />
          <MoreNavItem
            icon={Package}
            label="Settings"
            href="/settings"
            onClick={() => setMoreOpen(false)}
          />
        </div>
      </Drawer>
    </>
  );
};

// More Nav Item component
interface MoreNavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  onClick?: () => void;
}

const MoreNavItem: React.FC<MoreNavItemProps> = ({ icon: Icon, label, href, onClick }) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors active:scale-95"
    >
      <Icon className="w-6 h-6 text-gray-600 mb-2" />
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </Link>
  );
};

export default MobileNav;