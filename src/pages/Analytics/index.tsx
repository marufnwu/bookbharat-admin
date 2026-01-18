import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  LineChart,
  Bell,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';

const AnalyticsHub: React.FC = () => {
  const navigate = useNavigate();

  const analyticsModules = [
    {
      title: 'Sales & Revenue',
      description: 'Overview of sales, revenue, and order trends.',
      icon: TrendingUp,
      path: '/dashboard',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Marketing Performance',
      description: 'Track campaign reach, coupon usage, and conversion rates.',
      icon: LineChart,
      path: '/marketing/analytics',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Payment Analytics',
      description: 'Analyze payment methods, success rates, and transaction volumes.',
      icon: CreditCard,
      path: '/analytics/payments',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Bundle Analytics',
      description: 'Insights into product bundle performance and cross-selling.',
      icon: Sparkles,
      path: '/bundle-manager/analytics',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Notification Stats',
      description: 'Monitor notification delivery, open rates, and engagement.',
      icon: Bell,
      path: '/notifications/analytics',
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Traffic & Behavior',
      description: 'Understanding user flow and site activity (Coming Soon).',
      icon: Activity,
      path: '#',
      color: 'bg-gray-100 text-gray-600',
      disabled: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Hub</h1>
          <p className="mt-1 text-sm text-gray-600">
            Centralized dashboard for all business insights and performance metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsModules.map((module) => (
          <div
            key={module.title}
            onClick={() => !module.disabled && navigate(module.path)}
            className={`bg-white rounded-lg shadow p-6 border border-gray-100 transition-all duration-200 ${
              module.disabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:shadow-md hover:border-blue-200 cursor-pointer group'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              {!module.disabled && (
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {module.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsHub;
