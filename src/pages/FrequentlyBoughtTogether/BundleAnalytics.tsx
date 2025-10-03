import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { bundleAnalyticsApi } from '../../api';
import { Table, Button, Badge, LoadingSpinner } from '../../components';
import { TableColumn } from '../../types';

interface Bundle {
  bundle_id: string;
  product_ids_array: number[];
  views: number;
  clicks: number;
  add_to_cart: number;
  purchases: number;
  total_revenue: number;
  conversion_rate: number;
  products: Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
  }>;
}

const BundleAnalytics: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    sort_by: 'views',
    sort_order: 'desc',
    min_views: '',
    min_conversion_rate: '',
  });

  const [topBundlesMetric, setTopBundlesMetric] = useState<string>('conversion_rate');

  // Queries
  const { data: bundlesData, isLoading } = useQuery({
    queryKey: ['bundle-analytics', filters],
    queryFn: () => bundleAnalyticsApi.getBundles(filters),
  });

  const { data: statsData } = useQuery({
    queryKey: ['bundle-analytics-stats'],
    queryFn: bundleAnalyticsApi.getStatistics,
  });

  const { data: funnelData } = useQuery({
    queryKey: ['bundle-analytics-funnel'],
    queryFn: bundleAnalyticsApi.getFunnel,
  });

  const { data: topBundlesData } = useQuery({
    queryKey: ['bundle-analytics-top', topBundlesMetric],
    queryFn: () => bundleAnalyticsApi.getTopBundles({ metric: topBundlesMetric, limit: 10 }),
  });

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await bundleAnalyticsApi.exportData(format);

      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bundle-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bundle-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getConversionBadge = (rate: number) => {
    if (rate >= 10) {
      return <Badge variant="success">{formatPercentage(rate)}</Badge>;
    } else if (rate >= 5) {
      return <Badge variant="warning">{formatPercentage(rate)}</Badge>;
    }
    return <Badge variant="error">{formatPercentage(rate)}</Badge>;
  };

  const stats = statsData?.statistics || {};
  const bundles = bundlesData?.bundles?.data || [];
  const pagination = bundlesData?.bundles || {};
  const funnel = funnelData?.funnel || {};
  const topBundles = topBundlesData?.bundles || [];

  const columns: TableColumn<Bundle>[] = [
    {
      key: 'bundle_id',
      title: 'Bundle',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">
            {record.products?.slice(0, 2).map(p => p.name).join(' + ')}
            {record.products?.length > 2 && ` +${record.products.length - 2} more`}
          </div>
          <div className="text-xs text-gray-500">{record.bundle_id}</div>
        </div>
      ),
    },
    {
      key: 'views',
      title: 'Views',
      sortable: true,
      render: (value) => <span className="font-medium">{value.toLocaleString()}</span>,
    },
    {
      key: 'add_to_cart',
      title: 'Add to Cart',
      sortable: true,
      render: (value) => <span className="font-medium">{value.toLocaleString()}</span>,
    },
    {
      key: 'purchases',
      title: 'Purchases',
      sortable: true,
      render: (value) => <span className="font-medium text-green-600">{value.toLocaleString()}</span>,
    },
    {
      key: 'total_revenue',
      title: 'Revenue',
      sortable: true,
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
    {
      key: 'conversion_rate',
      title: 'Conv. Rate',
      sortable: true,
      render: (value) => getConversionBadge(value),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bundle Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track performance and conversion metrics for product bundles
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Bundles</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {stats.total_bundles || 0}
              </div>
            </div>
            <ChartBarIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Views</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {(stats.total_views || 0).toLocaleString()}
              </div>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Purchases</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {(stats.total_purchases || 0).toLocaleString()}
              </div>
            </div>
            <ShoppingCartIcon className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Revenue</div>
              <div className="mt-2 text-3xl font-bold text-purple-600">
                {formatCurrency(stats.total_revenue || 0)}
              </div>
            </div>
            <CurrencyRupeeIcon className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {(funnel.metrics?.total_views || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Views</div>
            <div className="text-xs text-gray-500 mt-1">100%</div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">
              {(funnel.metrics?.total_add_to_cart || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Add to Cart</div>
            <div className="text-xs text-gray-500 mt-1">
              {funnel.metrics?.view_to_cart_rate ? formatPercentage(funnel.metrics.view_to_cart_rate) : '0%'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {(funnel.metrics?.total_purchases || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Purchases</div>
            <div className="text-xs text-gray-500 mt-1">
              {funnel.metrics?.overall_conversion_rate ? formatPercentage(funnel.metrics.overall_conversion_rate) : '0%'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Avg Conversion Rate:</span>
              <span className="ml-2 font-medium">
                {stats.average_conversion_rate ? formatPercentage(stats.average_conversion_rate) : '0%'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg Order Value:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(stats.average_order_value || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bundles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Bundles</h2>
          <select
            value={topBundlesMetric}
            onChange={(e) => setTopBundlesMetric(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="conversion_rate">By Conversion Rate</option>
            <option value="views">By Views</option>
            <option value="purchases">By Purchases</option>
            <option value="total_revenue">By Revenue</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bundle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topBundles.map((bundle: Bundle, index: number) => (
                <tr key={bundle.bundle_id}>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge>{index + 1}</Badge>
                      <div>
                        <div className="font-medium text-gray-900">
                          {bundle.products?.slice(0, 2).map(p => p.name).join(' + ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bundle.product_ids_array?.length || 0} products
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{bundle.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">
                    {bundle.purchases.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(bundle.total_revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getConversionBadge(bundle.conversion_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {bundles.length} of {pagination.total || 0} bundles
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleExport('json')}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* All Bundles Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Bundles</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Table
            data={bundles}
            columns={columns}
            pagination={{
              current: pagination.current_page || 1,
              pageSize: pagination.per_page || 20,
              total: pagination.total || 0,
              onChange: (page) => setFilters({ ...filters, page }),
            }}
            onSort={(key, direction) => {
              setFilters({
                ...filters,
                sort_by: key,
                sort_order: direction,
              });
            }}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Understanding Bundle Analytics</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Views:</strong> How many times the bundle was displayed to customers</li>
          <li>• <strong>Add to Cart:</strong> How many times the bundle was added to cart</li>
          <li>• <strong>Purchases:</strong> How many times the bundle was actually purchased</li>
          <li>• <strong>Conversion Rate:</strong> (Purchases / Views) × 100 - Higher is better</li>
          <li>• <strong>View to Cart Rate:</strong> Percentage of views that resulted in add-to-cart</li>
          <li>• Good conversion rates are typically 5-15% for bundles</li>
        </ul>
      </div>
    </div>
  );
};

export default BundleAnalytics;
