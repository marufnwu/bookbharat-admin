import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  MapPin,
  Loader2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const ShippingAnalytics: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['shipping-analytics'],
    queryFn: shippingApi.getAnalytics,
  });

  const analytics = (analyticsData as any)?.analytics || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const zoneColors: { [key: string]: string } = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-purple-500',
    D: 'bg-orange-500',
    E: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Shipping Analytics</h2>
        <p className="text-sm text-gray-600">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Shipping Cost</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                ₹{analytics.average_shipping_cost?.overall_average || 0}
              </p>
              <div className="flex items-center mt-2 text-xs">
                <ArrowDown className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">12% from last month</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.delivery_performance?.on_time_delivery_rate || 0}%
              </p>
              <div className="flex items-center mt-2 text-xs">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">3% improvement</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Delivery Time</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.delivery_performance?.average_delivery_days || 0} days
              </p>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-gray-500">Target: 3 days</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">COD Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.cod_vs_prepaid?.cod_success_rate || 0}%
              </p>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-gray-500">
                  {analytics.cod_vs_prepaid?.cod_orders || 0}% of orders
                </span>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Zone Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Zone Performance</h3>
        <div className="space-y-4">
          {Object.entries(analytics.zone_performance || {}).map(([zone, data]: [string, any]) => {
            const maxOrders = Math.max(...Object.values(analytics.zone_performance || {}).map((z: any) => z.orders));
            const percentage = (data.orders / maxOrders) * 100;

            return (
              <div key={zone} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-16">Zone {zone}</span>
                    <span className="text-gray-500 ml-2">{data.orders} orders</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>₹{data.revenue} revenue</span>
                    <span>{data.avg_delivery_days} days avg</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${zoneColors[zone]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Cost by Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Average Cost by Zone</h3>
          <div className="space-y-3">
            {Object.entries(analytics.average_shipping_cost?.by_zone || {}).map(([zone, cost]) => (
              <div key={zone} className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Zone {zone}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">₹{cost as any}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">COD vs Prepaid</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20">
                  <svg className="w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray={`${(analytics.cod_vs_prepaid?.cod_orders || 0) * 2.26} 226`}
                      strokeDashoffset="0"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <span className="absolute text-sm font-semibold">
                    {analytics.cod_vs_prepaid?.cod_orders || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">COD Orders</p>
                <p className="text-sm font-medium">₹{analytics.cod_vs_prepaid?.cod_average_value || 0}</p>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20">
                  <svg className="w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={`${(analytics.cod_vs_prepaid?.prepaid_orders || 0) * 2.26} 226`}
                      strokeDashoffset="0"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <span className="absolute text-sm font-semibold">
                    {analytics.cod_vs_prepaid?.prepaid_orders || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Prepaid Orders</p>
                <p className="text-sm font-medium">₹{analytics.cod_vs_prepaid?.prepaid_average_value || 0}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">COD Success Rate</span>
                <span className="font-medium text-gray-900">
                  {analytics.cod_vs_prepaid?.cod_success_rate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Fastest Zone</p>
              <p className="text-xs text-green-700 mt-1">
                Zone {analytics.delivery_performance?.fastest_zone || 'A'} - Same City
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">A</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900">Most Orders</p>
              <p className="text-xs text-orange-700 mt-1">Zone D - Rest of India</p>
            </div>
            <div className="text-2xl font-bold text-orange-600">D</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Slowest Zone</p>
              <p className="text-xs text-red-700 mt-1">
                Zone {analytics.delivery_performance?.slowest_zone || 'E'} - Northeast/J&K
              </p>
            </div>
            <div className="text-2xl font-bold text-red-600">E</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAnalytics;