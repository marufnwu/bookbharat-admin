/**
 * Payment Analytics — placeholder.
 *
 * The frontend previously called 5 endpoints under
 *   /api/v1/admin/payment-analytics/{summary,revenue-trend,
 *     method-distribution,gateway-performance,recent-failed}
 * none of which exist in the backend. The previous implementation also
 * used bare `axios` instead of the project's configured `api` instance,
 * so even if the routes had existed, auth headers + base URL would have
 * been missing.
 *
 * This page is now a deliberate placeholder until those endpoints are
 * built (or the page is replaced by data surfaced through the existing
 * dashboard /order-insights endpoint, which already exposes
 * `payment_method_analysis`).
 */

import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components';

const PaymentAnalytics: React.FC = () => (
  <div className="space-y-6 pb-20">
    <div className="flex items-center gap-3">
      <CreditCard className="h-8 w-8 text-gray-400" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Analytics</h1>
        <p className="text-gray-500 mt-1">
          Payment-method breakdown, gateway health, and revenue trends.
        </p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Page under construction</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          The dedicated{' '}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-sm">
            /admin/payment-analytics
          </code>{' '}
          endpoints are not yet implemented on the backend. Until they are,
          payment-method revenue and gateway stats live inside{' '}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-sm">
            /admin/dashboard/order-insights
          </code>
          {' '}under{' '}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-sm">
            order_insights.payment_method_analysis
          </code>
          .
        </p>
      </CardContent>
    </Card>
  </div>
);

export default PaymentAnalytics;
