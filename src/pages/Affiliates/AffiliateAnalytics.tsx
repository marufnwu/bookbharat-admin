import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { affiliatesApi } from '@/api/affiliates';
import { Card, CardContent, Button, LoadingSpinner, StatCard } from '@/components';
import Table from '@/components/Table';
import { CurrencyRupeeIcon, ShoppingBagIcon, ChartBarIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

export default function AffiliateAnalytics() {
  const [days, setDays] = useState(30);

  const { data: clicksData, isLoading: loadingClicks } = useQuery({
    queryKey: ['affiliate-analytics-clicks', days],
    queryFn: () => affiliatesApi.analyticsClicks({ days }),
  });

  const { data: topLinks } = useQuery({
    queryKey: ['affiliate-analytics-top-links'],
    queryFn: () => affiliatesApi.analyticsTopLinks({ limit: 10 }),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['affiliate-analytics-top-products'],
    queryFn: () => affiliatesApi.analyticsTopProducts({ limit: 10 }),
  });

  const dailyClicks = clicksData?.daily_clicks ?? [];
  const dailyOrders = clicksData?.daily_orders ?? [];

  const chartData = dailyClicks.map((c: any) => {
    const order = dailyOrders.find((o: any) => o.date === c.date);
    return {
      date: c.date,
      clicks: Number(c.clicks),
      orders: order ? Number(order.orders) : 0,
      sales: order ? Number(order.sales) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliate Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Click trends, conversion funnels, and top performers</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${days === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loadingClicks ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              title="Total Clicks"
              value={clicksData?.total_clicks?.toLocaleString() ?? '0'}
              icon={<CursorArrowRaysIcon className="h-6 w-6" />}
              iconBgColor="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Total Orders"
              value={clicksData?.total_orders?.toLocaleString() ?? '0'}
              icon={<ShoppingBagIcon className="h-6 w-6" />}
              iconBgColor="bg-violet-100 text-violet-600"
            />
            <StatCard
              title="Conversion Rate"
              value={`${clicksData?.conversion_rate ?? 0}%`}
              icon={<ChartBarIcon className="h-6 w-6" />}
              iconBgColor="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Avg Order Value"
              value={fmt(clicksData?.avg_order_value)}
              icon={<CurrencyRupeeIcon className="h-6 w-6" />}
              iconBgColor="bg-amber-100 text-amber-600"
            />
          </div>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Click & Order Trend</h2>
            </div>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Clicks" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top Links</h2>
              <span className="text-xs text-gray-400">All time</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">Not filtered by date range</p>
          </div>
          <CardContent>
            <Table
              data={topLinks?.links ?? []}
              columns={[
                { key: 'affiliate_name', title: 'Affiliate', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.affiliate_name ?? '—'}</span> },
                { key: 'code', title: 'Code', render: (_: any, r: any) => <span className="font-mono text-xs">{r.code}</span> },
                { key: 'clicks_count', title: 'Clicks', render: (_: any, r: any) => r.clicks_count, align: 'right' as const },
                { key: 'orders_count', title: 'Orders', render: (_: any, r: any) => r.orders_count, align: 'right' as const },
                { key: 'conversion_rate', title: 'Conv %', render: (_: any, r: any) => r.conversion_rate + '%', align: 'right' as const },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <span className="text-xs text-gray-400">All time</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">Not filtered by date range</p>
          </div>
          <CardContent>
            <Table
              data={topProducts?.products ?? []}
              columns={[
                { key: 'product_name', title: 'Product', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.product_name ?? '—'}</span> },
                { key: 'order_count', title: 'Orders', render: (_: any, r: any) => r.order_count, align: 'right' as const },
                { key: 'affiliate_count', title: 'Affiliates', render: (_: any, r: any) => r.affiliate_count, align: 'right' as const },
                { key: 'total_sales', title: 'Sales', render: (_: any, r: any) => fmt(r.total_sales), align: 'right' as const },
                { key: 'total_commission', title: 'Commission', render: (_: any, r: any) => fmt(r.total_commission), align: 'right' as const },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
