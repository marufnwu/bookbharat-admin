import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  HelpCircle,
  Lightbulb,
  PauseCircle,
  Play,
  Search,
  ShieldCheck,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import type { SeoRolloutGate } from '../../types/seoAgent';

/**
 * Plain-language guide for the people who run the shop.
 *
 * Deliberately free of tiers, statistics and command lines. An operator needs to
 * know four things: what the robot does, whether it can break anything, how to
 * start it, and why it might be doing nothing. Everything else is noise to them,
 * and noise is how a tool goes unused.
 *
 * The live values are read from settings rather than written into the text, so
 * the guide cannot drift into being wrong — a guide that says "budget is $50"
 * after someone changed it to $20 is worse than no guide.
 */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>{children}</div>
);

const Section: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, title, icon, children }) => (
  <section id={id} className="scroll-mt-24">
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span className="text-primary-600">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </Card>
  </section>
);

const Step: React.FC<{
  n: number;
  title: string;
  children: React.ReactNode;
}> = ({ n, title, children }) => (
  <div className="flex gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
      {n}
    </div>
    <div className="pt-0.5">
      <p className="font-medium text-gray-900">{title}</p>
      <div className="mt-1 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const Badge: React.FC<{ good: boolean; goodLabel: string; badLabel: string }> = ({
  good,
  goodLabel,
  badLabel,
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
      good
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-amber-200 bg-amber-50 text-amber-800'
    }`}
  >
    {good ? <CheckCircle2 className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
    {good ? goodLabel : badLabel}
  </span>
);

const CONTENTS = [
  { id: 'what', label: 'What it does' },
  { id: 'safe', label: 'Is it safe?' },
  { id: 'start', label: 'How to start' },
  { id: 'screens', label: 'What each screen is' },
  { id: 'nothing', label: 'Why nothing happened' },
  { id: 'cannot', label: 'What it cannot do' },
  { id: 'first', label: 'Your first week' },
];

const SeoAgentDocs: React.FC = () => {
  const [active, setActive] = useState('what');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['seo-agent-settings'],
    queryFn: seoAgentApi.settings,
    staleTime: 60_000,
  });

  const { data: preflight } = useQuery({
    queryKey: ['seo-agent-preflight'],
    queryFn: seoAgentApi.preflight,
    staleTime: 30_000,
  });

  const { data: gates } = useQuery({
    queryKey: ['seo-agent-gates'],
    queryFn: seoAgentApi.gates,
    staleTime: 60_000,
  });

  const { data: protectedEntities } = useQuery({
    queryKey: ['seo-agent-protected'],
    queryFn: seoAgentApi.protectedEntities,
    staleTime: 60_000,
  });

  const values = useMemo(() => (settings?.values ?? {}) as Record<string, unknown>, [settings]);

  const isOn = (key: string) => values[key] === true || values[key] === '1' || values[key] === 1;
  const num = (key: string, fallback = '0') => {
    const raw = values[key];

    return raw === null || raw === undefined || raw === '' ? fallback : String(raw);
  };

  const agentOn = isOn('enabled');
  const practiceMode = isOn('dry_run');
  const autoFix = isOn('tier_1_enabled');
  const canGoLive = preflight?.ready ?? true;
  const openGates = gates ? (Object.values(gates.gates) as SeoRolloutGate[]) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
          <BookOpen className="h-6 w-6 text-primary-600" />
          SEO Agent — simple guide
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">
          A helper that finds pages that could bring more visitors, suggests improvements, and only
          makes the ones you approve. This page explains it without jargon.
        </p>
      </div>

      {/* Plain status summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Is it working?</p>
          <div className="mt-2">
            <Badge good={agentOn} goodLabel="Yes, running" badLabel="No, switched off" />
          </div>
        </Card>
        <Card className="!p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Will it change my site?</p>
          <div className="mt-2">
            <Badge
              good={!practiceMode}
              goodLabel="Yes, with your approval"
              badLabel="No, just practising"
            />
          </div>
        </Card>
        <Card className="!p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ready for real changes?</p>
          <div className="mt-2">
            <Badge good={canGoLive} goodLabel="Yes" badLabel="Not yet" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              On this page
            </p>
            {CONTENTS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActive(item.id)}
                className={`block rounded px-2 py-1.5 text-sm ${
                  active === item.id
                    ? 'bg-primary-50 font-medium text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-4">
          {/* ------------------------------------------------------- */}
          <Section id="what" title="What it does, in one minute" icon={<Search className="h-5 w-5" />}>
            <p>
              Every day it looks at your book pages and asks one question:{' '}
              <strong>which pages are being seen by Google but not clicked?</strong>
            </p>
            <p>
              When it finds one, it checks what that page is missing — a poor title, a weak
              description, a broken link, or simply a good page that deserves a better first
              impression. Then it either fixes the obvious things itself, or writes a suggestion for
              you to review.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                  <Wrench className="h-4 w-4 text-gray-600" />
                  Things it fixes alone
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Broken things with an obvious repair: a missing title, a dead link, a missing image
                  description. There is no judgement needed, so it does not wait for you.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  Things it suggests
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Changes to a page that already works. Rewriting a title, adding product
                  information, linking pages. These wait for your approval, always.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              It never makes a new page, never deletes anything, and never publishes without your
              approval.
            </p>
          </Section>

          {/* ------------------------------------------------------- */}
          <Section id="safe" title="Is it safe?" icon={<ShieldCheck className="h-5 w-5" />}>
            <p>Yes, and here is exactly why:</p>

            <div className="space-y-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">Nothing happens without your approval</p>
                <p className="mt-1 text-xs text-gray-600">
                  Anything that changes what a customer reads becomes a <strong>suggestion</strong>.
                  It sits on the Proposals page until you say yes. Ignoring it is the same as saying
                  no.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">Practice mode is your safety net</p>
                <p className="mt-1 text-xs text-gray-600">
                  With practice mode on, it writes nothing at all — it only tells you what it would
                  have done. You can leave it like this for weeks and lose nothing.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">Every change can be undone</p>
                <p className="mt-1 text-xs text-gray-600">
                  Anything that does get applied is listed with its old value on the Changes page, and
                  can be put back in one click.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">It has a spending limit</p>
                <p className="mt-1 text-xs text-gray-600">
                  It uses a paid AI service, but it stops when it reaches your monthly limit of{' '}
                  <strong>${num('monthly_budget_usd', '50')}</strong>. It cannot overspend quietly.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">You can protect pages</p>
                <p className="mt-1 text-xs text-gray-600">
                  Pages you never want touched can be marked as protected.
                  {(protectedEntities?.length ?? 0) > 0
                    ? ` ${protectedEntities?.length} page(s) are protected right now.`
                    : ' None are protected yet.'}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">One big red button</p>
                <p className="mt-1 text-xs text-gray-600">
                  The kill switch on the{' '}
                  <Link to="/seo-agent/settings" className="text-primary-600 hover:underline">
                    Settings
                  </Link>{' '}
                  page stops every change immediately, even the automatic ones.
                </p>
              </div>
            </div>
          </Section>

          {/* ------------------------------------------------------- */}
          <Section id="start" title="How to start it" icon={<Play className="h-5 w-5" />}>
            <p>
              All of this happens on the{' '}
              <Link to="/seo-agent" className="text-primary-600 hover:underline">
                Dashboard
              </Link>{' '}
              with two buttons.
            </p>

            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Step n={1} title="Press “Run audit”">
                It looks at your pages and reports what needs attention. This costs no AI money and
                changes nothing.
              </Step>
              <Step n={2} title="Press “Run orchestrator”">
                This is where the AI thinks about what to do. With practice mode on, it only reports.
                With practice mode off, it prepares suggestions for you.
              </Step>
              <Step n={3} title="Review the suggestions">
                Go to{' '}
                <Link to="/seo-agent/proposals" className="text-primary-600 hover:underline">
                  Proposals
                </Link>
                . Each one shows the old text and the new text. Approve the good ones, ignore the
                rest.
              </Step>
            </div>

            <p className="pt-1">
              Once a suggestion is approved, it is applied and appears on{' '}
              <Link to="/seo-agent/changes" className="text-primary-600 hover:underline">
                Changes
              </Link>{' '}
              where you can undo it.
            </p>

            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">
                You do not need to remember to press these buttons. The system also runs on its own
                schedule. The buttons are for when you want a result now.
              </p>
            </div>
          </Section>

          {/* ------------------------------------------------------- */}
          <Section id="screens" title="What each screen is for" icon={<FileText className="h-5 w-5" />}>
            <div className="space-y-2">
              {[
                {
                  name: 'Dashboard',
                  to: '/seo-agent',
                  what: 'The overview. Buttons to run things, and today’s summary.',
                },
                {
                  name: 'Issues',
                  to: '/seo-agent/issues',
                  what: 'Everything the robot found wrong, grouped by the same root cause.',
                },
                {
                  name: 'Strategy',
                  to: '/seo-agent/strategy',
                  what: 'The reasoning behind each decision — why it wanted to change a page, or why it chose to leave it alone.',
                },
                {
                  name: 'Strategy review',
                  to: '/seo-agent/strategy-review',
                  what: 'Say whether you agree with the robot’s judgement. This is how you find out if it is trustworthy.',
                },
                {
                  name: 'Merchant',
                  to: '/seo-agent/merchant',
                  what: 'Problems reported by Google Shopping — image sizes, missing barcodes, policy flags.',
                },
                {
                  name: 'Proposals',
                  to: '/seo-agent/proposals',
                  what: 'The suggestions waiting for your yes or no. This is the screen you will use most.',
                },
                {
                  name: 'Changes',
                  to: '/seo-agent/changes',
                  what: 'What was actually changed, with an undo button on each row.',
                },
                {
                  name: 'Cohorts & gates',
                  to: '/seo-agent/cohorts',
                  what: 'Whether enough evidence has built up to let the robot work with less supervision. Leave it alone until you understand it.',
                },
                {
                  name: 'Settings',
                  to: '/seo-agent/settings',
                  what: 'Every switch, including the on/off, practice mode, spending limit and kill switch.',
                },
              ].map((screen) => (
                <Link
                  key={screen.name}
                  to={screen.to}
                  className="block rounded-lg border border-gray-200 p-3 transition hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <p className="font-medium text-gray-900">{screen.name}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{screen.what}</p>
                </Link>
              ))}
            </div>
          </Section>

          {/* ------------------------------------------------------- */}
          <Section
            id="nothing"
            title="Why did nothing happen?"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            <p>
              This is the most common question, and there are only a few reasons. Check them in this
              order:
            </p>

            <div className="space-y-2">
              {[
                {
                  title: 'It is switched off',
                  body: agentOn
                    ? 'It is currently on, so this is not the reason.'
                    : 'The agent is off right now. Turn it on in Settings.',
                  attention: !agentOn,
                },
                {
                  title: 'Practice mode is on',
                  body: practiceMode
                    ? 'Practice mode is on, so no suggestions are created. That is normal — it only reports what it would do. Turn practice mode off when you are ready for real suggestions.'
                    : 'Practice mode is off, so suggestions should be created.',
                  attention: practiceMode,
                },
                {
                  title: 'I am looking for problems in the shop data',
                  body: canGoLive
                    ? 'Everything checked out, so this is not the reason.'
                    : 'There is a setup problem that stops real changes. The system will tell you exactly what on this page below.',
                  attention: !canGoLive,
                },
                {
                  title: 'It found pages it cannot act on',
                  body: 'Sometimes Google reports on pages that do not exist in your shop database. The robot cannot fix those, because it does not know which product they are. The report will say how many it had to skip.',
                  attention: false,
                },
                {
                  title: 'The monthly spending limit is used up',
                  body: `The limit is $${num('monthly_budget_usd', '50')}. Check spend on the Dashboard.`,
                  attention: false,
                },
                {
                  title: 'It already changed that page recently',
                  body: `Pages are left alone for ${num('cooldown_days', '14')} days after a change, so it does not tinker with the same page over and over.`,
                  attention: false,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`rounded-lg border p-3 ${
                    item.attention ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>

            {!canGoLive && (preflight?.blockers?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-1.5 font-medium text-red-900">
                  <AlertTriangle className="h-4 w-4" />
                  What is blocking real changes right now
                </p>
                <ul className="mt-2 space-y-1 text-xs text-red-800">
                  {preflight?.blockers.map((blocker) => (
                    <li key={blocker}>• {blocker}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-red-700">
                  These need fixing on the website or database side, not in this panel. Until then the
                  robot can only practise.
                </p>
              </div>
            )}

            {openGates.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">How much freedom it has earned</p>
                <ul className="mt-2 space-y-1.5">
                  {openGates.map((gate) => (
                    <li key={gate.gate} className="flex items-start gap-2 text-xs">
                      {gate.open ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      ) : (
                        <PauseCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      )}
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-800">{gate.gate}</span> —{' '}
                        {gate.open ? 'earned' : gate.reasons.join(' ') || 'not yet earned'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  This only matters for unsupervised changes. Nothing here affects your ability to
                  review suggestions by hand.
                </p>
              </div>
            )}
          </Section>

          {/* ------------------------------------------------------- */}
          <Section id="cannot" title="What it cannot do yet" icon={<Eye className="h-5 w-5" />}>
            <p>Being honest about limits is better than finding out the hard way.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>It cannot promise a higher Google ranking.</strong> It can make sensible
                improvements, but whether Google rewards them is only known after measuring for a few
                weeks. Nobody can shortcut that.
              </li>
              <li>
                <strong>It trusts your product data.</strong> If a book’s author is wrong in your
                database, it may write a description with that wrong author and think it is fine.
                Fixing bad records is still a human job.
              </li>
              <li>
                <strong>It cannot tell if Bengali reads naturally.</strong> It checks length and
                obvious problems, not whether the sentence sounds right to a native reader.
              </li>
              <li>
                <strong>It only looks at pages it can match to a product.</strong> If Google knows
                about a page your database does not, that page cannot be improved yet.
              </li>
            </ul>
          </Section>

          {/* ------------------------------------------------------- */}
          <Section
            id="first"
            title="Your first week, step by step"
            icon={<Clock3 className="h-5 w-5" />}
          >
            <div className="space-y-3">
              <Step n={1} title="Day 1 — Look, do not touch">
                Leave the agent off. Press <strong>Run audit</strong> and read what it reports. This
                is free.
              </Step>
              <Step n={2} title="Day 2 — Let it practise">
                Switch the agent on, keep practice mode on. Press <strong>Run orchestrator</strong> and
                read the Strategy page. You will see what it <em>wanted</em> to do and why.
              </Step>
              <Step n={3} title="Day 3 — Judge its thinking">
                Open{' '}
                <Link to="/seo-agent/strategy-review" className="text-primary-600 hover:underline">
                  Strategy review
                </Link>{' '}
                and mark a few of its decisions as agree or disagree. If you disagree often, do not
                let it act yet.
              </Step>
              <Step n={4} title="Day 4 — Turn practice mode off">
                Now it prepares real suggestions. Nothing changes on your site yet — everything waits
                on the Proposals page.
              </Step>
              <Step n={5} title="Day 5 — Approve a few">
                Say yes to two or three suggestions you agree with. Check the Changes page afterwards.
              </Step>
              <Step n={6} title="Two weeks later — Judge the result">
                Compare before and after. If clicks went up, keep going. If not, stop and tell us —
                that is useful information, not a failure.
              </Step>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                The one rule to remember
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Nothing reaches your customers until you approve it. If you are ever unsure, leave the
                suggestion unapproved and nothing happens.
              </p>
            </div>

            <p className="pt-1 text-xs text-gray-500">
              Currently: agent {agentOn ? 'on' : 'off'} · {practiceMode ? 'practice mode' : 'real mode'} ·
              automatic fixes {autoFix ? 'on' : 'off'} · monthly limit $
              {num('monthly_budget_usd', '50')} · {num('daily_cap', '100')} changes per day at most.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default SeoAgentDocs;
