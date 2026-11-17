import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Play, RotateCcw, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { GrowthFinding } from '../../types/seoAgent';

const severityClass: Record<string, string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-blue-200 bg-blue-50 text-blue-700',
};

const actionabilityLabel: Record<string, string> = {
  auto_fix: 'Safe to fix',
  needs_approval: 'Needs approval',
  manual: 'Manual review',
  false_positive: 'False positive',
};

const Findings: React.FC = () => {
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ['growth-finding-groups'],
    queryFn: seoAgentApi.growthFindingGroups,
  });

  const findingsQuery = useQuery({
    queryKey: ['growth-findings', group, status, page],
    queryFn: () =>
      seoAgentApi.growthFindings({
        group: group || undefined,
        status: status || undefined,
        page,
        per_page: 20,
      }),
  });

  const detectMutation = useMutation({
    mutationFn: () => seoAgentApi.detectGrowthFindings(false),
    onSuccess: () => {
      toast.success('Growth audits finished');
      queryClient.invalidateQueries({ queryKey: ['growth-findings'] });
      queryClient.invalidateQueries({ queryKey: ['growth-finding-groups'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Audit failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'open' | 'ignored' }) =>
      seoAgentApi.updateGrowthFinding(id, status),
    onSuccess: () => {
      toast.success('Finding updated');
      queryClient.invalidateQueries({ queryKey: ['growth-findings'] });
      queryClient.invalidateQueries({ queryKey: ['growth-finding-groups'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not update'),
  });

  if (findingsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (findingsQuery.isError || !findingsQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5" />
          Could not load growth findings.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Growth findings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discovery, product page, checkout, and recommendation issues. These are findings only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {detectMutation.isPending ? 'Running audits…' : 'Run growth audits'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="open">Open</option>
          <option value="ignored">Ignored</option>
          <option value="fixed">Fixed</option>
          <option value="">All</option>
        </select>

        <select
          value={group}
          onChange={(event) => {
            setGroup(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All groups</option>
          {(groupsQuery.data || []).map((item) => (
            <option key={item.group_key} value={item.group_key}>
              {item.group_key} ({item.findings})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Finding</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Est. impact</th>
                <th className="px-4 py-3 font-medium">Evidence</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {findingsQuery.data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No growth findings. Run the audits to refresh.
                  </td>
                </tr>
              )}
              {findingsQuery.data.data.map((finding: GrowthFinding) => (
                <tr key={finding.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{finding.type}</p>
                    <p className="text-xs text-gray-500">{finding.group_key}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {finding.url ? (
                      <a href={finding.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                        {finding.entity_type} #{finding.entity_id ?? '—'}
                      </a>
                    ) : (
                      <>
                        {finding.entity_type}
                        {finding.entity_id ? ` #${finding.entity_id}` : ''}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        severityClass[finding.severity] || severityClass.medium
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {actionabilityLabel[finding.actionability] || finding.actionability}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {finding.impact_score === null
                      ? '—'
                      : `₹${Number(finding.impact_score).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <pre className="max-h-28 overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                      {JSON.stringify(finding.evidence_json ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-3">
                    {finding.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => updateMutation.mutate({ id: finding.id, status: 'ignored' })}
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Ignore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateMutation.mutate({ id: finding.id, status: 'open' })}
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <span>
            Page {findingsQuery.data.meta.current_page} of {findingsQuery.data.meta.last_page || 1}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={findingsQuery.data.meta.current_page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={findingsQuery.data.meta.current_page >= findingsQuery.data.meta.last_page}
              onClick={() => setPage((value) => value + 1)}
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

export default Findings;
