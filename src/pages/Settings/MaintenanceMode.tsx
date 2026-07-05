import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  Power,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Clock,
  Shield,
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import maintenanceApi, { MaintenanceSettings } from '../../api/maintenanceApi';
import { toast } from '../../utils/toast';

const defaultSettings: MaintenanceSettings = {
  enabled: false,
  message: 'We are currently performing scheduled maintenance. Please check back soon.',
  allowed_ips: [],
  retry_after: 3600,
  redirect: null,
  storefront_url: '',
  secret: '',
  is_using_app_key: false,
  bypass_url: '',
};

const MaintenanceMode: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaintenanceSettings>(defaultSettings);
  const [ipDraft, setIpDraft] = useState('');
  const [revealSecret, setRevealSecret] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: () => maintenanceApi.getStatus(),
  });

  useEffect(() => {
    if (data?.maintenance_mode) {
      setForm({
        ...defaultSettings,
        ...data.maintenance_mode,
      });
    }
  }, [data]);

  const buildFrontendUrl = (baseUrl: string, secret: string) => {
    if (!baseUrl || !secret) return '';
    const clean = baseUrl.replace(/\/$/, '');
    return `${clean}/?bypass_token=${encodeURIComponent(secret)}`;
  };

  const buildBackendUrl = (secret: string) =>
    secret ? `${window.location.origin}/${secret}` : '';

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      maintenanceApi.toggle({
        enabled,
        message: form.message,
        allowed_ips: form.allowed_ips,
        retry_after: form.retry_after,
        redirect: form.redirect || undefined,
        storefront_url: form.storefront_url || undefined,
      }),
    onSuccess: (res, enabled) => {
      toast.success(enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
      setForm(prev => ({
        ...prev,
        enabled,
        secret: res.secret ?? prev.secret,
        is_using_app_key: !res.secret,
        bypass_url: buildBackendUrl(res.secret ?? prev.secret),
      }));
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to toggle maintenance mode');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      maintenanceApi.toggle({
        enabled: form.enabled,
        regenerate_secret: true,
        message: form.message,
        allowed_ips: form.allowed_ips,
        retry_after: form.retry_after,
        redirect: form.redirect || undefined,
        storefront_url: form.storefront_url || undefined,
      }),
    onSuccess: (res) => {
      toast.success('Bypass token regenerated. Previous tokens are now invalid.');
      setForm(prev => ({
        ...prev,
        secret: res.secret,
        is_using_app_key: false,
        bypass_url: buildBackendUrl(res.secret),
      }));
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to regenerate token');
    },
  });

  const handleToggle = (nextEnabled: boolean) => {
    toggleMutation.mutate(nextEnabled);
  };

  const handleCopy = async (text: string, label = 'Value') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Failed to copy. Select and copy manually.');
    }
  };

  const handleRegenerate = () => {
    if (
      window.confirm(
        'Regenerate the bypass token? Any previously issued tokens will stop working.',
      )
    ) {
      regenerateMutation.mutate();
    }
  };

  const addIp = () => {
    const value = ipDraft.trim();
    if (!value) return;
    if (form.allowed_ips.includes(value)) {
      toast.error('IP already in list');
      return;
    }
    setForm(prev => ({ ...prev, allowed_ips: [...prev.allowed_ips, value] }));
    setIpDraft('');
  };

  const removeIp = (ip: string) => {
    setForm(prev => ({
      ...prev,
      allowed_ips: prev.allowed_ips.filter(i => i !== ip),
    }));
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isEnabled = form.enabled;
  const maskedSecret = form.secret
    ? `${form.secret.slice(0, 4)}••••••••••••••••${form.secret.slice(-4)}`
    : '';
  const frontendUrl = buildFrontendUrl(form.storefront_url, form.secret);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Mode</h1>
        <p className="text-gray-600">
          Put your storefront into maintenance mode. While enabled, the public site will return a 503
          response with a customisable message.
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`border rounded-lg p-4 flex items-start gap-3 ${
          isEnabled ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}
      >
        {isEnabled ? (
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className={`font-semibold ${isEnabled ? 'text-red-900' : 'text-green-900'}`}>
            Maintenance mode is currently {isEnabled ? 'ON' : 'OFF'}
          </h3>
          <p className={`text-sm ${isEnabled ? 'text-red-800' : 'text-green-800'}`}>
            {isEnabled
              ? 'The public storefront is showing the maintenance page to visitors.'
              : 'The public storefront is operating normally.'}
          </p>
        </div>
        <button
          onClick={() => handleToggle(!isEnabled)}
          disabled={toggleMutation.isPending}
          className={`px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-50 ${
            isEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <Power className="h-4 w-4" />
          {toggleMutation.isPending
            ? 'Working...'
            : isEnabled
            ? 'Disable Maintenance'
            : 'Enable Maintenance'}
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Configuration
        </h2>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visitor message
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown to visitors when maintenance mode is enabled.
          </p>
        </div>

        {/* Retry-After */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="h-4 w-4" /> Retry-After (seconds)
          </label>
          <input
            type="number"
            min={1}
            value={form.retry_after}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                retry_after: Math.max(1, parseInt(e.target.value || '0', 10)),
              }))
            }
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Redirect URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Globe className="h-4 w-4" /> Redirect URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://status.bookbharat.com"
            value={form.redirect ?? ''}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                redirect: e.target.value.trim() || null,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Storefront URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Globe className="h-4 w-4" /> Storefront URL
          </label>
          <input
            type="url"
            placeholder="https://bookbharat.com"
            value={form.storefront_url}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                storefront_url: e.target.value.trim(),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used to build the shareable bypass link for the Next.js storefront.
          </p>
        </div>

        {/* Allowed IPs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Shield className="h-4 w-4" /> Allowed IPs
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Visitors from these IPs can still browse the site during maintenance (e.g. your office).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="192.168.1.1"
              value={ipDraft}
              onChange={(e) => setIpDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addIp();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addIp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {form.allowed_ips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.allowed_ips.map(ip => (
                <span
                  key={ip}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border rounded-full text-sm"
                >
                  {ip}
                  <button
                    type="button"
                    onClick={() => removeIp(ip)}
                    className="text-gray-500 hover:text-red-600"
                    aria-label={`Remove ${ip}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Apply changes button */}
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Saving applies the new message and exemptions. Toggling on/off is via the banner above.
          </p>
          <button
            onClick={() => handleToggle(isEnabled)}
            disabled={toggleMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {toggleMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Bypass Token */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Bypass token
        </h2>
        <p className="text-sm text-gray-600">
          Share the storefront link below with trusted team members. When they open it, the token is
          saved in their browser and sent automatically on every API request via the{' '}
          <code className="px-1 py-0.5 bg-gray-100 border rounded text-xs">X-Maintenance-Bypass</code>{' '}
          header.
        </p>

        {form.is_using_app_key && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm rounded-lg p-3">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            No custom secret is set. The site is using your Laravel <code>APP_KEY</code> as the bypass
            token. We strongly recommend regenerating a dedicated token below.
          </div>
        )}

        {/* Frontend bypass URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Storefront bypass link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={frontendUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => handleCopy(frontendUrl, 'Storefront bypass link')}
              disabled={!frontendUrl}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg flex items-center gap-1"
              aria-label="Copy storefront bypass link"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        {/* Same-domain bypass URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Same-domain bypass URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.bypass_url}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => handleCopy(form.bypass_url, 'Same-domain bypass URL')}
              disabled={!form.bypass_url}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg flex items-center gap-1"
              aria-label="Copy same-domain bypass URL"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Only works when the storefront and backend share the same domain. Sets a cookie-based bypass.
          </p>
        </div>

        {/* Secret (masked) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raw token (cross-domain / header)
          </label>
          <div className="flex gap-2">
            <input
              type={revealSecret ? 'text' : 'password'}
              value={revealSecret ? form.secret : maskedSecret}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setRevealSecret(v => !v)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-1"
              aria-label={revealSecret ? 'Hide token' : 'Reveal token'}
            >
              {revealSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(form.secret, 'Bypass token')}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-1"
              aria-label="Copy bypass token"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerateMutation.isPending}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate Token'}
        </button>
      </div>
    </div>
  );
};

export default MaintenanceMode;
