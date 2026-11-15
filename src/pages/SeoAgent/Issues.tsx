import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Play,
  RefreshCw,
} from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi, type SeoAgentListParams } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoIssue, SeoIssueGroup } from '../../types/seoAgent';

const actionabilityClass: Record<string, string> = {
  auto_fix: 'border-green-200 bg-green-50 text-green-700',
  needs_approval: 'border-blue-200 bg-blue-50 text-blue-700',
  manual: 'border-amber-200 bg-amber-50 text-amber-700',
  false_positive: 'border-gray-200 bg-gray-50 text-gray-600',
};

const actionabilityLabel: Record<string, string> = {
  auto_fix: 'Safe to fix',
  needs_approval: 'Needs approval',
  manual: 'Manual review',
  false_positive: 'False positive',
};

const severityClass: Record<string, string> = {
  critical: 'text-red-700',
  high: 'text-orange-700',
  medium: 'text-amber-700',
  low: 'text-blue-700',
};

/**
 * The strategist's judgement, shown inline.
 *
 * A declined issue suppresses a write, so the reasoning behind that decision has
 * to be readable. Without this an operator sees "deferred" and a model's
 * conclusion becomes final and unreviewable.
 */
const StrategyAssessment: React.FC<{ strategy: NonNullable<SeoIssue['strategy']> }> = ({
  strategy,
}) => {
  const [open, setOpen] = useState(false);

  const tone =
    strategy.recommendation === 'no_change' || strategy.recommendation === 'insufficient_evidence'
      ? 'border-gray-200 bg-gray-50 text-gray-700'
      : strategy.recommendation === 'build_hub_page'
        ? 'border-purple-200 bg-purple-50 text-purple-800'
        : 'border-blue-200 bg-blue-50 text-blue-800';

  return (
    <div className={`mt-1 rounded border px-2 py-1 text-[11px] ${tone}`}>
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left font-medium"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>AI: {strategy.recommendation.replace(/_/g, ' ')}</span>
        <span className="font-normal opacity-70">({strategy.confidence} confidence)</span>
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {strategy.search_intent && (
            <p>
              <span className="font-medium">Intent:</span> {strategy.search_intent}
            </p>
          )}
          {strategy.reason && <p>{strategy.reason}</p>}
          {strategy.better_target && (
            <p>
              <span className="font-medium">Should live on:</span>{' '}
              <code className="break-all">{strategy.better_target}</code>
            </p>
          )}
          {strategy.content_gaps.length > 0 && (
            <div>
              <span className="font-medium">Missing:</span>
              <ul className="list-inside list-disc">
                {strategy.content_gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
          {strategy.assessed_at && (
            <p className="opacity-60">
              Assessed {new Date(strategy.assessed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const IssueRow: React.FC<{ issue: SeoIssue }> = ({ issue }) => (
  <tr className="align-top">
    <td className="px-4 py-2">
      <p className="font-medium text-gray-800">{issue.type}</p>
      <p className="mt-0.5 text-xs text-gray-500">
        {issue.entity_type}
        {issue.entity_id ? ` #${issue.entity_id}` : ''}
      </p>
      {issue.strategy && <StrategyAssessment strategy={issue.strategy} />}
      {issue.evidence_json && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs font-medium text-primary-600">Evidence</summary>
          <pre className="mt-1 max-w-md overflow-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
            {JSON.stringify(issue.evidence_json, null, 2)}
          </pre>
        </details>
      )}
    </td>
    <td className="max-w-xs px-4 py-2">
      {issue.url ? (
        <a href={issue.url} target="_blank" rel="noreferrer" className="break-all text-xs text-primary-600 hover:underline">
          {issue.url}
        </a>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </td>
    <td className={`px-4 py-2 text-xs font-medium ${severityClass[issue.severity] || ''}`}>
      {issue.severity}
    </td>
    <td className="px-4 py-2 text-xs text-gray-600">{issue.occurrences}</td>
  </tr>
);

const GroupCard: React.FC<{
  group: SeoIssueGroup;
  onRun: () => void;
  running: boolean;
}> = ({ group, onRun, running }) => {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<SeoIssue[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const queryClient = useQueryClient();
  const falsePositiveMutation = useMutation({
    mutationFn: () =>
      seoAgentApi.markGroupFalsePositive(
        group.group_key,
        group.group_key.startsWith('merchant_') ? 'merchant' : 'organic'
      ),
    onSuccess: (data) => {
      toast.success(`${data.updated} issues marked as false positive`);
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update the group'),
  });

  const loadPreview = async () => {
    if (preview.length > 0) {
      setExpanded((value) => !value);
      return;
    }

    setLoadingPreview(true);
    try {
      const params: SeoAgentListParams = {
        page: 1,
        per_page: 10,
        status: 'open',
        group: group.group_key,
      };
      const response = await seoAgentApi.issues(params);
      setPreview(response.data);
      setExpanded(true);
    } catch {
      toast.error('Could not load issue preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadPreview}
            className="mt-0.5 rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
            aria-label="Preview issues"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">{group.label}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {group.products} products · {group.issues} issues ·{' '}
              <span className={`font-medium ${severityClass[group.severity] || ''}`}>
                {group.severity}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              actionabilityClass[group.actionability] || actionabilityClass.manual
            }`}
          >
            {actionabilityLabel[group.actionability] || group.actionability}
          </span>
          <a
            href={seoAgentApi.exportIssuesUrl({
              group: group.group_key,
              source: group.group_key.startsWith('merchant_') ? 'merchant' : 'organic',
            })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
          {group.actionability === 'auto_fix' && (
            <button
              type="button"
              onClick={onRun}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? 'Running…' : 'Run dry-run'}
            </button>
          )}
          {group.actionability === 'manual' && (
            <button
              type="button"
              onClick={() => falsePositiveMutation.mutate()}
              disabled={falsePositiveMutation.isPending}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Mark false positive
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto border-t border-gray-100">
          {loadingPreview ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Issue</th>
                  <th className="px-4 py-2 font-medium">URL</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium">Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const Issues: React.FC = () => {
  const [source, setSource] = useState<'all' | 'organic' | 'merchant'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seo-agent-issue-groups', source],
    queryFn: () => seoAgentApi.issueGroups(source === 'all' ? undefined : source),
  });

  const auditMutation = useMutation({
    mutationFn: () => seoAgentApi.runAudit({ scope: 'product', limit: 20, dry_run: true }),
    onSuccess: () => {
      toast.success('Dry-run audit finished');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Audit failed'),
  });

  const merchantMutation = useMutation({
    mutationFn: seoAgentApi.runMerchantDiagnostics,
    onSuccess: () => {
      toast.success('Merchant diagnostics finished');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Merchant diagnostics failed'),
  });

  const running = auditMutation.isPending || merchantMutation.isPending;

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
          Could not load issue groups.
        </div>
        <p className="mt-2 text-sm">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Issue groups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fix root causes, not individual rows. Each group is one operator action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => auditMutation.mutate()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${auditMutation.isPending ? 'animate-spin' : ''}`} />
            Run dry-run audit
          </button>
          <button
            type="button"
            onClick={() => merchantMutation.mutate()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${merchantMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Merchant data
          </button>
          <a
            href={seoAgentApi.exportIssuesUrl({ source: source === 'all' ? undefined : source })}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            Export all
          </a>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'organic', 'merchant'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSource(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              source === value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {value === 'all' ? 'All' : value === 'organic' ? 'Organic SEO' : 'Merchant Center'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {data.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
            No open issues in this view.
          </div>
        )}
        {data.map((group) => (
          <GroupCard
            key={`${group.group_key}-${group.actionability}`}
            group={group}
            running={running}
            onRun={() => auditMutation.mutate()}
          />
        ))}
      </div>
    </div>
  );
};

export default Issues;
