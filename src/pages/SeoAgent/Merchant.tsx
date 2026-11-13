import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, RefreshCw, Store } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoIssue, SeoIssueGroup } from '../../types/seoAgent';

const groups: Array<{ key: string; title: string; description: string }> = [
  {
    key: 'merchant_images',
    title: 'Product images',
    description: 'Undersized images, broken image links, and low-resolution images.',
  },
  {
    key: 'merchant_titles',
    title: 'Product titles',
    description: 'ALL CAPS titles and truncated text.',
  },
  {
    key: 'merchant_content_policy',
    title: 'Discovery ads policy',
    description: 'Image or content policy violations on discovery surfaces.',
  },
  {
    key: 'merchant_content_quality',
    title: 'Content quality',
    description: 'Content quality policy violations.',
  },
  {
    key: 'merchant_destination',
    title: 'Disapproved products',
    description: 'Products not serving on one or more destinations.',
  },
  {
    key: 'merchant_data',
    title: 'Required data',
    description: 'Missing required attributes, landing page errors, and non-product data.',
  },
  {
    key: 'merchant_policy',
    title: 'Policy review',
    description: 'Manual review. Some may be false positives from book titles.',
  },
  {
    key: 'merchant_pending',
    title: 'Pending review',
    description: 'Waiting on Google review. No action needed yet.',
  },
];

const MerchantGroup: React.FC<{
  group?: SeoIssueGroup;
  title: string;
  description: string;
  onRefresh: () => void;
  refreshing: boolean;
}> = ({ group, title, description, onRefresh, refreshing }) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<SeoIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const batchMutation = useMutation({
    mutationFn: () =>
      seoAgentApi.runMerchantBatch(
        group?.group_key === 'merchant_titles' ? 'titles' : 'images',
        100
      ),
    onSuccess: () => {
      toast.success('Batch proposals created. Review them in Proposals.');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Could not create batch proposals'),
  });

  const load = async () => {
    if (preview.length > 0) {
      setOpen((value) => !value);
      return;
    }

    setLoading(true);
    try {
      const response = await seoAgentApi.issues({
        page: 1,
        per_page: 10,
        status: 'open',
        group: group?.group_key,
      });
      setPreview(response.data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          <p className="mt-2 text-sm text-gray-700">
            {group ? (
              <>
                <span className="font-semibold">{group.products}</span> products ·{' '}
                <span className="font-semibold">{group.issues}</span> issues
              </>
            ) : (
              'No open issues'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {group && (
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Preview
            </button>
          )}
          {(group?.group_key === 'merchant_titles' || group?.group_key === 'merchant_images') && (
            <button
              type="button"
              onClick={() => batchMutation.mutate()}
              disabled={batchMutation.isPending}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {batchMutation.isPending ? 'Preparing…' : 'Prepare fix batch'}
            </button>
          )}
          <a
            href={seoAgentApi.exportIssuesUrl({ source: 'merchant', group: group?.group_key })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {loading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-4 py-2 text-gray-700">
                      {issue.entity_id ? `#${issue.entity_id}` : issue.entity_type}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-800">{issue.type}</p>
                      <p className="text-xs text-gray-500">
                        {(issue.evidence_json as any)?.detail || '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const Merchant: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seo-agent-issue-groups', 'merchant'],
    queryFn: () => seoAgentApi.issueGroups('merchant'),
  });

  const refreshMutation = useMutation({
    mutationFn: seoAgentApi.runMerchantDiagnostics,
    onSuccess: () => {
      toast.success('Merchant data refreshed');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Refresh failed'),
  });

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
          Could not load Merchant Center data.
        </div>
        <p className="mt-2 text-sm">{(error as Error)?.message}</p>
      </div>
    );
  }

  const byKey = new Map(data.map((group) => [group.group_key, group]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Merchant Center</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Product eligibility issues. Policy and account issues are manual review, never auto-applied.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshMutation.isPending ? 'Refreshing…' : 'Refresh Merchant data'}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <MerchantGroup
            key={group.key}
            title={group.title}
            description={group.description}
            group={byKey.get(group.key)}
            refreshing={refreshMutation.isPending}
            onRefresh={() => refreshMutation.mutate()}
          />
        ))}
      </div>
    </div>
  );
};

export default Merchant;
