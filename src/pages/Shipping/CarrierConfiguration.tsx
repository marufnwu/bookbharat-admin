import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';
import WarehouseMappingPanel from './WarehouseMappingPanel';
import {
  Truck,
  Settings,
  ToggleLeft,
  ToggleRight,
  Globe,
  Package,
  CheckCircle,
  XCircle,
  Shield,
  Star,
  TrendingUp,
  RefreshCw,
  TestTube,
  Activity,
  Zap,
  CreditCard,
  X,
  Key,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Warehouse,
  PlusCircle,
  Trash2,
  Copy,
  Search,
  MoreVertical,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierConfig {
  id: number | null; // null when carrier is in config but has no DB row yet
  code: string;
  account_key?: string;
  account_label?: string;
  is_default?: boolean;
  inherit_env_credentials?: boolean;
  name: string;
  display_name?: string;
  logo_url?: string;
  api_mode: 'test' | 'live';
  is_active: boolean;
  is_primary: boolean;
  priority?: number;
  features?: string[];
  services?: Record<string, string>;
  supported_services?: Record<string, string>;
  max_weight?: number | string;
  max_insurance_value?: number | string;
  cutoff_time?: string;
  pickup_days?: string[];
  weight_unit?: string;
  dimension_unit?: string;
  rating?: number | string;
  success_rate?: number | string;
  total_shipments?: number;
  webhook_url?: string;
  // Credential fields
  api_endpoint?: string;
  api_key?: string;
  api_secret?: string;
  api_token?: string;
  license_key?: string;
  login_id?: string;
  access_token?: string;
  customer_code?: string;
  username?: string;
  password?: string;
  email?: string;
  account_id?: string;
  client_name?: string;
}

interface CarrierGroup {
  code: string;
  name: string;
  display_name?: string;
  logo_url?: string;
  accounts: CarrierConfig[];
}

interface TestResult {
  carrierId: number;
  carrierName: string;
  success: boolean;
  message: string;
  response_time?: number | null;
  error?: string;
  details?: Record<string, any>;
}

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

type StatusFilter = 'all' | 'active' | 'inactive';

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

/** In-page confirmation dialog replacing window.confirm(). */
const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50" onClick={onCancel}>
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <div className="mt-5 flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/** Small overflow-menu item. */
const MenuItem: React.FC<{
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, danger = false, disabled = false, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
      danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

/** Provider logo with a graceful fallback. */
const CarrierLogo: React.FC<{ name: string; url?: string }> = ({ name, url }) => {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-lg bg-gray-100">
        <Truck className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={`https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=160&h=80&fit=contain`}
      alt={name}
      className="max-h-10 max-w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
};

/** Persistent connection-test result panel. */
const TestResultPanel: React.FC<{ result: TestResult; onClose: () => void }> = ({ result, onClose }) => (
  <div className={`rounded-lg border p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
        )}
        <div className="ml-3">
          <h4 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.carrierName}: {result.message}
          </h4>
          {result.response_time != null && (
            <p className="mt-1 text-xs text-gray-600">Response time: {result.response_time} ms</p>
          )}
          {result.error && <p className="mt-1 text-sm text-red-700">{result.error}</p>}
          {result.details && Object.keys(result.details).length > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {Object.entries(result.details).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</dt>
                  <dd className={v ? 'text-green-700' : 'text-red-600'}>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/** Inline priority editor — saves on Enter or blur when changed. */
const PriorityEditor: React.FC<{
  value: number;
  disabled?: boolean;
  onSave: (priority: number) => void;
}> = ({ value, disabled, onSave }) => {
  const [draft, setDraft] = useState<string>(String(value));
  const [editing, setEditing] = useState(false);

  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== value) {
      onSave(parsed);
    } else {
      setDraft(String(value));
    }
  };

  return (
    <div className="flex items-center" title="Priority affects carrier sort order (higher first)">
      <TrendingUp className="h-4 w-4 mr-1 text-gray-400" />
      <input
        type="number"
        min={0}
        max={9999}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => editing && commit()}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-16 px-2 py-0.5 text-xs border border-gray-200 rounded focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

const getFeatureIcon = (feature: string) => {
  switch (feature.toLowerCase()) {
    case 'tracking': return <Activity className="h-4 w-4" />;
    case 'cod': return <CreditCard className="h-4 w-4" />;
    case 'insurance': return <Shield className="h-4 w-4" />;
    case 'reverse_pickup': return <RefreshCw className="h-4 w-4" />;
    case 'multi_piece': return <Package className="h-4 w-4" />;
    case 'same_day':
    case 'instant': return <Zap className="h-4 w-4" />;
    default: return <CheckCircle className="h-4 w-4" />;
  }
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CarrierConfiguration: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [collapsedProviders, setCollapsedProviders] = useState<Record<string, boolean>>({});
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<CarrierConfig | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [validatingCredentials, setValidatingCredentials] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const [confirmState, setConfirmState] = useState<
    { title: string; message: string; confirmLabel?: string; danger?: boolean; action: () => void } | null
  >(null);

  // Add-account modal state
  const [accountModalCarrier, setAccountModalCarrier] = useState<string | null>(null);
  const [accountLabelDraft, setAccountLabelDraft] = useState('');
  const [accountKeyDraft, setAccountKeyDraft] = useState('');
  const [accountModeDraft, setAccountModeDraft] = useState<'test' | 'live'>('test');
  const [accountActiveDraft, setAccountActiveDraft] = useState(true);

  // Fetch carriers
  const { data: carriers, isLoading, refetch } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await api.get('/shipping/multi-carrier/carriers');
      return response.data.data as CarrierConfig[];
    },
  });

  // Toggle carrier active status
  const toggleCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierId}/toggle`);
    },
    onSuccess: (response, carrierId) => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success(`Carrier ${response.data?.data?.is_active ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle carrier status');
    },
  });

  // Set primary carrier
  const setPrimaryMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrierId}/config`, { is_primary: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Primary carrier set successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set primary carrier');
    },
  });

  // Update priority
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ carrierId, priority }: { carrierId: number; priority: number }) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrierId}/config`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Priority updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update priority');
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });

  // Test carrier connection — result stored for the persistent panel
  const testCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      const response = await api.post(`/shipping/multi-carrier/carriers/${carrierId}/test`);
      return response.data;
    },
    onSuccess: (data, carrierId) => {
      const carrierName = carriers?.find((c) => c.id === carrierId)?.display_name || `Carrier #${carrierId}`;
      setTestResults((prev) => ({
        ...prev,
        [carrierId]: {
          carrierId,
          carrierName,
          success: Boolean(data.success && data.data?.success),
          message: data.success && data.data?.success ? 'Connection test successful' : 'Connection test failed',
          response_time: data.data?.response_time ?? null,
          error: data.data?.error || data.error,
          details: data.data?.details,
        },
      }));
    },
    onError: (error: any, carrierId) => {
      const carrierName = carriers?.find((c) => c.id === carrierId)?.display_name || `Carrier #${carrierId}`;
      setTestResults((prev) => ({
        ...prev,
        [carrierId]: {
          carrierId,
          carrierName,
          success: false,
          message: 'Connection test failed',
          error: error.response?.data?.error || error.response?.data?.message || error.message,
          details: error.response?.data?.details,
        },
      }));
    },
  });

  // Initialize a carrier (create DB row from config)
  const initializeCarrierMutation = useMutation({
    mutationFn: async ({ carrierCode }: { carrierCode: string }) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierCode}/initialize`, {});
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success(`Carrier ${variables.carrierCode} initialized successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize carrier');
    },
  });

  // Set default account for a carrier type
  const setDefaultAccountMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierId}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Default account updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default account');
    },
  });

  // Create an additional account for a carrier type
  const createAccountMutation = useMutation({
    mutationFn: async ({ carrierCode, payload }: { carrierCode: string; payload: any }) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierCode}/accounts`, payload);
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success(`Account added for ${variables.carrierCode}`);
      setAccountModalCarrier(null);
      setAccountLabelDraft('');
      setAccountKeyDraft('');
      setAccountModeDraft('test');
      setAccountActiveDraft(true);

      // Jump straight into configuration so the new account does not sit
      // around with empty credentials.
      const created = response.data?.data;
      if (created) {
        setEditingCarrier(created as CarrierConfig);
        setValidationResult(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add carrier account');
    },
  });

  // Delete carrier (DB row only — the carrier stays in config)
  const deleteCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.delete(`/shipping/multi-carrier/carriers/${carrierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier account deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete carrier');
    },
  });

  // Update carrier credentials
  const updateCredentialsMutation = useMutation({
    mutationFn: async ({ carrierId, credentials }: { carrierId: number; credentials: any }) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrierId}/config`, credentials);
    },
    onSuccess: (response, variables) => {
      const updatedCarrier = response.data?.data;
      if (updatedCarrier) {
        queryClient.setQueryData(['carriers'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((carrier: any) =>
            carrier.id === variables.carrierId ? { ...carrier, ...updatedCarrier } : carrier
          );
        });
      }
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier configuration updated successfully');
      setEditingCarrier(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update carrier configuration');
    },
  });

  // Validate carrier credentials
  const validateCredentialsMutation = useMutation({
    mutationFn: async ({ carrierId, credentials }: { carrierId: number; credentials: any }) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierId}/validate-credentials`, credentials);
    },
    onSuccess: (response) => {
      const data = response.data;
      setValidationResult({
        success: Boolean(data.success),
        message: data.success ? 'Credentials validated successfully!' : data.message || 'Credentials validation failed',
        details: data.success ? data.data : data.details,
      });
      if (data.success) {
        toast.success('Credentials validation successful');
      } else {
        toast.error(data.message || 'Credentials validation failed');
      }
    },
    onError: (error: any) => {
      setValidationResult({
        success: false,
        message: 'Validation request failed',
        details: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Credentials validation failed');
    },
  });

  // --- Derived data ---------------------------------------------------------

  const filteredGroups = useMemo(() => {
    const list = carriers ?? [];
    const q = searchQuery.trim().toLowerCase();

    const groups = new Map<string, CarrierGroup>();
    for (const carrier of list) {
      if (statusFilter === 'active' && !carrier.is_active) continue;
      if (statusFilter === 'inactive' && carrier.is_active) continue;

      const key = carrier.code;
      if (!groups.has(key)) {
        groups.set(key, {
          code: carrier.code,
          name: carrier.name,
          display_name: carrier.display_name,
          logo_url: carrier.logo_url,
          accounts: [],
        });
      }
      groups.get(key)!.accounts.push(carrier);
    }

    const result: CarrierGroup[] = [];
    groups.forEach((group) => {
      if (q) {
        const providerMatches =
          group.code.toLowerCase().includes(q) ||
          group.name.toLowerCase().includes(q) ||
          (group.display_name || '').toLowerCase().includes(q);

        if (!providerMatches) {
          const matchedAccounts = group.accounts.filter((a) =>
            (a.account_label || '').toLowerCase().includes(q)
          );
          if (matchedAccounts.length === 0) return;
          group.accounts = matchedAccounts;
        }
      }

      result.push(group);
    });

    return result.sort((a, b) => {
      const aName = a.display_name || a.name || a.code;
      const bName = b.display_name || b.name || b.code;
      return aName.localeCompare(bName);
    });
  }, [carriers, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const list = carriers ?? [];
    return {
      providers: new Set(list.map((c) => c.code)).size,
      totalAccounts: list.length,
      active: list.filter((c) => c.is_active).length,
      testMode: list.filter((c) => c.api_mode === 'test').length,
    };
  }, [carriers]);

  const isProviderOpen = (code: string) => collapsedProviders[code] !== true;

  const toggleProvider = (code: string) => {
    setCollapsedProviders((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // --- Handlers -------------------------------------------------------------

  const handleToggleCarrier = (carrier: CarrierConfig) => {
    if (carrier.id == null) return;
    setConfirmState({
      title: carrier.is_active ? 'Deactivate account' : 'Activate account',
      message: `${carrier.is_active ? 'Deactivate' : 'Activate'} ${carrier.display_name || carrier.code}? ${
        carrier.is_active ? 'This account will stop being used for new shipments and delivery sync.' : 'This account will become available again.'
      }`,
      confirmLabel: carrier.is_active ? 'Deactivate' : 'Activate',
      action: () => toggleCarrierMutation.mutate(carrier.id!),
    });
  };

  const handleDeleteCarrier = (carrier: CarrierConfig) => {
    if (carrier.id == null) return;
    setConfirmState({
      title: 'Delete carrier account',
      message: `Delete ${carrier.display_name || carrier.code}${carrier.account_label ? ` — ${carrier.account_label}` : ''} from the database? The carrier type remains available from config, but this account's credentials and toggles will be removed. Accounts with shipments cannot be deleted; deactivate those instead.`,
      confirmLabel: 'Delete',
      danger: true,
      action: () => deleteCarrierMutation.mutate(carrier.id!),
    });
  };

  const handleInitializeCarrier = (carrierCode: string) => {
    setConfirmState({
      title: 'Initialize Carrier',
      message: `Create a database row for ${carrierCode}? You can then manage its credentials and toggles here.`,
      confirmLabel: 'Initialize',
      action: () => initializeCarrierMutation.mutate({ carrierCode }),
    });
  };

  const handleEditCredentials = (carrier: CarrierConfig) => {
    const currentCarrier = carriers?.find((c: CarrierConfig) => c.id === carrier.id) || carrier;
    setEditingCarrier(currentCarrier);
    setValidationResult(null);
  };

  const openAddAccountModal = (group: CarrierGroup) => {
    const defaultAccount = group.accounts.find((a) => a.is_default) || group.accounts[0];
    setAccountModalCarrier(group.code);
    setAccountLabelDraft('');
    setAccountKeyDraft('');
    setAccountModeDraft(defaultAccount?.api_mode === 'live' ? 'live' : 'test');
    setAccountActiveDraft(true);
  };

  const handleSaveCredentials = (credentials: any) => {
    if (editingCarrier && editingCarrier.id !== null) {
      updateCredentialsMutation.mutate({ carrierId: editingCarrier.id, credentials });
    }
  };

  const handleValidateCredentials = (credentials: any) => {
    if (editingCarrier && editingCarrier.id !== null) {
      setValidatingCredentials(true);
      setValidationResult(null);
      validateCredentialsMutation.mutate(
        { carrierId: editingCarrier.id, credentials },
        { onSettled: () => setValidatingCredentials(false) }
      );
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getCredentialFields = (carrier: CarrierConfig) => {
    const credentialFields = (carrier as any).credential_fields || [];
    if (credentialFields.length > 0) return credentialFields;
    return [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: false },
    ];
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // --- Render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Carrier Configuration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage shipping carrier credentials and toggles. Each carrier registered in the system
            can be initialized into the database and updated from here.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh carriers"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Summary + Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gray-500 whitespace-nowrap">
          {stats.providers} carriers · {stats.totalAccounts} accounts ·{' '}
          <span className="text-green-600 font-medium">{stats.active} active</span> · {stats.testMode} test
        </p>
        <div className="flex flex-1 gap-3 sm:justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search carriers..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex rounded-md border border-gray-300 overflow-hidden h-fit">
            {(['all', 'active', 'inactive'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 text-sm capitalize transition-colors ${
                  statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Carrier groups */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const accounts = group.accounts;
          const defaultAccount = accounts.find((a) => a.is_default) || accounts[0];
          const primaryAccount = accounts.find((a) => a.is_primary);
          const primaryCandidate = defaultAccount?.is_active
            ? defaultAccount
            : accounts.find((a) => a.is_active) || defaultAccount;
          const activeCount = accounts.filter((a) => a.is_active).length;
          const showDefaultBadge = accounts.length > 1;
          const providerExpanded = isProviderOpen(group.code);
          const canAddAccount = accounts.some((a) => a.id != null);

          return (
            <div key={group.code} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Provider header */}
              <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => toggleProvider(group.code)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={providerExpanded ? 'Collapse accounts' : 'Expand accounts'}
                >
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-1">
                    <CarrierLogo name={group.display_name || group.name} url={group.logo_url} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {group.display_name || group.name}
                      </h3>
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500">
                        {group.code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs font-medium text-green-600">{activeCount} active</span>
                      {primaryAccount && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          <Star className="h-3 w-3" /> Primary carrier
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {accounts.length > 1 ? (
                        <>
                          Default account:{' '}
                          <span className="font-medium text-gray-700">
                            {defaultAccount?.account_label || 'Default'}
                          </span>
                        </>
                      ) : (
                        'Single account'
                      )}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {!primaryAccount && primaryCandidate?.id != null && primaryCandidate.is_active && (
                    <button
                      type="button"
                      onClick={() => setPrimaryMutation.mutate(primaryCandidate.id!)}
                      disabled={setPrimaryMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                      title={`Set ${primaryCandidate.account_label || 'default account'} as primary carrier`}
                    >
                      <Star className="h-3.5 w-3.5" /> Set primary
                    </button>
                  )}

                  {canAddAccount ? (
                    <button
                      type="button"
                      onClick={() => openAddAccountModal(group)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      title="Add another account for this carrier"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Add account
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInitializeCarrier(group.code)}
                      disabled={initializeCarrierMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      title="Initialize carrier (create first default account)"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Initialize
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedDetails(expandedDetails === group.code ? null : group.code)}
                    className={`rounded-md p-1.5 transition-colors ${
                      expandedDetails === group.code
                        ? 'bg-gray-100 text-gray-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                    title="View carrier capabilities"
                  >
                    <Package className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleProvider(group.code)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title={providerExpanded ? 'Collapse accounts' : 'Expand accounts'}
                  >
                    {providerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Account rows */}
              {providerExpanded && (
                <div className="divide-y divide-gray-100">
                  {accounts.map((account) => {
                    const accountId = account.id;
                    const isToggling = toggleCarrierMutation.isPending && toggleCarrierMutation.variables === accountId;
                    const testResult = accountId != null ? testResults[accountId] : undefined;
                    const menuOpen = accountId != null && openMenuId === accountId;

                    return (
                      <div
                        key={accountId ?? `${account.code}-${account.account_key ?? 'default'}`}
                        className={account.is_active ? 'bg-white' : 'bg-gray-50/60'}
                      >
                        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-sm font-medium ${account.is_active ? 'text-gray-900' : 'text-gray-600'}`}>
                                {account.account_label || 'Default'}
                              </span>
                              {showDefaultBadge && account.is_default && (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Default
                                </span>
                              )}
                              {account.is_primary && (
                                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                  <Star className="h-3 w-3" /> Primary
                                </span>
                              )}
                              {accountId == null && (
                                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Not initialized
                                </span>
                              )}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                                  account.api_mode === 'live'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {account.api_mode === 'live' ? <Globe className="mr-1 h-3 w-3" /> : <TestTube className="mr-1 h-3 w-3" />}
                                {account.api_mode === 'live' ? 'Live' : 'Test'}
                              </span>
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                                  account.is_active
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {account.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {account.total_shipments != null && account.total_shipments > 0 && (
                                <span className="text-[11px] text-gray-500">
                                  {account.total_shipments} shipments
                                </span>
                              )}
                              {accountId == null && (
                                <span className="text-[11px] text-gray-500">
                                  Create this account to configure credentials.
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end lg:self-auto">
                            {accountId != null && (
                              <div className="hidden sm:block">
                                <PriorityEditor
                                  value={account.priority ?? 100}
                                  disabled={updatePriorityMutation.isPending}
                                  onSave={(priority) => updatePriorityMutation.mutate({ carrierId: accountId, priority })}
                                />
                              </div>
                            )}

                            {accountId == null ? (
                              <button
                                type="button"
                                onClick={() => handleInitializeCarrier(group.code)}
                                disabled={initializeCarrierMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                <PlusCircle className="h-3.5 w-3.5" /> Initialize
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditCredentials(account)}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                  title="Configure account credentials"
                                >
                                  <Settings className="h-3.5 w-3.5" /> Configure
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleCarrier(account)}
                                  disabled={isToggling}
                                  className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
                                    account.is_active
                                      ? 'text-green-600 hover:bg-green-50'
                                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  }`}
                                  title={account.is_active ? 'Deactivate account' : 'Activate account'}
                                >
                                  {isToggling ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : account.is_active ? (
                                    <ToggleRight className="h-4 w-4" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4" />
                                  )}
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(menuOpen ? null : accountId)}
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    title="More account actions"
                                    aria-label="More account actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {menuOpen && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                      <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                        {!account.is_default && (
                                          <MenuItem
                                            onClick={() => {
                                              setOpenMenuId(null);
                                              setDefaultAccountMutation.mutate(accountId);
                                            }}
                                          >
                                            <CheckCircle className="h-4 w-4" /> Set as default account
                                          </MenuItem>
                                        )}
                                        <MenuItem
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            testCarrierMutation.mutate(accountId);
                                          }}
                                        >
                                          <TestTube className="h-4 w-4" /> Test connection
                                        </MenuItem>
                                        <MenuItem
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            openAddAccountModal(group);
                                          }}
                                        >
                                          <PlusCircle className="h-4 w-4" /> Add another account
                                        </MenuItem>
                                        <MenuItem
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleToggleCarrier(account);
                                          }}
                                        >
                                          {account.is_active ? (
                                            <ToggleLeft className="h-4 w-4" />
                                          ) : (
                                            <ToggleRight className="h-4 w-4" />
                                          )}
                                          {account.is_active ? 'Deactivate account' : 'Activate account'}
                                        </MenuItem>
                                        <MenuItem
                                          danger
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleDeleteCarrier(account);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" /> Delete account
                                        </MenuItem>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {testResult && (
                          <div className="px-4 pb-4">
                            <TestResultPanel
                              result={testResult}
                              onClose={() =>
                                setTestResults((prev) => {
                                  const next = { ...prev };
                                  delete next[testResult.carrierId];
                                  return next;
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Carrier capabilities */}
              {expandedDetails === group.code && (() => {
                const carrier = defaultAccount || accounts[0];
                if (!carrier) return null;
                return (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {carrier.features && carrier.features.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-gray-700">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {carrier.features.map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                              >
                                {getFeatureIcon(feature)}
                                <span className="ml-1">{feature.replace(/_/g, ' ')}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const services = carrier.services || carrier.supported_services;
                        if (!services || Object.keys(services).length === 0) return null;
                        return (
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-gray-700">Services</h4>
                            <div className="space-y-1">
                              {Object.entries(services).map(([code, name]) => (
                                <div key={code} className="flex items-center text-sm">
                                  <span className="mr-2 font-mono text-xs text-gray-500">{code}:</span>
                                  <span className="text-gray-700">{name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Specifications</h4>
                        <dl className="space-y-1 text-sm">
                          {carrier.max_weight && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Max Weight:</dt>
                              <dd className="text-gray-700">
                                {carrier.max_weight} {carrier.weight_unit || 'kg'}
                              </dd>
                            </div>
                          )}
                          {carrier.max_insurance_value && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Max Insurance:</dt>
                              <dd className="text-gray-700">₹{Number(carrier.max_insurance_value).toLocaleString()}</dd>
                            </div>
                          )}
                          {carrier.cutoff_time && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Cutoff Time:</dt>
                              <dd className="text-gray-700">{carrier.cutoff_time}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {carrier.pickup_days && carrier.pickup_days.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-gray-700">Pickup Days</h4>
                          <div className="flex flex-wrap gap-1">
                            {carrier.pickup_days.map((day) => (
                              <span key={day} className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">
                                {day.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-700">API Configuration</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Mode:</dt>
                            <dd className="capitalize text-gray-700">{carrier.api_mode}</dd>
                          </div>
                          {carrier.webhook_url ? (
                            <div>
                              <dt className="mb-1 text-gray-500">Webhook URL (for carrier dashboard):</dt>
                              <dd className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={carrier.webhook_url}
                                  className="flex-1 truncate rounded border border-green-200 bg-green-50 px-2 py-1.5 font-mono text-xs text-gray-800"
                                  title={carrier.webhook_url}
                                />
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(carrier.webhook_url!, 'Webhook URL')}
                                  className="flex-shrink-0 rounded bg-blue-100 p-1.5 text-blue-600 transition-colors hover:bg-blue-200"
                                  title="Copy webhook URL"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dd>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Webhook:</dt>
                              <dd className="text-xs italic text-gray-400">Not configured</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery || statusFilter !== 'all' ? 'No carriers match your filters' : 'No carriers configured'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting the search term or status filter.'
              : 'Each carrier registered in the system will appear here. Initialize one to start managing credentials.'}
          </p>
        </div>
      )}

      {/* Add Account Modal */}
      {accountModalCarrier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40" onClick={() => setAccountModalCarrier(null)}>
          <div className="relative top-24 mx-auto p-6 border w-11/12 max-w-lg shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add account</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add a second account for {accountModalCarrier}. Give it a clear label; you will be taken to configure its credentials after creation.
                </p>
              </div>
              <button type="button" onClick={() => setAccountModalCarrier(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account label</label>
                <input
                  type="text"
                  value={accountLabelDraft}
                  onChange={(e) => setAccountLabelDraft(e.target.value)}
                  placeholder="e.g. Shadowfax — Kolkata"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account key (optional)</label>
                <input
                  type="text"
                  value={accountKeyDraft}
                  onChange={(e) => setAccountKeyDraft(e.target.value)}
                  placeholder="auto-generated from the label"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={accountModeDraft === 'live'}
                    onChange={(e) => setAccountModeDraft(e.target.checked ? 'live' : 'test')}
                  />
                  Live mode
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={accountActiveDraft}
                    onChange={(e) => setAccountActiveDraft(e.target.checked)}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAccountModalCarrier(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!accountLabelDraft.trim() || createAccountMutation.isPending}
                onClick={() => createAccountMutation.mutate({
                  carrierCode: accountModalCarrier,
                  payload: {
                    account_label: accountLabelDraft.trim(),
                    account_key: accountKeyDraft.trim() || undefined,
                    api_mode: accountModeDraft,
                    is_active: accountActiveDraft,
                  },
                })}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {createAccountMutation.isPending ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={() => {
            confirmState.action();
            setConfirmState(null);
          }}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Carrier Configuration Modal */}
      {editingCarrier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40" onClick={() => setEditingCarrier(null)}>
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Configure {editingCarrier.display_name || editingCarrier.name}
                  {editingCarrier.account_label ? ` — ${editingCarrier.account_label}` : ''}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update this account's credentials, mode, and operational parameters
                </p>
              </div>
              <button onClick={() => setEditingCarrier(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <EnhancedCarrierConfigForm
              carrier={editingCarrier}
              fields={getCredentialFields(editingCarrier)}
              onSave={handleSaveCredentials}
              onValidate={handleValidateCredentials}
              onCancel={() => setEditingCarrier(null)}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
              isLoading={updateCredentialsMutation.isPending}
              isValidating={validatingCredentials}
              validationResult={validationResult}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Enhanced Carrier Configuration Form with Tabs
// ---------------------------------------------------------------------------

interface EnhancedCarrierConfigFormProps {
  carrier: CarrierConfig;
  fields: Array<{ key: string; label: string; type: string; required: boolean }>;
  onSave: (config: any) => void;
  onValidate: (credentials: any) => void;
  onCancel: () => void;
  showPassword: Record<string, boolean>;
  onTogglePassword: (field: string) => void;
  isLoading: boolean;
  isValidating: boolean;
  validationResult: ValidationResult | null;
}

const EnhancedCarrierConfigForm: React.FC<EnhancedCarrierConfigFormProps> = ({
  carrier,
  fields,
  onSave,
  onValidate,
  onCancel,
  showPassword,
  onTogglePassword,
  isLoading,
  isValidating,
  validationResult,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'warehouse'>('credentials');
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    fields.forEach((field) => {
      const carrierData = carrier as any;
      initialData[field.key] = carrierData[field.key] || '';
    });
    initialData.test_mode = carrier.api_mode === 'test';
    initialData.account_label = carrier.account_label || '';
    initialData.inherit_env_credentials = carrier.inherit_env_credentials ?? false;
    return initialData;
  });

  React.useEffect(() => {
    const updatedData: Record<string, any> = {};
    fields.forEach((field) => {
      const carrierData = carrier as any;
      updatedData[field.key] = carrierData[field.key] || '';
    });
    updatedData.test_mode = carrier.api_mode === 'test';
    updatedData.account_label = carrier.account_label || '';
    updatedData.inherit_env_credentials = carrier.inherit_env_credentials ?? false;
    setFormData(updatedData);
  }, [carrier, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-save when test_mode changes
    if (field === 'test_mode') {
      const updatedFormData = { ...formData, [field]: value };
      setTimeout(() => onSave(updatedFormData), 100);
    }
  };

  const handleValidate = () => {
    const credentialData: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.key !== 'api_endpoint') {
        credentialData[field.key] = formData[field.key] || '';
      }
    });
    onValidate(credentialData);
  };

  const tabs = [
    { id: 'credentials', label: 'Credentials', icon: Key },
    { id: 'warehouse', label: 'Warehouse', icon: Warehouse },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            {/* Account identity */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account label</label>
                <input
                  type="text"
                  value={formData.account_label || ''}
                  onChange={(e) => handleInputChange('account_label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Shadowfax — Kolkata"
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.inherit_env_credentials)}
                  onChange={(e) => handleInputChange('inherit_env_credentials', e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Use server environment credentials
                  <span className="block text-xs text-gray-500">
                    Only the default/legacy account should use this. New accounts should have their own credentials.
                  </span>
                </span>
              </label>
            </div>

            {/* Test Mode Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">API Mode</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Toggle between Test and Live mode. Credentials will auto-load from config.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${!formData.test_mode ? 'text-green-600' : 'text-gray-400'}`}>
                    Live
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('test_mode', !formData.test_mode)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.test_mode ? 'bg-yellow-400' : 'bg-green-500'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.test_mode ? 'translate-x-0' : 'translate-x-5'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${formData.test_mode ? 'text-yellow-600' : 'text-gray-400'}`}>
                    Test
                  </span>
                </div>
              </div>
            </div>

            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'password' ? (
                  <div className="relative">
                    <input
                      type={showPassword[field.key] ? 'text' : 'password'}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                    <button type="button" onClick={() => onTogglePassword(field.key)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showPassword[field.key] ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-4 rounded-md ${validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex">
                  {validationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {validationResult.message}
                    </h3>
                    {validationResult.details && (
                      <div className="mt-2 text-sm text-gray-600">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(validationResult.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Validate Credentials
                </>
              )}
            </button>
          </div>
        )}

        {/* Warehouse Tab */}
        {activeTab === 'warehouse' && <WarehouseMappingPanel carrier={carrier} />}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        {activeTab === 'credentials' && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                Validating...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2 inline" />
                Validate Credentials
              </>
            )}
          </button>
        )}

        {activeTab === 'credentials' && (
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                Saving...
              </>
            ) : (
              <>
                Save Configuration
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default CarrierConfiguration;
