import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  KeyRound,
  Mail,
  Plug,
  Store,
  Save,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { SeoAgentIntegrationUpdate } from '../../types/seoAgent';

const StatusBadge: React.FC<{ configured: boolean; label?: string }> = ({ configured, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
      configured
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-gray-200 bg-gray-50 text-gray-500'
    }`}
  >
    {configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
    {label || (configured ? 'Configured' : 'Not configured')}
  </span>
);

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, title, description, status, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3">
        <div className="mt-0.5 rounded-lg bg-gray-50 p-2 text-gray-500">{icon}</div>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {status}
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-800">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

const Integrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    site_url: '',
    google_search_console_site: '',
    ga4_property_id: '',
    merchant_center_id: '',
    merchant_registration_account_id: '',
    merchant_developer_email: '',
    merchant_gcp_project_id: '',
    google_oauth_client_id: '',
    alert_email: '',
  });
  const [pagespeedKey, setPagespeedKey] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [oauthSecret, setOauthSecret] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [clearPagespeed, setClearPagespeed] = useState(false);
  const [clearSlack, setClearSlack] = useState(false);
  const [clearOauthSecret, setClearOauthSecret] = useState(false);
  const [clearServiceAccount, setClearServiceAccount] = useState(false);

  const integrationsQuery = useQuery({
    queryKey: ['seo-agent-integrations'],
    queryFn: seoAgentApi.integrations,
  });

  useEffect(() => {
    if (integrationsQuery.data) {
      setForm(integrationsQuery.data.values);
    }
  }, [integrationsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: SeoAgentIntegrationUpdate = { ...form };
      if (pagespeedKey.trim()) payload.pagespeed_api_key = pagespeedKey.trim();
      if (slackWebhook.trim()) payload.alert_slack_webhook = slackWebhook.trim();
      if (oauthSecret.trim()) payload.google_oauth_client_secret = oauthSecret.trim();
      if (serviceAccountJson.trim()) payload.google_service_account_json = serviceAccountJson.trim();
      if (clearPagespeed) payload.clear_pagespeed_api_key = true;
      if (clearSlack) payload.clear_alert_slack_webhook = true;
      if (clearOauthSecret) payload.clear_google_oauth_client_secret = true;
      if (clearServiceAccount) payload.clear_google_service_account = true;

      return seoAgentApi.updateIntegrations(payload);
    },
    onSuccess: (data) => {
      toast.success('Integrations saved');
      queryClient.setQueryData(['seo-agent-integrations'], data);
      queryClient.invalidateQueries({ queryKey: ['seo-agent-dashboard'] });
      setPagespeedKey('');
      setSlackWebhook('');
      setOauthSecret('');
      setServiceAccountJson('');
      setClearPagespeed(false);
      setClearSlack(false);
      setClearOauthSecret(false);
      setClearServiceAccount(false);
    },
    onError: (error: any) => {
      const errors = error?.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0] : null;
      toast.error(
        (Array.isArray(firstError) ? firstError[0] : firstError) ||
          error?.response?.data?.message ||
          'Could not save integrations'
      );
    },
  });

  const testMutation = useMutation({
    mutationFn: (service: 'search-console' | 'ga4' | 'pagespeed' | 'merchant-center') =>
      seoAgentApi.testIntegration(service),
    onSuccess: (data, service) => {
      if (service === 'pagespeed') {
        const score = (data.result?.performanceScore as number | undefined) ?? null;
        toast.success(score !== null ? `PageSpeed OK (${score}/100)` : 'PageSpeed connection OK');
      } else if (service === 'merchant-center') {
        const result = data.result as { product_issues?: number } | undefined;
        toast.success(`Merchant Center OK (${result?.product_issues ?? 0} product issues)`);
      } else {
        toast.success(`${service === 'ga4' ? 'GA4' : 'Search Console'} connection OK`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Connection test failed');
    },
  });

  const googleAuthorizeMutation = useMutation({
    mutationFn: seoAgentApi.googleAuthorize,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          'Save the OAuth client ID, secret, Merchant Center ID, and developer email first.'
      );
    },
  });

  if (integrationsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (integrationsQuery.isError || !integrationsQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5" />
          Could not load integrations.
        </div>
      </div>
    );
  }

  const data = integrationsQuery.data;

  const handleServiceAccountFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setServiceAccountJson(String(reader.result || ''));
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Search Console, GA4, PageSpeed, Google credentials, and alert destinations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save integrations'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Search Console</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.search_console} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">GA4</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.ga4} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Merchant Center</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.merchant_center} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">PageSpeed</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.pagespeed} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Service account</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.service_account} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Slack</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.slack} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
          <div className="mt-2">
            <StatusBadge configured={data.configured.email} />
          </div>
        </div>
      </div>

      <Section
        icon={<Search className="h-5 w-5" />}
        title="Site and Search Console"
        description="The public site URL and the exact Search Console property string."
        status={<StatusBadge configured={data.configured.search_console} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Public site URL" hint="Used for sitemap crawling, PageSpeed, and URL resolution.">
            <input
              type="url"
              value={form.site_url}
              onChange={(event) => setForm((prev) => ({ ...prev, site_url: event.target.value }))}
              placeholder="https://bookbharat.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field
            label="Search Console property"
            hint="URL-prefix: https://bookbharat.com/ · Domain: sc-domain:bookbharat.com"
          >
            <input
              type="text"
              value={form.google_search_console_site}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, google_search_console_site: event.target.value }))
              }
              placeholder="https://bookbharat.com/"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
        </div>
        <div>
          <button
            type="button"
            onClick={() => testMutation.mutate('search-console')}
            disabled={testMutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testMutation.isPending && testMutation.variables === 'search-console'
              ? 'Testing…'
              : 'Test Search Console'}
          </button>
        </div>
      </Section>

      <Section
        icon={<BarChart3 className="h-5 w-5" />}
        title="GA4"
        description="The GA4 property used for organic-session reports."
        status={<StatusBadge configured={data.configured.ga4} />}
      >
        <div className="max-w-md">
          <Field label="GA4 property ID" hint="Numeric ID or properties/123456789.">
            <input
              type="text"
              value={form.ga4_property_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ga4_property_id: event.target.value }))
              }
              placeholder="properties/123456789"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
        </div>
        <div>
          <button
            type="button"
            onClick={() => testMutation.mutate('ga4')}
            disabled={testMutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testMutation.isPending && testMutation.variables === 'ga4' ? 'Testing…' : 'Test GA4'}
          </button>
        </div>
      </Section>

      <Section
        icon={<Store className="h-5 w-5" />}
        title="Merchant Center"
        description="Read-only account and product diagnostics through the Content API for Shopping."
        status={<StatusBadge configured={data.configured.merchant_center} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Merchant Center ID" hint="The numeric Merchant Center account ID.">
            <input
              type="text"
              value={form.merchant_center_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, merchant_center_id: event.target.value }))
              }
              placeholder="123456789"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field
            label="Registration account ID"
            hint="The main Merchant Center account where the developer email is Admin. Example: 5815287727."
          >
            <input
              type="text"
              value={form.merchant_registration_account_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, merchant_registration_account_id: event.target.value }))
              }
              placeholder="5815287727"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field label="Developer email" hint="The human Google account used to register the GCP project.">
            <input
              type="email"
              value={form.merchant_developer_email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, merchant_developer_email: event.target.value }))
              }
              placeholder="you@gmail.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field label="GCP project ID" hint="Example: bright-academy-95dc0.">
            <input
              type="text"
              value={form.merchant_gcp_project_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, merchant_gcp_project_id: event.target.value }))
              }
              placeholder="bright-academy-95dc0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field label="OAuth client ID" hint="Create a Web OAuth client in GCP for this project.">
            <input
              type="text"
              value={form.google_oauth_client_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, google_oauth_client_id: event.target.value }))
              }
              placeholder="...apps.googleusercontent.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
        </div>

        <Field
          label="OAuth client secret"
          hint={
            data.masked.google_oauth_client_secret
              ? `Current secret: ${data.masked.google_oauth_client_secret}. Leave blank to keep it.`
              : 'Paste the client secret from the same Web OAuth client.'
          }
        >
          <input
            type="password"
            value={oauthSecret}
            onChange={(event) => setOauthSecret(event.target.value)}
            placeholder={data.masked.google_oauth_client_secret || 'Client secret'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </Field>
        {data.masked.google_oauth_client_secret && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={clearOauthSecret}
              onChange={(event) => setClearOauthSecret(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Clear the stored OAuth client secret
          </label>
        )}

        <Field
          label="Authorized redirect URI"
          hint="Add this exact URI to the OAuth client in Google Cloud."
        >
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              readOnly
              value={data.oauth.redirect_uri}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(data.oauth.redirect_uri);
                toast.success('Redirect URI copied');
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy
            </button>
          </div>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => googleAuthorizeMutation.mutate()}
            disabled={googleAuthorizeMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {googleAuthorizeMutation.isPending ? 'Opening Google…' : 'Connect Google Merchant'}
          </button>
          <button
            type="button"
            onClick={() => testMutation.mutate('merchant-center')}
            disabled={testMutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testMutation.isPending && testMutation.variables === 'merchant-center'
              ? 'Testing…'
              : 'Test Merchant Center'}
          </button>
        </div>

        {data.oauth.status && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              data.oauth.status === 'registered'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <p className="font-medium">
              {data.oauth.status === 'registered' ? 'GCP registered with Merchant Center' : 'Google connection failed'}
            </p>
            {data.oauth.registered_at && (
              <p className="mt-1 text-xs">
                Registered: {new Date(data.oauth.registered_at).toLocaleString()}
              </p>
            )}
            {data.oauth.error && <p className="mt-1 break-words text-xs">{data.oauth.error}</p>}
          </div>
        )}
      </Section>

      <Section
        icon={<Gauge className="h-5 w-5" />}
        title="PageSpeed"
        description="Core Web Vitals and Lighthouse performance."
        status={<StatusBadge configured={data.configured.pagespeed} />}
      >
        <div className="max-w-md space-y-3">
          <Field
            label="PageSpeed API key"
            hint={
              data.masked.pagespeed_api_key
                ? `Current key: ${data.masked.pagespeed_api_key}. Leave blank to keep it.`
                : 'Create a key restricted to the PageSpeed Insights API.'
            }
          >
            <input
              type="password"
              value={pagespeedKey}
              onChange={(event) => setPagespeedKey(event.target.value)}
              placeholder={data.masked.pagespeed_api_key || 'Enter a new key'}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          {data.masked.pagespeed_api_key && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={clearPagespeed}
                onChange={(event) => setClearPagespeed(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Clear the stored PageSpeed key
            </label>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => testMutation.mutate('pagespeed')}
            disabled={testMutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testMutation.isPending && testMutation.variables === 'pagespeed'
              ? 'Testing…'
              : 'Test PageSpeed'}
          </button>
        </div>
      </Section>

      <Section
        icon={<Mail className="h-5 w-5" />}
        title="Alerts"
        description="Where critical and summary alerts will be delivered."
        status={
          <div className="flex gap-2">
            <StatusBadge configured={data.configured.email} label="Email" />
            <StatusBadge configured={data.configured.slack} label="Slack" />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alert email">
            <input
              type="email"
              value={form.alert_email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, alert_email: event.target.value }))
              }
              placeholder="seo@bookbharat.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
          <Field
            label="Slack webhook"
            hint={
              data.masked.alert_slack_webhook
                ? `Current webhook: ${data.masked.alert_slack_webhook}. Leave blank to keep it.`
                : 'Create an incoming webhook in Slack.'
            }
          >
            <input
              type="password"
              value={slackWebhook}
              onChange={(event) => setSlackWebhook(event.target.value)}
              placeholder={data.masked.alert_slack_webhook || 'https://hooks.slack.com/services/...'}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </Field>
        </div>
        {data.masked.alert_slack_webhook && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={clearSlack}
              onChange={(event) => setClearSlack(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Clear the stored Slack webhook
          </label>
        )}
      </Section>

      <Section
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Google service account"
        description="Used for Search Console and GA4. The JSON is encrypted at rest."
        status={
          <div className="flex items-center gap-2">
            <StatusBadge configured={data.configured.service_account} />
            {data.masked.service_account_email && (
              <span className="text-xs text-gray-500">{data.masked.service_account_email}</span>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload JSON key
            <input type="file" accept=".json,application/json" onChange={handleServiceAccountFile} className="hidden" />
          </label>
          <span className="text-xs text-gray-500">or paste the JSON below</span>
        </div>

        <Field
          label="Service account JSON"
          hint={
            data.configured.service_account
              ? 'A key is already stored. Leave blank to keep it, or paste a new key to replace it.'
              : 'Paste the full JSON key from Google Cloud.'
          }
        >
          <textarea
            value={serviceAccountJson}
            onChange={(event) => setServiceAccountJson(event.target.value)}
            rows={6}
            placeholder='{"type":"service_account","client_email":"...","private_key":"..."}'
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-primary-500 focus:outline-none"
          />
        </Field>

        {data.configured.service_account && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={clearServiceAccount}
              onChange={(event) => setClearServiceAccount(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Clear the stored service account key
          </label>
        )}
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save integrations'}
        </button>
      </div>
    </div>
  );
};

export default Integrations;
