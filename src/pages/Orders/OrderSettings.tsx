import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';
import OrderCharges from '../Settings/OrderCharges';
import DynamicSettings from '../../components/settings/DynamicSettings';
import {
  Play,
  Truck,
  Receipt,
  Loader2,
} from 'lucide-react';

interface CarrierSyncInfo {
  code: string;
  name: string;
  is_active: boolean;
  is_primary: boolean;
  sync_enabled: boolean;
}

interface DeliverySyncStats {
  synced_last_24h: number;
  last_synced_at: string | null;
  pending_tracking: number;
}

interface StatsResponse {
  carriers: CarrierSyncInfo[];
  stats: DeliverySyncStats;
}

const TABS = [
  { id: 'delivery-sync', label: 'Delivery Status Sync', icon: Truck },
  { id: 'charges', label: 'Order Charges', icon: Receipt },
] as const;

const OrderSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'charges' ? 'charges' : 'delivery-sync';

  const setActiveTab = (tab: string) => {
    setSearchParams(tab === 'delivery-sync' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Order Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Consolidated order-related settings — delivery status sync and order charges.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Order settings tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'delivery-sync' ? <DeliveryStatusSyncTab /> : <OrderCharges />}
    </div>
  );
};

const DeliveryStatusSyncTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [syncOutput, setSyncOutput] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-delivery-sync-stats'],
    queryFn: async () => {
      const response = await api.get('/orders/delivery-sync/stats');
      return response.data.data as StatsResponse;
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: async (dry: boolean) => {
      const response = await api.post('/orders/delivery-sync/run', {
        dry_run: dry,
      });
      return response.data;
    },
    onSuccess: (result: any) => {
      setSyncOutput(result?.data?.output || 'Done.');
      toast.success('Sync run completed');
      queryClient.invalidateQueries({ queryKey: ['order-delivery-sync-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Sync run failed');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load delivery sync stats.{' '}
        <button className="font-medium underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Synced last 24h</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data.stats.synced_last_24h}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Awaiting tracking update</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{data.stats.pending_tracking}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Last tracked</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {data.stats.last_synced_at ? new Date(data.stats.last_synced_at).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Dynamic settings form (intervals, boundaries, batch, excluded carriers) */}
      <DynamicSettings
        group="order_delivery_sync"
        title="Delivery Status Sync"
        description="Polling cadence, age tiers, and carrier participation for the scheduled courier tracking sync."
      />

      {/* Manual sync */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-base font-medium text-gray-900">Manual Sync</h3>
        <p className="mt-1 text-sm text-gray-500">
          Run the delivery-status poller immediately. Dry run lists what would be dispatched without touching the queue.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => syncNowMutation.mutate(true)}
            disabled={syncNowMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncNowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Dry Run
          </button>
          <button
            type="button"
            onClick={() => syncNowMutation.mutate(false)}
            disabled={syncNowMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {syncNowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Sync Now
          </button>
        </div>
        {syncOutput && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
            {syncOutput}
          </pre>
        )}
      </div>
    </div>
  );
};

export default OrderSettings;
