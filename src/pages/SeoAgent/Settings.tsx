import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Save, Shield, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';

type FormValue = string | number | boolean | null;

const TOGGLES = [
  { key: 'enabled', label: 'Agent enabled', hint: 'Master switch for scheduled and manual runs.' },
  { key: 'dry_run', label: 'Dry-run mode', hint: 'Report only. No product data is written.' },
  { key: 'kill_switch', label: 'Kill switch', hint: 'Block every write immediately.' },
  { key: 'tier_1_enabled', label: 'Automatic fixes', hint: 'Alt text and validated Bengali titles/descriptions.' },
  { key: 'tier_2_enabled', label: 'Measured fixes', hint: 'Stronger rewrites, verified and auto-rolled back.' },
  { key: 'tier_3_enabled', label: 'Create proposals', hint: 'Slug, redirect, canonical, content, and Merchant fixes. Human approval required.' },
];

const NUMBERS = [
  { key: 'daily_cap', label: 'Daily write cap' },
  { key: 'category_cap', label: 'Per-category cap' },
  { key: 'cooldown_days', label: 'Entity cooldown (days)' },
  { key: 'monthly_budget_usd', label: 'Monthly budget (USD)' },
  { key: 'max_steps_per_run', label: 'Max steps per run' },
  { key: 'max_writes_per_run', label: 'Max writes per run' },
];

const TEXT_FIELDS = [
  { key: 'pilot_product_ids', label: 'Pilot product IDs', placeholder: '101,102,103' },
];

/** Keys rendered by the curated groups above. */
const curatedKeys = new Set([
  ...TOGGLES.map((f) => f.key),
  ...NUMBERS.map((f) => f.key),
  ...TEXT_FIELDS.map((f) => f.key),
]);

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [newProtected, setNewProtected] = useState({
    entity_type: 'product',
    entity_id: '',
    reason: '',
  });

  const settingsQuery = useQuery({
    queryKey: ['seo-agent-settings'],
    queryFn: seoAgentApi.settings,
  });

  const protectedQuery = useQuery({
    queryKey: ['seo-agent-protected'],
    queryFn: seoAgentApi.protectedEntities,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data.values);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => seoAgentApi.updateSettings(form),
    onSuccess: () => {
      toast.success('SEO agent settings saved');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-settings'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not save settings');
    },
  });

  const addProtectedMutation = useMutation({
    mutationFn: () =>
      seoAgentApi.addProtectedEntity({
        entity_type: newProtected.entity_type,
        entity_id: Number(newProtected.entity_id),
        reason: newProtected.reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Protected entity added');
      setNewProtected({ entity_type: 'product', entity_id: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-protected'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not add the protected entity');
    },
  });

  const removeProtectedMutation = useMutation({
    mutationFn: (id: number) => seoAgentApi.removeProtectedEntity(id),
    onSuccess: () => {
      toast.success('Protection removed');
      queryClient.invalidateQueries({ queryKey: ['seo-agent-protected'] });
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not remove protection');
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5" />
          Could not load SEO agent settings.
        </div>
      </div>
    );
  }

  const fields = settingsQuery.data.fields;

  const advancedFields = Object.entries(fields)
    .filter(([key, field]) => !curatedKeys.has(key) && field?.is_editable !== false)
    .sort(([, a], [, b]) => (a?.label || '').localeCompare(b?.label || ''));

  const renderAdvanced = () => {
    if (advancedFields.length === 0) {
      return null;
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Advanced settings</h2>
        <p className="mt-1 text-xs text-gray-500">
          Thresholds, windows, and gate limits defined by the backend. Changes take effect on the
          next run.
        </p>

        <div className="mt-4 space-y-4">
          {advancedFields.map(([key, field]) => {
            const isBoolean = field?.type === 'boolean' || field?.input_type === 'switch';
            const isNumber = field?.type === 'number';

            return (
              <label key={key} className="block">
                <span className="text-sm font-medium text-gray-800">{field?.label || key}</span>

                {isBoolean ? (
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, [key]: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-xs text-gray-600">
                      {form[key] ? 'On' : 'Off'}
                    </span>
                  </span>
                ) : (
                  <input
                    type={isNumber ? 'number' : 'text'}
                    step={isNumber ? 'any' : undefined}
                    value={form[key] === null || form[key] === undefined ? '' : String(form[key])}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        [key]: isNumber && event.target.value !== '' ? Number(event.target.value) : event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                )}

                <span className="mt-1 block text-xs text-gray-500">{field?.description || ''}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SEO agent settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kill switch, dry-run, tier limits, caps, and alert destinations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      {Boolean(form.kill_switch) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Kill switch is on</p>
            <p className="mt-1 text-sm">Every write is blocked, including Tier 1.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-900">What the agent can do</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-blue-900">Automatic, low risk</p>
            <ul className="mt-1 space-y-1 text-xs text-blue-800">
              <li>Add missing image alt text.</li>
              <li>Write missing or too-long Bengali titles and descriptions, only after validation.</li>
              <li>Create missing schema fields and refresh the sitemap.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Measured, reversible</p>
            <ul className="mt-1 space-y-1 text-xs text-blue-800">
              <li>Stronger title or description rewrites.</li>
              <li>Compared against a control group at 14 and 28 days.</li>
              <li>Rolled back automatically if impressions fall more than 20%.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Proposal only</p>
            <ul className="mt-1 space-y-1 text-xs text-blue-800">
              <li>Slug, URL, redirect, canonical, and noindex changes.</li>
              <li>Top-100 book content rewrites.</li>
              <li>Merchant title and image fixes.</li>
              <li>Nothing is applied until a human approves.</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 border-t border-blue-200 pt-3">
          <p className="text-sm font-medium text-blue-900">Never changes</p>
          <p className="mt-1 text-xs text-blue-800">
            Price, stock, ISBN, author, and publisher. The agent cannot touch these fields.
          </p>
        </div>
        <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-blue-900">
          <p>
            <span className="font-semibold">Current mode:</span>{' '}
            {form.dry_run
              ? 'Dry-run. The agent will only report what it would do; no product data is written.'
              : 'Live. Allowed tiers can write product data.'}
          </p>
          {!form.enabled && (
            <p className="mt-1">
              The agent is disabled. Scheduled and manual runs will not start.
            </p>
          )}
          {Boolean(form.enabled) && !form.dry_run && !form.tier_1_enabled && (
            <p className="mt-1">
              Live mode is on, but Tier 1 writes are off. The agent can only create proposals.
            </p>
          )}
          {Boolean(form.kill_switch) && (
            <p className="mt-1 font-semibold text-red-700">
              Kill switch is on. Every write is blocked, including Tier 1.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Safety and tiers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOGGLES.map(({ key, label, hint }) => (
            <label key={key} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{label}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Limits and budget</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {NUMBERS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-gray-800">{label}</span>
              <input
                type="number"
                min={0}
                value={form[key] === null || form[key] === undefined ? '' : Number(form[key])}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    [key]: event.target.value === '' ? '' : Number(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-gray-500">{fields[key]?.description || ''}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Pilot scope</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEXT_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-gray-800">{label}</span>
              <input
                type="text"
                value={form[key] === null || form[key] === undefined ? '' : String(form[key])}
                placeholder={placeholder}
                onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-gray-500">{fields[key]?.description || ''}</span>
            </label>
          ))}
        </div>
      </div>

      {/*
        Anything the backend defines but the curated groups above do not name is
        rendered here from the API's own field metadata. Without this, a setting
        added to config/settings/seo_agent.php would exist and take effect while
        being impossible to edit from the admin.
      */}
      {curatedKeys.size > 0 && renderAdvanced()}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="font-semibold text-gray-900">Protected entities</h2>
              <p className="text-xs text-gray-500">Protected products, categories, authors, and pages are always Tier 3.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-gray-100 bg-gray-50 p-4 sm:grid-cols-[150px_140px_1fr_auto]">
          <select
            value={newProtected.entity_type}
            onChange={(event) => setNewProtected((previous) => ({ ...previous, entity_type: event.target.value }))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="product">Product</option>
            <option value="category">Category</option>
            <option value="author">Author</option>
            <option value="page">Page</option>
          </select>
          <input
            type="number"
            min={1}
            value={newProtected.entity_id}
            onChange={(event) => setNewProtected((previous) => ({ ...previous, entity_id: event.target.value }))}
            placeholder="Entity ID"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={newProtected.reason}
            onChange={(event) => setNewProtected((previous) => ({ ...previous, reason: event.target.value }))}
            placeholder="Reason, e.g. top 100 by revenue"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => addProtectedMutation.mutate()}
            disabled={!newProtected.entity_id || addProtectedMutation.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-white text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(protectedQuery.data || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    No protected entities yet.
                  </td>
                </tr>
              )}
              {(protectedQuery.data || []).map((entity) => (
                <tr key={entity.id}>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {entity.entity_type} #{entity.entity_id}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{entity.reason || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{entity.source}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                    {entity.added_at ? new Date(entity.added_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeProtectedMutation.mutate(entity.id)}
                      disabled={removeProtectedMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
