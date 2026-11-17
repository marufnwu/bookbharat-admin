import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, HelpCircle, RefreshCw, ShieldQuestion, X } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type {
  SeoStrategyReview,
  SeoStrategyReviewReason,
  SeoStrategyReviewSummary,
} from '../../types/seoAgent';

/**
 * The human-review queue for strategy decisions.
 *
 * This page exists because the strategy layer can decline a change, and that
 * decline suppresses a write. Without a place to record whether a person agrees,
 * "the AI is good" is an assumption — the system had no way to tell a sound
 * judgement from a confident wrong one.
 *
 * Three verdicts are shown side by side and they are deliberately separate:
 *
 *   the recommendation   what the model concluded
 *   the baseline         what a rule-based system would have concluded
 *   the AI pre-score     an independent evaluator's opinion
 *
 * Only your verdict counts. An AI agreeing with an AI is not validation, so the
 * summary reports `pending human review` until a person decides, however many
 * pre-scores exist. The baseline is shown because the question that justifies
 * the model's cost is not "is it plausible" but "does it beat code".
 */

const REASONS: Array<{ value: SeoStrategyReviewReason; label: string }> = [
  { value: 'wrong_page_target', label: 'Demand belongs on a different page' },
  { value: 'wrong_intent', label: 'Misread what the searcher wants' },
  { value: 'bad_reasoning', label: 'Conclusion does not follow from the facts' },
  { value: 'ignored_evidence', label: 'Ignored traffic or query data' },
  { value: 'should_have_acted', label: 'Should have acted; value was lost' },
  { value: 'should_have_declined', label: 'Should have declined; cost exceeds gain' },
  { value: 'unsupported_claim', label: 'Claims something the evidence does not show' },
  { value: 'other', label: 'Other (explain in the note)' },
];

const verdictTone: Record<string, string> = {
  agree: 'border-green-200 bg-green-50 text-green-800',
  disagree: 'border-red-200 bg-red-50 text-red-800',
  unsure: 'border-amber-200 bg-amber-50 text-amber-800',
};

const formatPercent = (value: number | null): string =>
  value === null ? '—' : `${Math.round(value * 100)}%`;

const VerdictBadge: React.FC<{ label: string; verdict: string | null }> = ({ label, verdict }) => (
  <div className="flex items-center gap-1.5 text-xs">
    <span className="text-gray-500">{label}</span>
    {verdict ? (
      <span className={`rounded border px-1.5 py-0.5 font-medium ${verdictTone[verdict] || 'border-gray-200 bg-gray-50 text-gray-700'}`}>
        {verdict}
      </span>
    ) : (
      <span className="text-gray-400">not scored</span>
    )}
  </div>
);

const SummaryPanel: React.FC<{ summary: SeoStrategyReviewSummary }> = ({ summary }) => {
  const pending = summary.status === 'pending_human_review';

  return (
    <div className="space-y-3">
      {pending && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Pending human review — not validated.</p>
            <p className="mt-0.5 text-amber-800">
              {summary.sample_size === 0
                ? 'No case has a human verdict yet.'
                : `${summary.sample_size} of ${summary.target} target cases reviewed.`}{' '}
              AI pre-scores below are evidence only; they do not count toward the agreement rate.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Human-reviewed</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.sample_size}
            <span className="text-sm font-normal text-gray-500"> / {summary.target}</span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Agreement</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPercent(summary.agreement_rate)}
          </p>
          {summary.agreement_interval_95 && (
            <p className="mt-1 text-xs text-gray-500">
              95% CI {formatPercent(summary.agreement_interval_95.low)}–
              {formatPercent(summary.agreement_interval_95.high)}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Agree / Disagree</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.agree} / {summary.disagree}
          </p>
          <p className="mt-1 text-xs text-gray-500">{summary.unsure} unsure</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">AI minus baseline</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.arms.ai_minus_mapper === null
              ? '—'
              : `${summary.arms.ai_minus_mapper > 0 ? '+' : ''}${formatPercent(summary.arms.ai_minus_mapper)}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Model {summary.arms.ai_strategy.agree}/{summary.arms.ai_strategy.of} · rule{' '}
            {summary.arms.deterministic_mapper.agree}/{summary.arms.deterministic_mapper.of}
          </p>
        </div>
      </div>

      {summary.by_reason.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Why reviewers disagreed</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {summary.by_reason.map((row) => (
              <li
                key={row.reason}
                className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
              >
                {(row.reason ?? 'other').replace(/_/g, ' ')} ({row.count})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ReviewCard: React.FC<{
  review: SeoStrategyReview;
  onVerdict: (payload: {
    verdict: 'agree' | 'disagree' | 'unsure';
    reason_category?: string;
    note?: string;
  }) => void;
  busy: boolean;
}> = ({ review, onVerdict, busy }) => {
  const [draftVerdict, setDraftVerdict] = useState<'agree' | 'disagree' | 'unsure' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reviewed = review.human_verdict !== null;

  const submit = () => {
    if (!draftVerdict) {
      return;
    }

    // A disagreement without a category is a feeling, not a finding. The
    // backend refuses it too; refusing here avoids a pointless round trip.
    if (draftVerdict === 'disagree' && !reason) {
      setError('Choose a reason before recording a disagreement.');

      return;
    }

    setError(null);
    onVerdict({
      verdict: draftVerdict,
      reason_category: draftVerdict === 'disagree' ? reason : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
          {review.recommendation.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-gray-400">issue #{review.issue_id}</span>
        {reviewed && (
          <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
            reviewed
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <VerdictBadge label="AI pre-score" verdict={review.ai_pre_score} />
        <VerdictBadge label="Rule baseline" verdict={review.mapper_verdict} />
        <VerdictBadge label="Your verdict" verdict={review.human_verdict} />
      </div>

      {review.ai_pre_score_reason && (
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Evaluator:</span> {review.ai_pre_score_reason}
        </p>
      )}

      {review.mapper_verdict && (
        <p className="mt-1 text-xs text-gray-500">
          A rule-based system would have recommended{' '}
          <code>{review.mapper_verdict.replace(/_/g, ' ')}</code>
          {review.mapper_verdict === review.recommendation
            ? ' — the same answer, so this case does not show the model adding value.'
            : ' — a different answer, so this is where the model either adds value or does not.'}
        </p>
      )}

      {reviewed ? (
        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="text-gray-800">
            <span className="font-medium">Verdict:</span> {review.human_verdict}
            {review.human_reason_category && (
              <>
                {' '}
                · <span className="text-gray-600">{review.human_reason_category.replace(/_/g, ' ')}</span>
              </>
            )}
          </p>
          {review.human_note && <p className="mt-1 text-gray-600">{review.human_note}</p>}
          <p className="mt-1 text-xs text-gray-400">
            {review.reviewer} · {review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : ''}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraftVerdict('agree')}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${
                draftVerdict === 'agree'
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Check size={12} /> Agree
            </button>
            <button
              type="button"
              onClick={() => setDraftVerdict('disagree')}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${
                draftVerdict === 'disagree'
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <X size={12} /> Disagree
            </button>
            <button
              type="button"
              onClick={() => setDraftVerdict('unsure')}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${
                draftVerdict === 'unsure'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <HelpCircle size={12} /> Unsure
            </button>
          </div>

          {draftVerdict === 'disagree' && (
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Choose a reason…</option>
              {REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {draftVerdict && (
            <>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note, citing the evidence you relied on"
                rows={2}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="rounded bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? 'Recording…' : 'Record verdict'}
              </button>
            </>
          )}

          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
};

const SeoAgentStrategyReview: React.FC = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'reviewed'>('pending');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['seo-agent-strategy-reviews', status],
    queryFn: () => seoAgentApi.strategyReviews({ status, limit: 200 }),
  });

  const reviews = useMemo(() => data?.reviews ?? [], [data]);
  const summary = data?.summary;

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { verdict: 'agree' | 'disagree' | 'unsure'; reason_category?: string; note?: string };
    }) => seoAgentApi.recordStrategyReview(id, payload),
    onSuccess: () => {
      toast.success('Verdict recorded');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-strategy-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-strategy-assessments'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Could not record the verdict');
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <ShieldQuestion size={22} />
            Strategy review
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Decide whether each strategy recommendation was right. This is the only input that can
            validate the strategist: an AI agreeing with another AI is not evidence, so the summary
            stays <em>pending human review</em> until you record verdicts.
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

      {summary && <SummaryPanel summary={summary} />}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatus('pending')}
          className={`rounded border px-2.5 py-1 text-xs font-medium ${
            status === 'pending'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Awaiting review
        </button>
        <button
          type="button"
          onClick={() => setStatus('reviewed')}
          className={`rounded border px-2.5 py-1 text-xs font-medium ${
            status === 'reviewed'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Reviewed
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            {status === 'pending' ? 'Nothing awaiting review.' : 'No case has been reviewed yet.'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Run <code>php artisan seo:strategy-review</code> to build a stratified sample and
            pre-score it. Reviews appear here once a sample exists.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              busy={mutation.isPending && mutation.variables?.id === review.id}
              onVerdict={(payload) => mutation.mutate({ id: review.id, payload })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoAgentStrategyReview;
