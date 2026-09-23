import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Users,
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
  Percent,
  Receipt,
  Wallet,
  BarChart3,
  Navigation,
  Layout,
  Shield,
  Server,
  CreditCard,
  DollarSign,
  Image,
  Tag,
  Newspaper,
  Activity,
  Box,
  Share2,
  Rss,
  Megaphone,
  BookOpen,
  Database,
  Wrench,
  Book,
  AlertTriangle,
  Mail,
  MessageSquare,
  Globe,
  Gift,
  LucideIcon,
  Calendar,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavigationItem[];
  badge?: string | number;
}

const hasActiveDescendant = (
  item: NavigationItem,
  isCurrentPath: (href: string) => boolean
): boolean =>
  item.children?.some((child) =>
    child.children ? hasActiveDescendant(child, isCurrentPath) : isCurrentPath(child.href)
  ) ?? false;

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },

  // Sales & Orders
  {
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    children: [
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
      { name: 'Order Settings', href: '/orders/settings', icon: Settings },
      { name: 'Create Shipment', href: '/orders/create-shipment', icon: Truck },
      { name: 'Active Carts', href: '/active-carts', icon: ShoppingCart },
      { name: 'Abandoned Carts', href: '/marketing/abandoned-carts', icon: ShoppingCart },
    ],
  },

  // Catalog
  {
    name: 'Catalog',
    href: '/catalog',
    icon: Tag,
    children: [
      { name: 'Products', href: '/products', icon: ShoppingBag },
      { name: 'Preorders', href: '/preorders', icon: Calendar },
      { name: 'Categories', href: '/categories', icon: FolderOpen },
      { name: 'Publishers', href: '/publishers', icon: BookOpen },
      { name: 'Authors', href: '/authors', icon: BookOpen },
      { name: 'Reviews', href: '/reviews', icon: Star },
      { name: 'Packaging', href: '/packaging', icon: Gift },
    ],
  },

  // Customers
  { name: 'Customers', href: '/customers', icon: Users },

  // Payments
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    children: [
      { name: 'Transactions', href: '/payments/transactions', icon: DollarSign },
      { name: 'Refunds', href: '/payments/refunds', icon: Receipt },
      { name: 'Webhooks', href: '/payments/webhooks', icon: Activity },
    ],
  },

  // Marketing
  {
    name: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    children: [
      { name: 'Coupons', href: '/coupons', icon: Ticket },
      { name: 'Bundles', href: '/bundle-manager', icon: Sparkles },
      { name: 'Newsletter', href: '/newsletter', icon: Newspaper },
      { name: 'Product Feeds', href: '/marketing/feeds', icon: Rss },
      { name: 'Product Collections', href: '/marketing/collections', icon: Layers },
      { name: 'Analytics', href: '/marketing/analytics', icon: BarChart3 },
      { name: 'Settings', href: '/marketing/settings', icon: Settings },
    ],
  },

  // Affiliates — plain-language primary items for non-technical admins,
  // plus a collapsed Advanced group for operational screens. Labels use
  // money terms (earnings, payouts, take-back) instead of engine terms
  // (holds, clawbacks, attribution).
  {
    name: 'Affiliates',
    href: '/affiliates',
    icon: Share2,
    children: [
      { name: 'Dashboard',      href: '/affiliates/overview',         icon: LayoutDashboard },
      { name: 'Affiliates',     href: '/affiliates',                 icon: Users },
      { name: 'Earning Rules',  href: '/affiliates/commission-rules', icon: Percent },
      { name: 'Earnings',       href: '/affiliates/commissions',      icon: Receipt },
      { name: 'Payouts',        href: '/affiliates/payouts',          icon: Wallet },
      { name: 'Settings',       href: '/affiliates/settings',         icon: Settings },
      {
        name: 'Advanced',
        href: '/affiliates/advanced',
        icon: Wrench,
        children: [
          { name: 'Needs Review',   href: '/affiliates/commission-holds', icon: AlertTriangle },
          { name: 'Money To Take Back', href: '/affiliates/clawbacks',   icon: Receipt },
          { name: 'Referral Orders', href: '/affiliates/orders',         icon: ShoppingCart },
          { name: 'Referral Links', href: '/affiliates/links',           icon: Share2 },
          { name: 'Product Rates',  href: '/affiliates/product-settings', icon: Tag },
          { name: 'Insights',       href: '/affiliates/analytics',        icon: BarChart3 },
          { name: 'Reports',        href: '/affiliates/reports',          icon: BarChart3 },
          { name: 'Activity',       href: '/affiliates/audit-log',        icon: Activity },
          { name: 'Automations',    href: '/affiliates/scheduled-jobs',   icon: Clock },
        ],
      },
    ],
  },

  // Storefront
  {
    name: 'Storefront',
    href: '/storefront',
    icon: Layout,
    children: [
      { name: 'Layout & Design', href: '/homepage-layout', icon: Layers },
      { name: 'Banners', href: '/promotional-banners', icon: Tag },
      { name: 'Hero Config', href: '/hero-config', icon: Image },
      { name: 'Navigation Menu', href: '/navigation-menu', icon: Navigation },
    ],
  },

  // Content
  {
    name: 'Content',
    href: '/content',
    icon: FileText,
    children: [
      { name: 'Blog', href: '/blog', icon: BookOpen },
      { name: 'Pages', href: '/content-pages', icon: FileText },
      { name: 'Content Blocks', href: '/content-blocks', icon: Box },
      { name: 'Media Library', href: '/media-library', icon: Image },
    ],
  },

  // Store Settings
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { name: 'All Settings', href: '/settings', icon: Settings },
      { name: 'Site Settings', href: '/settings/site', icon: Globe },
      { name: 'Payment', href: '/settings/payment', icon: CreditCard },
      { name: 'Shipping', href: '/shipping', icon: Truck },
      { name: 'Taxes', href: '/settings/taxes', icon: DollarSign },
      { name: 'Order Charges', href: '/settings/charges', icon: Receipt },
      { name: 'Messaging', href: '/settings/messaging-channels', icon: MessageSquare },
      { name: 'WhatsApp Templates', href: '/settings/whatsapp-templates', icon: MessageSquare },
      { name: 'AI Providers', href: '/settings/ai-providers', icon: Sparkles },
    ],
  },

  // System
  {
    name: 'System',
    href: '/system',
    icon: Shield,
    children: [
      { name: 'Admin Users', href: '/users', icon: Users },
      { name: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
      { name: 'Error Logs', href: '/system/error-logs', icon: AlertTriangle },
      { name: 'Logs', href: '/settings/system', icon: Server },
      { name: 'Cache', href: '/settings/cache', icon: Database },
      {
        name: 'Migration',
        href: '/migration',
        icon: Database,
        children: [
          { name: 'Dashboard', href: '/migration', icon: BarChart3 },
          { name: 'Settings', href: '/migration/settings', icon: Settings },
        ],
      },
      { name: 'Maintenance', href: '/settings/maintenance', icon: Wrench },
      { name: 'Documentation', href: '/docs', icon: Book },
    ],
  },

  // Analytics
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/analytics', icon: Activity },
      { name: 'Payment Analytics', href: '/analytics/payments', icon: CreditCard },
      { name: 'Message Logs', href: '/analytics/message-logs', icon: Mail },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onLogout,
  onNavigate,
  className,
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Pick the single most-specific leaf href that matches the current path.
  // For /affiliates/commissions this returns '/affiliates/commissions'
  // (beating '/affiliates'); for /affiliates/21 it falls back to '/affiliates'.
  const activeHref = React.useMemo(() => {
    const leaves: string[] = [];
    const walk = (items: NavigationItem[]) =>
      items.forEach((i) => {
        if (i.children) walk(i.children);
        else leaves.push(i.href);
      });
    walk(navigation);
    const matches = leaves
      .filter((h) => location.pathname === h || location.pathname.startsWith(h + '/'))
      .sort((a, b) => b.length - a.length);
    return matches[0] ?? null;
  }, [location.pathname]);

  const isCurrentPath = (href: string) => activeHref === href;

  // Auto-expand only the groups that contain the active child;
  // collapse everything else so the menu doesn't grow unbounded.
  React.useEffect(() => {
    const open = navigation
      .filter((item) => hasActiveDescendant(item, (href) => activeHref === href))
      .map((item) => item.name);
    setExpandedItems(open);
  }, [activeHref]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 flex-shrink-0">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">BB</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900">BookBharat</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              {item.children ? (
                <SidebarNavItemWithChildren
                  item={item}
                  collapsed={collapsed}
                  expanded={isExpanded(item.name)}
                  onToggle={() => toggleExpanded(item.name)}
                  isCurrentPath={isCurrentPath}
                  onNavigate={onNavigate}
                />
              ) : (
                <SidebarNavItem
                  item={item}
                  collapsed={collapsed}
                  isActive={isCurrentPath(item.href)}
                  onNavigate={onNavigate}
                />
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

// Simple nav item without children
interface SidebarNavItemProps {
  item: NavigationItem;
  collapsed: boolean;
  isActive: boolean;
  onNavigate?: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, collapsed, isActive, onNavigate }) => {
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        collapsed && 'justify-center'
      )}
      title={collapsed ? item.name : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

// Nav item with children
interface SidebarNavItemWithChildrenProps {
  item: NavigationItem;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  isCurrentPath: (href: string) => boolean;
  onNavigate?: () => void;
}

const SidebarNavItemWithChildren: React.FC<SidebarNavItemWithChildrenProps> = ({
  item,
  collapsed,
  expanded,
  onToggle,
  isCurrentPath,
  onNavigate,
}) => {
  const hasActiveChild = hasActiveDescendant(item, isCurrentPath);

  // On collapsed mode, show first-level children as tooltip or popover
  if (collapsed) {
    return (
      <div className="relative group">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
            hasActiveChild
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
          title={item.name}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
        </button>
        {/* Collapsed submenu - shown on hover */}
        <div className="absolute left-full top-0 ml-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {item.children?.map((child) => (
            <Link
              key={child.name}
              to={child.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md mx-1',
                isCurrentPath(child.href)
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
              aria-current={isCurrentPath(child.href) ? 'page' : undefined}
            >
              <child.icon className="w-4 h-4" />
              {child.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
          hasActiveChild
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-left">{item.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && (
        <ul className="mt-1 ml-4 pl-3 border-l border-gray-200 space-y-1">
          {item.children?.map((child) => (
            <li key={child.name}>
              {child.children ? (
                // Nested children (e.g., Migration)
                <NestedNavItem item={child} isCurrentPath={isCurrentPath} onNavigate={onNavigate} />
              ) : (
                <Link
                  to={child.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    isCurrentPath(child.href)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  aria-current={isCurrentPath(child.href) ? 'page' : undefined}
                >
                  <child.icon className="w-4 h-4" />
                  {child.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Nested nav item for deeper hierarchies
interface NestedNavItemProps {
  item: NavigationItem;
  isCurrentPath: (href: string) => boolean;
  onNavigate?: () => void;
}

const NestedNavItem: React.FC<NestedNavItemProps> = ({ item, isCurrentPath, onNavigate }) => {
  const { pathname } = useLocation();
  const hasActiveChild = hasActiveDescendant(item, isCurrentPath);
  const [expanded, setExpanded] = React.useState(hasActiveChild);

  React.useEffect(() => {
    setExpanded(hasActiveChild);
  }, [hasActiveChild, pathname]);

  if (!item.children) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors',
          hasActiveChild
            ? 'text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon className="w-4 h-4" />
        <span className="flex-1 text-left">{item.name}</span>
        <ChevronDown
          className={cn('w-3 h-3 transition-transform duration-200', expanded && 'rotate-180')}
        />
      </button>
      {expanded && (
        <ul className="mt-1 ml-2 space-y-1">
          {item.children.map((child) => (
            <li key={child.name}>
              {child.children ? (
                <NestedNavItem item={child} isCurrentPath={isCurrentPath} onNavigate={onNavigate} />
              ) : (
                <Link
                  to={child.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                    isCurrentPath(child.href)
                      ? 'text-primary-700 font-medium'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                  aria-current={isCurrentPath(child.href) ? 'page' : undefined}
                >
                  <child.icon className="w-3 h-3" />
                  {child.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;