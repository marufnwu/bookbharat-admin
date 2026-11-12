import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi, type SeoAgentListParams } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoChange } from '../../types/seoAgent';

const statusClass: Record<string, string> = {
  applied: 'border-blue-200 bg-blue-50 text-blue-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  verified: 'border-green-200 bg-green-50 text-green-700',
  rolled_back: 'border-gray-200 bg-gray-50 text-gray-600',
  failed: 'border-red-200 bg-red-50 text-red-700',
};

const verdictClass: Record<string, string> = {
  improved: 'text-green-700',
  neutral: 'text-gray-600',
  worse: 'text-red-700',
};

const Changes: React.FC = () => {
  const [filters, setFilters] = useState<SeoAgentListParams>({
    page: 1,
    per_page: 20,
    status: 'applied',
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seo-agent-changes', filters],
    queryFn: () => seoAgentApi.changes(filters),
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      seoAgentApi.rollbackChange(id, reason),
    onSuccess: () => {
      toast.success('Change rolled back');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-changes'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not roll back the change');
    },
  });

  const rollback = (change: SeoChange) => {
    const reason = window.prompt('Reason for rollback', 'Manual rollback');
    if (!reason) return;
    rollbackMutation.mutate({ id: change.id, reason });
  };

  const setFilter = (key: keyof SeoAgentListParams, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value || undefined, page: 1 }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5" />
          Could not load change history.
        </div>
        <p className="mt-2 text-sm">{(error as Error)?.message}</p>
      </div>
    );
  }

  const meta = data.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SEO changes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every applied change with its before/after values, verification state, and rollback control.
          </p>
        </div>
        <div className="text-sm text-gray-500">{meta.total} changes</div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={filters.status || ''}
          onChange={(event) => setFilter('status', event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="applied">Applied</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rolled_back">Rolled back</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={filters.tier || ''}
          onChange={(event) => setFilter('tier', event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>

        <select
          value={filters.entity_type || ''}
          onChange={(event) => setFilter('entity_type', event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All entities</option>
          <option value="product">Product</option>
          <option value="product_image">Product image</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Field</th>
                <th className="px-4 py-3 font-medium">Old value</th>
                <th className="px-4 py-3 font-medium">New value</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    No changes match these filters.
                  </td>
                </tr>
              )}
              {data.data.map((change) => (
                <tr key={change.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {change.entity_type} #{change.entity_id}
                    </p>
                    <p className="mt-0.5 max-w-[180px] truncate text-xs text-gray-500">
                      {change.reason || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{change.field}</td>
                  <td className="max-w-[180px] px-4 py-3">
                    <p className="line-clamp-3 break-words text-gray-600">{change.old_value || '—'}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="line-clamp-3 break-words text-gray-800">{change.new_value || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">T{change.tier}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusClass[change.status] || statusClass.pending
                      }`}
                    >
                      {change.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-xs font-medium ${change.verdict ? verdictClass[change.verdict] : 'text-gray-500'}`}>
                      {change.verdict || (change.status === 'applied' ? 'pending' : '—')}
                    </p>
                    {change.verify_14_at && (
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        14d: {new Date(change.verify_14_at).toLocaleDateString()}
                      </p>
                    )}
                    {change.verify_28_at && (
                      <p className="text-[11px] text-gray-500">
                        28d: {new Date(change.verify_28_at).toLocaleDateString()}
                      </p>
                    )}
                    {change.baseline_json && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[11px] font-medium text-primary-600">
                          Baseline
                        </summary>
                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-600">
                          <p>
                            Entity: {String((change.baseline_json as any).impressions ?? 0)} impressions
                          </p>
                          <p>
                            Control: {String((change.baseline_json as any).control?.impressions ?? 0)} impressions
                          </p>
                          <p>
                            Controls: {(change.control_entity_ids_json || []).join(', ') || '—'}
                          </p>
                        </div>
                      </details>
                    )}
                    {change.rollback_reason && (
                      <p className="mt-1 max-w-[180px] text-[11px] text-red-600">{change.rollback_reason}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {change.applied_at ? new Date(change.applied_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {change.status === 'applied' ? (
                      <button
                        type="button"
                        onClick={() => rollback(change)}
                        disabled={rollbackMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Roll back
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <span>
            Page {meta.current_page} of {meta.last_page || 1}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => setFilters((previous) => ({ ...previous, page: Math.max(1, (previous.page || 1) - 1) }))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setFilters((previous) => ({ ...previous, page: (previous.page || 1) + 1 }))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changes;
