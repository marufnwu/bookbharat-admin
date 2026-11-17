import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, ExternalLink, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import type { SeoStrategyAssessmentRow } from '../../types/seoAgent';

/**
 * What the strategist has concluded, across the catalogue.
 *
 * The model can decline a change, and that decline suppresses a write. A
 * judgement that suppresses an action but surfaces nowhere is unreviewable, so
 * this page exists to make the reasoning inspectable before anyone trusts it.
 *
 * It is deliberately read-only. Acting on a recommendation is a separate,
 * human-driven step through Proposals.
 */

const RECOMMENDATIONS = [
  'rewrite_snippet',
  'improve_page_content',
  'build_hub_page',
  'strengthen_internal_links',
  'fix_technical',
  'no_change',
  'insufficient_evidence',
] as const;

const recommendationTone: Record<string, string> = {
  no_change: 'border-gray-200 bg-gray-50 text-gray-700',
  insufficient_evidence: 'border-gray-200 bg-gray-50 text-gray-600',
  build_hub_page: 'border-purple-200 bg-purple-50 text-purple-800',
  rewrite_snippet: 'border-blue-200 bg-blue-50 text-blue-800',
  improve_page_content: 'border-blue-200 bg-blue-50 text-blue-800',
  strengthen_internal_links: 'border-teal-200 bg-teal-50 text-teal-800',
  fix_technical: 'border-amber-200 bg-amber-50 text-amber-800',
};

const confidenceTone: Record<string, string> = {
  high: 'text-green-700',
  medium: 'text-amber-700',
  low: 'text-gray-500',
};

const AssessmentCard: React.FC<{ row: SeoStrategyAssessmentRow }> = ({ row }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded border px-2 py-0.5 text-xs font-medium ${
          recommendationTone[row.recommendation ?? ''] || 'border-gray-200 bg-gray-50 text-gray-700'
        }`}
      >
        {(row.recommendation ?? 'unknown').replace(/_/g, ' ')}
      </span>
      {row.confidence && (
        <span className={`text-xs font-medium ${confidenceTone[row.confidence] || ''}`}>
          {row.confidence} confidence
        </span>
      )}
      <span className="text-xs text-gray-500">{row.type}</span>
      <span className="text-xs text-gray-400">issue #{row.issue_id}</span>
    </div>

    {row.url && (
      <a
        href={row.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex items-center gap-1 break-all text-xs text-primary-600 hover:underline"
      >
        {row.url}
        <ExternalLink size={11} />
      </a>
    )}

    {row.search_intent && (
      <p className="mt-2 text-sm text-gray-700">
        <span className="font-medium">Intent:</span> {row.search_intent}
      </p>
    )}

    {row.reason && <p className="mt-1 text-sm text-gray-600">{row.reason}</p>}

    {row.better_target && (
      <p className="mt-2 text-xs text-purple-800">
        <span className="font-medium">Should live on:</span>{' '}
        <code className="break-all">{row.better_target}</code>
      </p>
    )}

    {row.content_gaps.length > 0 && (
      <div className="mt-2 text-xs text-gray-600">
        <span className="font-medium">Missing information:</span>
        <ul className="ml-4 list-disc">
          {row.content_gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    )}

    {row.assessed_at && (
      <p className="mt-2 text-[11px] text-gray-400">
        Assessed {new Date(row.assessed_at).toLocaleString()}
      </p>
    )}
  </div>
);

const SeoAgentStrategy: React.FC = () => {
  const [filter, setFilter] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['seo-agent-strategy-assessments', filter],
    queryFn: () => seoAgentApi.strategyAssessments({ recommendation: filter || undefined, limit: 200 }),
  });

  const assessments = useMemo(() => data?.assessments ?? [], [data]);
  const counts = useMemo(() => data?.by_recommendation ?? [], [data]);
  const total = useMemo(() => counts.reduce((sum, row) => sum + row.count, 0), [counts]);

  const declining = useMemo(
    () =>
      counts
        .filter((row) => ['no_change', 'insufficient_evidence', 'build_hub_page'].includes(row.recommendation))
        .reduce((sum, row) => sum + row.count, 0),
    [counts],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <Brain size={22} />
            Strategy assessments
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            What the AI concluded about individual pages, and why. A recommendation of{' '}
            <em>no change</em> or <em>insufficient evidence</em> suppresses the write;{' '}
            <em>build hub page</em> means the demand belongs on a different page and a proposal was
            raised instead. Nothing here is applied automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Assessed</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Declined a change</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{declining}</p>
          <p className="mt-1 text-xs text-gray-500">
            The page was left alone, which is a decision worth checking.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Recommend a change</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{total - declining}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`rounded border px-2.5 py-1 text-xs font-medium ${
            filter === ''
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({total})
        </button>
        {RECOMMENDATIONS.map((recommendation) => {
          const count = counts.find((row) => row.recommendation === recommendation)?.count ?? 0;

          return (
            <button
              key={recommendation}
              type="button"
              onClick={() => setFilter(recommendation)}
              className={`rounded border px-2.5 py-1 text-xs font-medium ${
                filter === recommendation
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {recommendation.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm font-medium text-gray-700">No assessments yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            The strategist runs during an orchestrated pass, once a model provider is configured.
            With no provider, the agent behaves as it did before and no assessment is recorded.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {assessments.map((row) => (
            <AssessmentCard key={row.issue_id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoAgentStrategy;
