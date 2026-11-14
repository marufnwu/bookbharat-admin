import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoRolloutGate } from '../../types/seoAgent';

/**
 * Tier A cohort review, measured performance, and rollout gate status.
 *
 * The cohort is what the AI is allowed to draft for. The gates decide whether
 * the agent may move from proposing to applying on its own. Both are human
 * decisions backed by stored evidence, so they belong on one screen.
 */
const GATE_LABELS: Record<string, string> = {
  drafts: 'Gate 1 — reviewed drafts',
  automation: 'Gate 2 — auto-apply',
  widen: 'Gate 3 — widen beyond pilot',
  stop: 'Gate 4 — stop condition',
};

const verdictClass: Record<string, string> = {
  improved: 'border-green-200 bg-green-50 text-green-700',
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  worse: 'border-red-200 bg-red-50 text-red-700',
  insufficient_data: 'border-amber-200 bg-amber-50 text-amber-700',
};

const Cohorts: React.FC = () => {
  const [days, setDays] = useState<14 | 28 | 42>(28);
  const queryClient = useQueryClient();

  const cohortsQuery = useQuery({
    queryKey: ['seo-agent-cohorts'],
    queryFn: seoAgentApi.cohorts,
  });

  const gatesQuery = useQuery({
    queryKey: ['seo-agent-gates'],
    queryFn: seoAgentApi.gates,
  });

  const measurementQuery = useQuery({
    queryKey: ['seo-agent-cohort-measurement', days],
    queryFn: () => seoAgentApi.cohortMeasurement(days),
  });

  const weeklyQuery = useQuery({
    queryKey: ['seo-agent-weekly-report', days],
    queryFn: () => seoAgentApi.weeklyReport(days),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      seoAgentApi.approveCohort(id, notes),
    onSuccess: () => {
      toast.success('Cohort approved');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-gates'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not approve the cohort');
    },
  });

  const retireMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      seoAgentApi.retireCohort(id, notes),
    onSuccess: () => {
      toast.success('Cohort retired');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-gates'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not retire the cohort');
    },
  });

  const approve = (id: number) => {
    const notes = window.prompt('Review notes for this cohort', 'Reviewed against the opportunity report');
    if (notes === null) return;
    approveMutation.mutate({ id, notes });
  };

  const retire = (id: number) => {
    const notes = window.prompt('Why is this cohort retired?', 'Superseded by a newer cohort');
    if (notes === null) return;
    retireMutation.mutate({ id, notes });
  };

  const renderGate = (gate: SeoRolloutGate) => {
    const open = gate.open;

    return (
      <div
        key={gate.gate}
        className={`rounded-xl border p-4 ${open ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          )}
          <p className={`text-sm font-medium ${open ? 'text-green-900' : 'text-amber-900'}`}>
            {GATE_LABELS[gate.gate] || gate.gate}
          </p>
        </div>
        {gate.reasons.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            {gate.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-green-800">All conditions for this gate are met.</p>
        )}
      </div>
    );
  };

  if (cohortsQuery.isLoading || gatesQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const cohorts = cohortsQuery.data || [];
  const gates = gatesQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tier A cohort and rollout gates</h1>
        <p className="mt-1 text-sm text-gray-500">
          The cohort is the only set the AI may draft for. The gates decide whether the agent may
          apply changes without a human approving each one.
        </p>
      </div>

      {gates && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Rollout gates</h2>
          </div>

          {gates.must_halt && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Stop condition active</p>
                <p className="mt-1 text-xs">
                  Automatic writes are refused until the condition clears. Human-approved proposals
                  still apply.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {Object.values(gates.gates).map(renderGate)}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Cohorts</h2>
          <span className="text-xs text-gray-500">Draft cohorts are not used for drafting until approved.</span>
        </div>

        {cohorts.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No cohort has been built. Run <code className="rounded bg-gray-100 px-1">php artisan seo:build-cohort</code> to
            create one from the opportunity report.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Members</th>
                  <th className="px-3 py-2 font-medium">Window</th>
                  <th className="px-3 py-2 font-medium">Approved</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cohorts.map((cohort) => (
                  <tr key={cohort.id}>
                    <td className="px-3 py-2 text-gray-800">{cohort.name}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        {cohort.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{cohort.members_count}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {cohort.window_from || '—'} → {cohort.window_to || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{cohort.approved_at || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        {cohort.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => approve(cohort.id)}
                            disabled={approveMutation.isPending}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {cohort.status !== 'retired' && (
                          <button
                            type="button"
                            onClick={() => retire(cohort.id)}
                            disabled={retireMutation.isPending}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Retire
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Organic search</h2>
            <p className="mt-1 text-xs text-gray-500">
              Non-brand only, so branded searches do not flatter the trend. Unavailable metrics say
              why instead of showing a zero.
            </p>
          </div>
          {weeklyQuery.data && (
            <span className="text-xs text-gray-500">
              {weeklyQuery.data.from} → {weeklyQuery.data.to}
            </span>
          )}
        </div>

        {weeklyQuery.isLoading ? (
          <div className="mt-4 flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : !weeklyQuery.data ? (
          <p className="mt-3 text-sm text-gray-600">Could not load the organic search report.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Object.entries(weeklyQuery.data.metrics).map(([key, metric]) => (
              <div key={key} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {metric.label || key.replaceAll('_', ' ')}
                </p>

                {metric.available ? (
                  <>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {metric.value === null ? '—' : metric.value.toLocaleString()}
                    </p>
                    {metric.change_pct !== null && metric.change_pct !== undefined ? (
                      <p
                        className={`mt-1 text-xs ${
                          metric.change_pct > 0
                            ? 'text-green-700'
                            : metric.change_pct < 0
                              ? 'text-red-700'
                              : 'text-gray-600'
                        }`}
                      >
                        {metric.change_pct > 0 ? '+' : ''}
                        {metric.change_pct}% vs previous
                        {metric.improvement_direction === 'lower_is_better' && (
                          <span className="ml-1 text-gray-500">(lower is better)</span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">No comparison data</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">{metric.reason || 'Unavailable'}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {weeklyQuery.data?.data_quality.note && (
          <p className="mt-3 text-xs text-amber-700">{weeklyQuery.data.data_quality.note}</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Measured performance</h2>
            <p className="mt-1 text-xs text-gray-500">
              Difference-in-differences: the treated group's change minus its control group's change
              over the same window.
            </p>
          </div>
          <div className="flex gap-1">
            {([14, 28, 42] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  days === option
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}d
              </button>
            ))}
          </div>
        </div>

        {measurementQuery.isLoading ? (
          <div className="mt-4 flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : (measurementQuery.data?.cohorts.length || 0) === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No change has a complete {days}-day window yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Change</th>
                  <th className="px-3 py-2 font-medium">Page type</th>
                  <th className="px-3 py-2 font-medium">N</th>
                  <th className="px-3 py-2 font-medium">Treated Δ</th>
                  <th className="px-3 py-2 font-medium">Control Δ</th>
                  <th className="px-3 py-2 font-medium">Net</th>
                  <th className="px-3 py-2 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {measurementQuery.data?.cohorts.map((cohort, index) => (
                  <tr key={`${cohort.change_type}-${cohort.page_type}-${index}`}>
                    <td className="px-3 py-2 text-gray-800">{cohort.change_type}</td>
                    <td className="px-3 py-2 text-gray-700">{cohort.page_type}</td>
                    <td className="px-3 py-2 text-gray-700">{cohort.members}</td>
                    <td className="px-3 py-2 text-gray-700">{(cohort.treated.ctr_change * 100).toFixed(3)} pp</td>
                    <td className="px-3 py-2 text-gray-700">{(cohort.control.ctr_change * 100).toFixed(3)} pp</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{(cohort.net_effect * 100).toFixed(3)} pp</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${verdictClass[cohort.verdict]}`}>
                        {cohort.verdict.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {measurementQuery.data?.cohorts[0]?.seasonality_note && (
          <p className="mt-3 text-xs text-gray-500">{measurementQuery.data.cohorts[0].seasonality_note}</p>
        )}
      </div>
    </div>
  );
};

export default Cohorts;
