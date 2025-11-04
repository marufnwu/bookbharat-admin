import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Settings,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Phone,
  Mail,
  Bell,
  Users,
  CreditCard,
  Truck,
  Shield,
  Server,
  AlertTriangle,
  ChevronDown,
  Home,
} from 'lucide-react';

interface DocSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: DocItem[];
}

interface DocItem {
  title: string;
  href: string;
  description?: string;
}

interface DocumentationNavProps {
  className?: string;
}

const docSections: DocSection[] = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      {
        title: 'Admin Overview',
        href: '/docs',
        description: 'Introduction to BookBharat admin panel'
      },
      {
        title: 'Quick Start Guide',
        href: '/docs/quick-start',
        description: 'Get up and running in minutes'
      },
      {
        title: 'System Requirements',
        href: '/docs/requirements',
        description: 'Technical requirements and setup'
      },
    ]
  },
  {
    title: 'Core Features',
    icon: FileText,
    items: [
      {
        title: 'Dashboard Analytics',
        href: '/docs/dashboard',
        description: 'Understanding analytics and metrics'
      },
      {
        title: 'Product Management',
        href: '/docs/products',
        description: 'Managing products, categories, and inventory'
      },
      {
        title: 'Order Processing',
        href: '/docs/orders',
        description: 'Order fulfillment and tracking'
      },
      {
        title: 'Customer Management',
        href: '/docs/customers',
        description: 'Customer data and relationship management'
      },
    ]
  },
  {
    title: 'Cart Recovery',
    icon: ShoppingCart,
    items: [
      {
        title: 'Abandoned Cart System',
        href: '/docs/abandoned-carts',
        description: 'Complete guide to cart recovery'
      },
      {
        title: 'Recovery Templates',
        href: '/docs/recovery-templates',
        description: 'Email and SMS templates for recovery'
      },
      {
        title: 'Discount Management',
        href: '/docs/discount-management',
        description: 'Creating and managing recovery discounts'
      },
      {
        title: 'Recovery Analytics',
        href: '/docs/recovery-analytics',
        description: 'Measuring recovery success'
      },
    ]
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    items: [
      {
        title: 'Email Configuration',
        href: '/docs/email-configuration',
        description: 'Setting up email providers and templates'
      },
      {
        title: 'SMS Gateway Setup',
        href: '/docs/sms-setup',
        description: 'Configuring SMS providers'
      },
      {
        title: 'WhatsApp Integration',
        href: '/docs/whatsapp-integration',
        description: 'WhatsApp Business API setup and templates'
      },
      {
        title: 'Notification Rules',
        href: '/docs/notification-rules',
        description: 'Configuring automated notifications'
      },
    ]
  },
  {
    title: 'Analytics & Reports',
    icon: BarChart3,
    items: [
      {
        title: 'Sales Analytics',
        href: '/docs/sales-analytics',
        description: 'Understanding sales metrics and trends'
      },
      {
        title: 'Customer Analytics',
        href: '/docs/customer-analytics',
        description: 'Customer behavior and segmentation'
      },
      {
        title: 'Product Performance',
        href: '/docs/product-performance',
        description: 'Product sales and inventory analysis'
      },
      {
        title: 'Recovery Analytics',
        href: '/docs/recovery-analytics',
        description: 'Cart recovery performance metrics'
      },
    ]
  },
  {
    title: 'Marketing Tools',
    icon: Mail,
    items: [
      {
        title: 'Coupon Management',
        href: '/docs/coupons',
        description: 'Creating and managing discount coupons'
      },
      {
        title: 'Bundle Manager',
        href: '/docs/bundles',
        description: 'Product bundles and frequently bought together'
      },
      {
        title: 'Newsletter System',
        href: '/docs/newsletter',
        description: 'Email marketing and subscriber management'
      },
    ]
  },
  {
    title: 'Shipping & Logistics',
    icon: Truck,
    items: [
      {
        title: 'Shipping Configuration',
        href: '/docs/shipping',
        description: 'Setting up shipping zones and carriers'
      },
      {
        title: 'Carrier Integration',
        href: '/docs/carriers',
        description: 'Integrating with shipping carriers'
      },
      {
        title: 'Tracking & Updates',
        href: '/docs/tracking',
        description: 'Order tracking and status updates'
      },
    ]
  },
  {
    title: 'Financial Management',
    icon: CreditCard,
    items: [
      {
        title: 'Payment Gateways',
        href: '/docs/payments',
        description: 'Configuring payment providers'
      },
      {
        title: 'Billing & Invoicing',
        href: '/docs/billing',
        description: 'Invoice generation and management'
      },
      {
        title: 'Tax Configuration',
        href: '/docs/taxes',
        description: 'Setting up tax rules and calculations'
      },
    ]
  },
  {
    title: 'System Administration',
    icon: Shield,
    items: [
      {
        title: 'User Management',
        href: '/docs/users',
        description: 'Managing admin users and permissions'
      },
      {
        title: 'Security Settings',
        href: '/docs/security',
        description: 'Security configuration and best practices'
      },
      {
        title: 'System Configuration',
        href: '/docs/system-config',
        description: 'Advanced system settings'
      },
      {
        title: 'Backup & Recovery',
        href: '/docs/backup',
        description: 'Data backup and disaster recovery'
      },
    ]
  },
  {
    title: 'API & Integration',
    icon: Server,
    items: [
      {
        title: 'API Overview',
        href: '/docs/api',
        description: 'RESTful API documentation'
      },
      {
        title: 'Authentication',
        href: '/docs/api-auth',
        description: 'API authentication and security'
      },
      {
        title: 'Webhooks',
        href: '/docs/webhooks',
        description: 'Configuring webhook endpoints'
      },
      {
        title: 'Third-party Integration',
        href: '/docs/integrations',
        description: 'Integrating with external services'
      },
    ]
  },
  {
    title: 'Troubleshooting',
    icon: AlertTriangle,
    items: [
      {
        title: 'Common Issues',
        href: '/docs/troubleshooting',
        description: 'Solutions to common problems'
      },
      {
        title: 'Error Codes',
        href: '/docs/error-codes',
        description: 'Understanding error messages'
      },
      {
        title: 'Performance Issues',
        href: '/docs/performance',
        description: 'Diagnosing and fixing performance problems'
      },
      {
        title: 'FAQs',
        href: '/docs/faq',
        description: 'Frequently asked questions'
      },
    ]
  },
];

const DocumentationNav: React.FC<DocumentationNavProps> = ({ className = '' }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Getting Started', 'Core Features']);
  const location = useLocation();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isItemActive = (href: string) => {
    return location.pathname === href;
  };

  const isSectionActive = (section: DocSection) => {
    return section.items.some(item => isItemActive(item.href));
  };

  return (
    <nav className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <Link
          to="/docs"
          className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors"
        >
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold">Documentation</span>
        </Link>
      </div>

      {docSections.map((section) => {
        const isExpanded = expandedSections.includes(section.title);
        const isActive = isSectionActive(section);

        return (
          <div key={section.title} className="border-b border-gray-200 pb-4 last:border-0">
            <button
              onClick={() => toggleSection(section.title)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <section.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{section.title}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExpanded && (
              <div className="mt-2 ml-6 space-y-1">
                {section.items.map((item) => {
                  const itemActive = isItemActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`block py-2 px-3 rounded-md text-sm transition-colors ${
                        itemActive
                          ? 'bg-blue-100 text-blue-900 font-medium border-l-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600 mb-3">
          Can't find what you're looking for? Contact our support team.
        </p>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Contact Support
        </button>
      </div>
    </nav>
  );
};

export default DocumentationNav;