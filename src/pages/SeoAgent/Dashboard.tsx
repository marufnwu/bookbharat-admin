import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Gauge,
  ListChecks,
  Settings,
  XCircle,
} from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoIssueGroup, SeoRun } from '../../types/seoAgent';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const statusStyle = (status: SeoRun['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'halted':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
}> = ({ label, value, hint, icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="rounded-lg bg-gray-50 p-2 text-gray-500">{icon}</div>
    </div>
  </div>
);

const IntegrationPill: React.FC<{ name: string; configured: boolean }> = ({ name, configured }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
    <span className="text-sm font-medium text-gray-700">{name}</span>
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        configured
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}
    >
      {configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {configured ? 'Configured' : 'Not configured'}
    </span>
  </div>
);

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seo-agent-dashboard'],
    queryFn: seoAgentApi.dashboard,
    refetchInterval: 60_000,
  });

  const { data: groups } = useQuery({
    queryKey: ['seo-agent-issue-groups', 'all'],
    queryFn: () => seoAgentApi.issueGroups(),
  });

  const runMutation = useMutation({
    mutationFn: () => seoAgentApi.runAudit({ scope: 'product', limit: 20, dry_run: true }),
    onSuccess: () => {
      toast.success('Dry-run audit finished');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Audit failed'),
  });

  const merchantMutation = useMutation({
    mutationFn: seoAgentApi.runMerchantDiagnostics,
    onSuccess: () => {
      toast.success('Merchant diagnostics finished');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-issue-groups'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Merchant diagnostics failed'),
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Could not load the SEO agent dashboard.</span>
        </div>
        <p className="mt-2 text-sm text-red-600">
          {(error as Error)?.message || 'Check the admin API and permissions.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const budgetPercent =
    data.budget.monthly_budget > 0
      ? Math.min(100, Math.round((data.budget.monthly_spend / data.budget.monthly_budget) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-semibold text-gray-900">AI SEO Agent</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Read-only audit state, issue queue, budget, and integration health.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/seo-agent/issues"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open issues
          </Link>
          <Link
            to="/seo-agent/settings"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      <div
        className={`rounded-xl border p-5 ${
          data.settings?.kill_switch
            ? 'border-red-200 bg-red-50'
            : data.settings?.dry_run || !data.settings?.enabled
              ? 'border-amber-200 bg-amber-50'
              : 'border-green-200 bg-green-50'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">
              {data.settings?.kill_switch
                ? 'All writes are blocked'
                : !data.settings?.enabled
                  ? 'Agent is disabled'
                  : data.settings?.dry_run
                    ? 'Dry-run: reporting only'
                    : 'Live: writes are allowed'}
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              {data.settings?.kill_switch
                ? 'The kill switch is on. Turn it off in Settings before any write can happen.'
                : !data.settings?.enabled
                  ? 'Scheduled and manual runs will not start until the agent is enabled.'
                  : data.settings?.dry_run
                    ? 'No product data will change until dry-run is off and automatic fixes are on.'
                    : data.settings?.tier_1_enabled
                      ? 'Automatic fixes are on. The agent can change alt text and validated Bengali copy.'
                      : 'Live mode is on, but automatic fixes are off. The agent can only create proposals.'}
            </p>
          </div>
          <Link
            to="/seo-agent/settings"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Change mode
          </Link>
        </div>
      </div>

      {data.preflight && !data.preflight.ready && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-900">Live runs are blocked</h2>
          <p className="mt-1 text-sm text-red-800">
            Fix these before enabling automatic fixes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {data.preflight.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-700">
            Environment: {data.preflight.facts.environment} · Products:{' '}
            {data.preflight.facts.products} · Auto-fix issues:{' '}
            {data.preflight.facts.auto_fix_issues} · Mapped:{' '}
            {data.preflight.facts.mapped_auto_fix_issues}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Action center</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              The next changes are grouped by root cause. Review the batch, not individual rows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || merchantMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Activity className="h-4 w-4" />
              {runMutation.isPending ? 'Running audit…' : 'Run dry-run audit'}
            </button>
            <button
              type="button"
              onClick={() => merchantMutation.mutate()}
              disabled={runMutation.isPending || merchantMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ListChecks className="h-4 w-4" />
              {merchantMutation.isPending ? 'Refreshing…' : 'Refresh Merchant data'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(groups || []).slice(0, 6).map((group: SeoIssueGroup) => (
            <Link
              key={`${group.group_key}-${group.actionability}`}
              to="/seo-agent/issues"
              className="rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:bg-primary-50/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{group.label}</p>
                <span className="text-xs font-semibold text-gray-700">{group.products}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {group.issues} issues ·{' '}
                {group.actionability === 'auto_fix'
                  ? 'safe to fix'
                  : group.actionability === 'needs_approval'
                    ? 'needs approval'
                    : 'manual review'}
              </p>
            </Link>
          ))}
          {(!groups || groups.length === 0) && (
            <p className="text-sm text-gray-500">No open issue groups. Run an audit to refresh.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open issues"
          value={data.issues.open_total}
          hint={`${data.issues.by_severity.critical || 0} critical · ${data.issues.by_severity.high || 0} high`}
          icon={<ListChecks className="h-5 w-5" />}
        />
        <StatCard
          label="Pending proposals"
          value={data.proposals.pending}
          hint="Tier 3 changes waiting for review"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Applied changes"
          value={data.changes.applied}
          hint={`${data.changes.pending_verification} awaiting verification`}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Monthly budget"
          value={`$${data.budget.monthly_spend.toFixed(2)}`}
          hint={`of $${data.budget.monthly_budget.toFixed(2)} · ${budgetPercent}%`}
          icon={<Gauge className="h-5 w-5" />}
        />
      </div>

      {data.budget.exceeded && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Monthly budget reached</p>
            <p className="mt-1 text-sm">
              New runs will stop at the budget guard. Review the budget in Settings before continuing.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white xl:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Recent runs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Started</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Issues</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_runs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      No runs yet. Start a dry-run audit from the command line.
                    </td>
                  </tr>
                )}
                {data.recent_runs.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-700">
                      {formatDate(run.started_at)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{run.mode}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(run.status)}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{run.issues_found}</td>
                    <td className="px-5 py-3 text-gray-700">${run.cost_usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Last run</h2>
            {data.last_run ? (
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-800">Status:</span>{' '}
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusStyle(data.last_run.status)}`}>
                    {data.last_run.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-gray-800">Mode:</span> {data.last_run.mode}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Pages:</span>{' '}
                  {(data.last_run.summary_json?.pages_crawled as number) ?? '—'}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Issues:</span>{' '}
                  {data.last_run.issues_found}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Finished:</span>{' '}
                  {formatDate(data.last_run.ended_at)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No run recorded yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Recent alerts</h2>
            <div className="mt-3 space-y-2">
              {(data.alerts || []).length === 0 && (
                <p className="text-sm text-gray-500">No alerts recorded.</p>
              )}
              {(data.alerts || []).map((alert) => (
                <div key={alert.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        alert.decision === 'allowed'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {alert.decision}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-700">{alert.reason || 'Alert'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Integrations</h2>
            <div className="mt-3 space-y-2">
              <IntegrationPill name="Search Console" configured={data.integrations.search_console.configured} />
              <IntegrationPill name="GA4" configured={data.integrations.ga4.configured} />
              <IntegrationPill name="PageSpeed" configured={data.integrations.pagespeed.configured} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
