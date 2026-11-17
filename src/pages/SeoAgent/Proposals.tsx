import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ClipboardCheck, X } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi, type SeoAgentListParams } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoProposal } from '../../types/seoAgent';

const riskClass: Record<string, string> = {
  low: 'border-blue-200 bg-blue-50 text-blue-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-red-200 bg-red-50 text-red-700',
  needs_data: 'border-gray-200 bg-gray-50 text-gray-600',
};

const statusClass: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  applied: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-gray-200 bg-gray-50 text-gray-600',
};

const Proposals: React.FC = () => {
  const [filters, setFilters] = useState<SeoAgentListParams>({
    page: 1,
    per_page: 20,
    status: 'pending',
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seo-agent-proposals', filters],
    queryFn: () => seoAgentApi.proposals(filters),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      seoAgentApi.approveProposal(id, note),
    onSuccess: () => {
      toast.success('Proposal approved and applied');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-changes'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not approve the proposal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      seoAgentApi.rejectProposal(id, note),
    onSuccess: () => {
      toast.success('Proposal rejected');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not reject the proposal');
    },
  });

  const approve = (proposal: SeoProposal) => {
    const note = window.prompt('Approval note (optional)', 'Approved');
    if (note === null) return;
    approveMutation.mutate({ id: proposal.id, note: note || undefined });
  };

  const reject = (proposal: SeoProposal) => {
    const note = window.prompt('Rejection reason (required)', '');
    if (!note) return;
    rejectMutation.mutate({ id: proposal.id, note });
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
          Could not load proposals.
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
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Tier 3 proposals</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Human review queue for slug, redirect, canonical, content, indexing, and other high-risk changes.
          </p>
        </div>
        <div className="text-sm text-gray-500">{meta.total} proposals</div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={filters.status || ''}
          onChange={(event) => setFilter('status', event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="applied">Applied</option>
          <option value="rejected">Rejected</option>
          <option value="">All statuses</option>
        </select>

        <select
          value={filters.risk || ''}
          onChange={(event) => setFilter('risk', event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All risks</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="needs_data">Needs data</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Proposal</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Current → Proposed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reviewed</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No proposals match these filters.
                  </td>
                </tr>
              )}
              {data.data.map((proposal) => (
                <tr key={proposal.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{proposal.type}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(proposal.created_at).toLocaleString()}
                    </p>
                    {proposal.evidence_json && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-primary-600">
                          Evidence
                        </summary>
                        <pre className="mt-2 max-w-xs overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                          {JSON.stringify(proposal.evidence_json, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {proposal.entity_url ? (
                      <a
                        href={proposal.entity_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {proposal.entity_type} #{proposal.entity_id}
                      </a>
                    ) : (
                      <>
                        {proposal.entity_type} #{proposal.entity_id}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        riskClass[proposal.risk] || riskClass.medium
                      }`}
                    >
                      {proposal.risk}
                    </span>
                  </td>
                  <td className="max-w-[320px] px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Current</p>
                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                      {JSON.stringify(proposal.current_values ?? {}, null, 2)}
                    </pre>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Proposed</p>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-green-50 p-2 text-[11px] text-gray-700">
                      {JSON.stringify(proposal.payload_json ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusClass[proposal.status] || statusClass.pending
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {proposal.reviewed_at ? (
                      <>
                        <p>{new Date(proposal.reviewed_at).toLocaleString()}</p>
                        {proposal.review_note && (
                          <p className="mt-1 max-w-[180px] text-gray-500">{proposal.review_note}</p>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {proposal.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => approve(proposal)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(proposal)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
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

export default Proposals;
