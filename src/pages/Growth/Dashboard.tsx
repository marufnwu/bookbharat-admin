import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, IndianRupee, RefreshCw, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(2)}%`;

const Stat: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  muted?: boolean;
}> = ({ label, value, hint, icon, muted }) => (
  <div className={`rounded-xl border bg-white p-5 ${muted ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2 text-gray-500">{icon}</div>
    </div>
  </div>
);

const GrowthDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const healthQuery = useQuery({ queryKey: ['growth-health'], queryFn: seoAgentApi.growthHealth });
  const summaryQuery = useQuery({ queryKey: ['growth-summary', 28], queryFn: () => seoAgentApi.growthSummary(28) });
  const trendQuery = useQuery({ queryKey: ['growth-trend', 28], queryFn: () => seoAgentApi.growthTrend(28) });
  const productsQuery = useQuery({
    queryKey: ['growth-products', 28, 'views'],
    queryFn: () => seoAgentApi.growthProducts(28, 'views'),
  });
  const searchGapsQuery = useQuery({
    queryKey: ['growth-search-gaps', 90],
    queryFn: () => seoAgentApi.searchGaps(90, 10),
  });
  const checkoutQuery = useQuery({
    queryKey: ['growth-checkout-funnel', 28],
    queryFn: () => seoAgentApi.checkoutFunnel(28),
  });

  const aggregateMutation = useMutation({
    mutationFn: seoAgentApi.aggregateGrowth,
    onSuccess: () => {
      toast.success('Growth metrics refreshed');
      queryClient.invalidateQueries({ queryKey: ['growth-health'] });
      queryClient.invalidateQueries({ queryKey: ['growth-summary'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not refresh metrics'),
  });

  if (healthQuery.isLoading || summaryQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (healthQuery.isError || summaryQuery.isError || !healthQuery.data || !summaryQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5" />
          Could not load growth metrics.
        </div>
      </div>
    );
  }

  const health = healthQuery.data;
  const summary = summaryQuery.data;
  const trusted = summary.conversion_metrics_trusted;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Growth Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Purchase funnel, product performance, and data quality for the last 28 days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => aggregateMutation.mutate()}
          disabled={aggregateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${aggregateMutation.isPending ? 'animate-spin' : ''}`} />
          {aggregateMutation.isPending ? 'Refreshing…' : 'Refresh metrics'}
        </button>
      </div>

      {!health.healthy && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold text-amber-900">Tracking is incomplete</h2>
              <p className="mt-1 text-sm text-amber-800">
                Conversion and revenue-per-session are hidden until tracking is fixed.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {health.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-700">
                Last event: {health.facts.last_event_at || 'never'} · Last order:{' '}
                {health.facts.last_order_at || 'never'}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Source: {health.facts.environment || 'unknown'} ·{' '}
                {health.facts.database || 'unknown'} on {health.facts.database_host || 'unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Sessions"
          value={summary.totals.sessions.toLocaleString('en-IN')}
          hint="Distinct analytics sessions"
          icon={<Users className="h-5 w-5" />}
        />
        <Stat
          label="Product views"
          value={summary.totals.product_views.toLocaleString('en-IN')}
          hint="Product page views"
          icon={<TrendingUp className="h-5 w-5" />}
          muted={!trusted}
        />
        <Stat
          label="Add to cart"
          value={summary.totals.add_to_cart.toLocaleString('en-IN')}
          hint={trusted ? `${percent(summary.totals.add_to_cart_rate)} of product views` : 'Tracking incomplete'}
          icon={<ShoppingCart className="h-5 w-5" />}
          muted={!trusted}
        />
        <Stat
          label="Revenue"
          value={money(summary.totals.revenue)}
          hint="Paid orders in the period"
          icon={<IndianRupee className="h-5 w-5" />}
          muted={!trusted}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Purchases"
          value={summary.totals.purchases.toLocaleString('en-IN')}
          hint="Paid orders"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <Stat
          label="Conversion rate"
          value={trusted ? percent(summary.totals.conversion_rate) : 'Not trusted'}
          hint={trusted ? 'Purchases ÷ sessions' : 'Waiting for tracking health'}
          icon={<TrendingUp className="h-5 w-5" />}
          muted={!trusted}
        />
        <Stat
          label="Checkout completion"
          value={trusted ? percent(summary.totals.checkout_completion_rate) : 'Not trusted'}
          hint={trusted ? 'Purchases ÷ checkout starts' : 'Waiting for tracking health'}
          icon={<ShoppingCart className="h-5 w-5" />}
          muted={!trusted}
        />
        <Stat
          label="Revenue per session"
          value={trusted ? money(summary.totals.revenue_per_session) : 'Not trusted'}
          hint={trusted ? 'Revenue ÷ sessions' : 'Waiting for tracking health'}
          icon={<IndianRupee className="h-5 w-5" />}
          muted={!trusted}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-gray-900">Funnel trend</h2>
            <p className="text-xs text-gray-500">Daily sessions, product views, cart additions, and purchases.</p>
          </div>
        </div>
        <div className="mt-4 w-full overflow-x-auto">
          {(trendQuery.data || []).length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No daily metrics yet. Run “Refresh metrics”.
            </div>
          ) : (
            <LineChart
              width={Math.max(700, (trendQuery.data?.length || 0) * 14)}
              height={288}
              data={trendQuery.data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="product_views" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="add_to_cart" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Top products by views</h2>
            <p className="text-xs text-gray-500">Low cart-add rate is the conversion opportunity.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Views</th>
                  <th className="px-4 py-2 font-medium">Cart adds</th>
                  <th className="px-4 py-2 font-medium">ATCR</th>
                  <th className="px-4 py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(productsQuery.data || []).slice(0, 10).map((row) => (
                  <tr key={row.product_id}>
                    <td className="px-4 py-2 text-gray-700">#{row.product_id}</td>
                    <td className="px-4 py-2 text-gray-700">{row.views}</td>
                    <td className="px-4 py-2 text-gray-700">{row.cart_adds}</td>
                    <td className="px-4 py-2 text-gray-700">{percent(row.add_to_cart_rate)}</td>
                    <td className="px-4 py-2 text-gray-700">{money(row.revenue)}</td>
                  </tr>
                ))}
                {(productsQuery.data || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No product metrics yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Search gaps</h2>
            <p className="text-xs text-gray-500">Queries with zero results over the last 90 days.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Query</th>
                  <th className="px-4 py-2 font-medium">Searches</th>
                  <th className="px-4 py-2 font-medium">Zero results</th>
                  <th className="px-4 py-2 font-medium">Click rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(searchGapsQuery.data || []).map((row) => (
                  <tr key={row.query}>
                    <td className="px-4 py-2 text-gray-700">{row.query}</td>
                    <td className="px-4 py-2 text-gray-700">{row.searches}</td>
                    <td className="px-4 py-2 text-gray-700">{row.zero_results}</td>
                    <td className="px-4 py-2 text-gray-700">{percent(row.click_rate)}</td>
                  </tr>
                ))}
                {(searchGapsQuery.data || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No search gap data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Checkout funnel</h2>
          <p className="text-xs text-gray-500">
            Distinct sessions at each step. Drop-off is measured from the previous step.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Step</th>
                <th className="px-4 py-2 font-medium">Sessions</th>
                <th className="px-4 py-2 font-medium">Drop-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 font-medium text-gray-800">Checkout started</td>
                <td className="px-4 py-2 text-gray-700">{checkoutQuery.data?.checkout_started ?? 0}</td>
                <td className="px-4 py-2 text-gray-400">—</td>
              </tr>
              {(checkoutQuery.data?.steps || []).map((row) => (
                <tr key={row.step}>
                  <td className="px-4 py-2 capitalize text-gray-700">{row.step}</td>
                  <td className="px-4 py-2 text-gray-700">{row.sessions}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {row.drop_off_from_previous === null
                      ? '—'
                      : `${(row.drop_off_from_previous * 100).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
              {(checkoutQuery.data?.steps || []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No checkout step data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Data quality</h2>
        <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
          <p>
            <span className="block text-xs text-gray-500">Events in 24h</span>
            {health.facts.events_24h}
          </p>
          <p>
            <span className="block text-xs text-gray-500">Orders in 24h</span>
            {health.facts.orders_24h}
          </p>
          <p>
            <span className="block text-xs text-gray-500">Paid orders in 24h</span>
            {health.facts.paid_orders_24h}
          </p>
          <p>
            <span className="block text-xs text-gray-500">Missing events</span>
            {health.facts.missing_events.length > 0
              ? health.facts.missing_events.join(', ')
              : 'None'}
          </p>
        </div>
        {health.warnings.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-700">
            {health.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {health.ga4 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-900">GA4 verification</h3>
            <div className="mt-2 grid gap-3 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
              <p>
                <span className="block text-xs text-gray-500">Property</span>
                {health.ga4.property_id || '—'}
              </p>
              <p>
                <span className="block text-xs text-gray-500">Measurement ID</span>
                {health.ga4.measurement_id || '—'}
              </p>
              <p>
                <span className="block text-xs text-gray-500">Website sessions</span>
                {health.ga4.platforms.web ?? 0}
              </p>
              <p>
                <span className="block text-xs text-gray-500">App sessions</span>
                {(health.ga4.platforms.android ?? 0) + (health.ga4.platforms.ios ?? 0)}
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Required events:{' '}
              {health.ga4.missing_events.length === 0
                ? 'all present'
                : `missing ${health.ga4.missing_events.join(', ')}`}
            </p>
            {health.ga4.likely_app_property && (
              <p className="mt-2 text-sm font-medium text-red-700">
                This property is receiving app traffic only. Use the website GA4 property.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthDashboard;
