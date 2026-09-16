import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';
import {
  Truck,
  Settings,
  ToggleLeft,
  ToggleRight,
  Globe,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Star,
  TrendingUp,
  RefreshCw,
  TestTube,
  Info,
  Activity,
  Zap,
  MapPin,
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
  Download,
  Copy,
  Search,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierConfig {
  id: number | null; // null when carrier is in config but has no DB row yet
  code: string;
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
  const [expandedCarrier, setExpandedCarrier] = useState<number | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<CarrierConfig | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [validatingCredentials, setValidatingCredentials] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const [confirmState, setConfirmState] = useState<
    { title: string; message: string; confirmLabel?: string; danger?: boolean; action: () => void } | null
  >(null);

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

  // Delete carrier (DB row only — the carrier stays in config)
  const deleteCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.delete(`/shipping/multi-carrier/carriers/${carrierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier deleted successfully');
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

  const filteredCarriers = useMemo(() => {
    if (!carriers) return [];
    const q = searchQuery.trim().toLowerCase();
    return carriers.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false;
      if (statusFilter === 'inactive' && c.is_active) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        (c.display_name || c.name).toLowerCase().includes(q)
      );
    });
  }, [carriers, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const list = carriers ?? [];
    return {
      total: list.length,
      active: list.filter((c) => c.is_active).length,
      primary: list.filter((c) => c.is_primary).length,
      testMode: list.filter((c) => c.api_mode === 'test').length,
    };
  }, [carriers]);

  // --- Handlers -------------------------------------------------------------

  const handleToggleCarrier = (carrier: CarrierConfig) => {
    if (carrier.id == null) return;
    setConfirmState({
      title: carrier.is_active ? 'Disable Carrier' : 'Enable Carrier',
      message: `${carrier.is_active ? 'Disable' : 'Enable'} ${carrier.display_name || carrier.code}? ${
        carrier.is_active ? 'It will stop being offered at checkout and for shipments.' : 'It will become available again.'
      }`,
      confirmLabel: carrier.is_active ? 'Disable' : 'Enable',
      action: () => toggleCarrierMutation.mutate(carrier.id!),
    });
  };

  const handleDeleteCarrier = (carrier: CarrierConfig) => {
    if (carrier.id == null) return;
    setConfirmState({
      title: 'Delete Carrier Row',
      message: `Delete ${carrier.display_name || carrier.code} from the database? The carrier remains available from config, but admin overrides (credentials, toggles) will be removed.`,
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
          {stats.total} carriers · <span className="text-green-600 font-medium">{stats.active} active</span> ·{' '}
          {stats.primary} primary · {stats.testMode} test
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

      {/* Carriers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCarriers.map((carrier) => {
          const carrierId = carrier.id;
          const isToggling = toggleCarrierMutation.isPending && toggleCarrierMutation.variables === carrierId;
          const isTesting = testCarrierMutation.isPending && testCarrierMutation.variables === carrierId;
          const testResult = carrierId != null ? testResults[carrierId] : undefined;

          return (
            <div key={carrier.code} className={`bg-white rounded-lg shadow-sm border ${carrier.is_primary ? 'border-blue-400' : 'border-gray-200'}`}>
              <div className="p-6">
                {/* Carrier Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    {/* Logo */}
                    {carrier.logo_url ? (
                      <img
                        src={`https://images.weserv.nl/?url=${encodeURIComponent(carrier.logo_url)}&w=96&h=96&fit=contain`}
                        alt={carrier.name}
                        className="h-12 w-12 object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('images.weserv.nl') && carrier.logo_url) {
                            target.src = carrier.logo_url;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                        <Truck className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    {/* Carrier Info */}
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {carrier.display_name || carrier.name}
                        </h3>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {carrier.code}
                        </span>
                        {carrier.is_primary && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Primary</span>
                        )}
                      </div>

                      {/* API mode + priority only — keep the card clean */}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span
                          className={`inline-flex items-center text-xs px-2 py-0.5 rounded font-medium ${
                            carrier.api_mode === 'live'
                              ? 'text-green-700 bg-green-100'
                              : 'text-yellow-700 bg-yellow-100'
                          }`}
                        >
                          {carrier.api_mode === 'live' ? <Globe className="h-3 w-3 mr-1" /> : <TestTube className="h-3 w-3 mr-1" />}
                          {carrier.api_mode === 'live' ? 'Live' : 'Test'}
                        </span>
                        {carrier.priority != null && (
                          <PriorityEditor
                            value={carrier.priority}
                            disabled={carrier.id == null || updatePriorityMutation.isPending}
                            onSave={(priority) =>
                              carrier.id != null && updatePriorityMutation.mutate({ carrierId: carrier.id, priority })
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {(() => {
                      if (carrier.id == null) {
                        return (
                          <button
                            onClick={() => handleInitializeCarrier(carrier.code)}
                            disabled={initializeCarrierMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                            title="Initialize carrier (create DB row)"
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Initialize
                          </button>
                        );
                      }
                      return (
                        <>
                          <button
                            onClick={() => testCarrierMutation.mutate(carrier.id!)}
                            disabled={isTesting}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Test Connection"
                          >
                            <TestTube className={`h-5 w-5 ${isTesting ? 'animate-pulse text-blue-500' : ''}`} />
                          </button>

                          {!carrier.is_primary && carrier.is_active && (
                            <button
                              onClick={() => setPrimaryMutation.mutate(carrier.id!)}
                              disabled={setPrimaryMutation.isPending}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Set as Primary"
                            >
                              <Star className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleCarrier(carrier)}
                            disabled={isToggling}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              carrier.is_active
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                            title={carrier.is_active ? 'Disable Carrier' : 'Enable Carrier'}
                          >
                            {isToggling ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : carrier.is_active ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEditCredentials(carrier)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
                            title="Configure Carrier"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </button>

                          <button
                            onClick={() => handleDeleteCarrier(carrier)}
                            disabled={deleteCarrierMutation.isPending}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete carrier (removes admin overrides; carrier stays in config)"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      );
                    })()}

                    <button
                      onClick={() => setExpandedCarrier(expandedCarrier === carrier.id ? null : carrier.id)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      {expandedCarrier === carrier.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Persistent test result */}
                {testResult && (
                  <div className="mt-4">
                    <TestResultPanel result={testResult} onClose={() => setTestResults((prev) => {
                      const next = { ...prev };
                      delete next[testResult.carrierId];
                      return next;
                    })} />
                  </div>
                )}

                {/* Expanded Details */}
                {expandedCarrier === carrier.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Features */}
                      {carrier.features && carrier.features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {carrier.features.map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                              >
                                {getFeatureIcon(feature)}
                                <span className="ml-1">{feature.replace(/_/g, ' ')}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {(() => {
                        const services = carrier.services || carrier.supported_services;
                        if (!services || Object.keys(services).length === 0) return null;
                        return (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                            <div className="space-y-1">
                              {Object.entries(services).map(([code, name]) => (
                                <div key={code} className="flex items-center text-sm">
                                  <span className="text-gray-500 font-mono text-xs mr-2">{code}:</span>
                                  <span className="text-gray-700">{name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Specifications */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Specifications</h4>
                        <dl className="space-y-1 text-sm">
                          {carrier.max_weight && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Max Weight:</dt>
                              <dd className="text-gray-700">{carrier.max_weight} {carrier.weight_unit || 'kg'}</dd>
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

                      {/* Pickup Days */}
                      {carrier.pickup_days && carrier.pickup_days.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Pickup Days</h4>
                          <div className="flex flex-wrap gap-1">
                            {carrier.pickup_days.map((day) => (
                              <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                                {day.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Configuration */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">API Configuration</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Mode:</dt>
                            <dd className="text-gray-700 capitalize">{carrier.api_mode}</dd>
                          </div>
                          {carrier.webhook_url ? (
                            <div>
                              <dt className="text-gray-500 mb-1">Webhook URL (for carrier dashboard):</dt>
                              <dd className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={carrier.webhook_url}
                                  className="flex-1 text-xs font-mono bg-green-50 border border-green-200 px-2 py-1.5 rounded text-gray-800 truncate"
                                  title={carrier.webhook_url}
                                />
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(carrier.webhook_url!, 'Webhook URL')}
                                  className="flex-shrink-0 p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                                  title="Copy webhook URL"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dd>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Webhook:</dt>
                              <dd className="text-gray-400 text-xs italic">Not configured</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCarriers.length === 0 && (
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
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update carrier settings, credentials, and operational parameters
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
// Warehouse Management Tab Component
// ---------------------------------------------------------------------------

interface WarehouseManagementTabProps {
  carrier: CarrierConfig;
}

interface WarehouseData {
  id: number;
  name: string;
  code: string;
  contact_person: string;
  phone: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_active: boolean;
  is_default: boolean;
  carrier_mapping?: {
    carrier_warehouse_name: string;
    carrier_warehouse_id?: string;
    is_enabled: boolean;
  };
}

const WarehouseManagementTab: React.FC<WarehouseManagementTabProps> = ({ carrier }) => {
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [registeredAddresses, setRegisteredAddresses] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [warehouseAlias, setWarehouseAlias] = useState('');
  const queryClient = useQueryClient();

  const { data: warehousesData, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses');
      const payload = response.data?.data ?? response.data;
      // The endpoint may return an array, a paginated envelope
      // ({ data: [...] }), or an object wrapper — always resolve to an array.
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  const { data: mappingsData } = useQuery({
    queryKey: ['carrier-warehouse-mappings', carrier.id],
    queryFn: async () => {
      const response = await api.get(`/shipping/multi-carrier/carriers/${carrier.id}/warehouses`);
      return response.data?.data || response.data;
    },
  });

  const fetchRegisteredAddresses = async () => {
    if (carrier.code !== 'EKART' && carrier.code !== 'DELHIVERY') {
      toast.error('Address fetching is currently only supported for Ekart and Delhivery');
      return;
    }

    setLoadingAddresses(true);
    try {
      const response = await api.get(`/shipping/multi-carrier/carriers/${carrier.id}/registered-addresses`);
      if (response.data?.success) {
        const addresses = response.data.addresses || response.data.warehouses || [];
        setRegisteredAddresses(addresses);
        if (addresses.length > 0) {
          toast.success(`Found ${addresses.length} registered address(es)`);
        } else {
          toast(response.data.note || response.data.message || 'No addresses found', { icon: 'ℹ️' });
        }
      } else {
        toast.error(response.data?.message || 'Failed to fetch registered addresses');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const updateMappingMutation = useMutation({
    mutationFn: async (data: { warehouse_id: number; alias: string }) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrier.id}/warehouses/${data.warehouse_id}`, {
        carrier_warehouse_name: data.alias,
      });
    },
    onSuccess: () => {
      toast.success('Warehouse mapping updated successfully');
      queryClient.invalidateQueries({ queryKey: ['carrier-warehouse-mappings', carrier.id] });
      setSelectedWarehouse(null);
      setWarehouseAlias('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update mapping');
    },
  });

  React.useEffect(() => {
    setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
  }, [warehousesData]);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Warehouse Configuration</h4>
            <p className="mt-1 text-sm text-blue-700">
              Map your local warehouses to carrier-registered pickup locations. Some carriers like Ekart require pre-registered warehouse names (aliases).
            </p>
          </div>
        </div>
      </div>

      {/* Fetch Registered Addresses (Ekart & Delhivery) */}
      {(carrier.code === 'EKART' || carrier.code === 'DELHIVERY') && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">Registered Addresses in {carrier.name}</h3>
            </div>
            <button
              type="button"
              onClick={fetchRegisteredAddresses}
              disabled={loadingAddresses}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            >
              {loadingAddresses ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Fetch from {carrier.name}
                </>
              )}
            </button>
          </div>

          {registeredAddresses.length > 0 && (
            <div className="space-y-2">
              {registeredAddresses.map((addr, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {carrier.code === 'EKART' ? (
                        <>
                          <p className="font-medium text-gray-900">Alias: {addr.alias}</p>
                          <p className="text-gray-600 mt-1">{addr.address_line1}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {addr.city}, {addr.state} - {addr.pincode} | Phone: {addr.phone}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{addr.name}</p>
                            {addr.note && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">{addr.note}</span>
                            )}
                          </div>
                          {addr.client_name && <p className="text-gray-600 mt-1 text-xs">Client: {addr.client_name}</p>}
                          {addr.phone && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              Phone: {addr.phone} {addr.email && `| Email: ${addr.email}`}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {registeredAddresses.length === 0 && loadingAddresses === false && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">No registered addresses found. Click "Fetch" to check.</p>
              {carrier.code === 'DELHIVERY' && (
                <a
                  href="https://one.delhivery.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  View warehouses in Delhivery Portal →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warehouse Mappings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Warehouse Mappings</h3>
        </div>

        {warehousesLoading ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Loading warehouses...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No warehouses configured</p>
            <p className="text-xs mt-1">Create a warehouse first to map it to this carrier</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warehouses.map((warehouse) => {
              const mappings = Array.isArray(mappingsData) ? mappingsData : [];
              const mapping = mappings.find((m: any) => m.warehouse_id === warehouse.id);
              const isEditing = selectedWarehouse === warehouse.id;

              return (
                <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                        <h4 className="font-medium text-gray-900">{warehouse.name}</h4>
                        {warehouse.is_default && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{warehouse.address_line_1}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {warehouse.city}, {warehouse.state} - {warehouse.pincode}
                      </p>

                      {/* Current Mapping */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {mapping ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Carrier Warehouse Name:</p>
                              <p className="text-sm font-medium text-gray-900">
                                {mapping.carrier_warehouse_name || 'Not set'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWarehouse(warehouse.id);
                                setWarehouseAlias(mapping.carrier_warehouse_name || '');
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedWarehouse(warehouse.id)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Map to {carrier.name}
                          </button>
                        )}

                        {/* Edit Form */}
                        {isEditing && (
                          <div className="mt-3 space-y-2">
                            <label className="block text-xs font-medium text-gray-700">
                              Carrier Warehouse Name/Alias:
                            </label>
                            <input
                              type="text"
                              value={warehouseAlias}
                              onChange={(e) => setWarehouseAlias(e.target.value)}
                              placeholder="Enter warehouse name as registered with carrier"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500">
                              {carrier.code === 'EKART'
                                ? <>For Ekart, use the exact "alias" from their registered addresses above</>
                                : <>Enter the warehouse name/ID as registered with {carrier.name}</>}
                            </p>
                            <div className="flex space-x-2 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!warehouseAlias.trim()) {
                                    toast.error('Please enter a warehouse name');
                                    return;
                                  }
                                  updateMappingMutation.mutate({
                                    warehouse_id: warehouse.id,
                                    alias: warehouseAlias.trim(),
                                  });
                                }}
                                disabled={updateMappingMutation.isPending}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                              >
                                {updateMappingMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWarehouse(null);
                                  setWarehouseAlias('');
                                }}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Important Notes</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Warehouses must be pre-registered with the carrier before shipment creation</li>
              {carrier.code === 'EKART' && (
                <>
                  <li>Use the "Fetch from Ekart" button to see registered warehouse aliases</li>
                  <li>The warehouse alias must exactly match (case-sensitive)</li>
                  <li>Ekart uses aliases like "Main_Warehouse" to identify pickup locations</li>
                </>
              )}
              {carrier.code === 'DELHIVERY' && (
                <>
                  <li>Delhivery uses warehouse names (not aliases)</li>
                  <li>
                    View all warehouses at:{' '}
                    <a href="https://one.delhivery.com" target="_blank" rel="noopener noreferrer" className="underline">
                      one.delhivery.com
                    </a>
                  </li>
                  <li>The warehouse name must exactly match what's registered with Delhivery</li>
                  <li>Create warehouses via API or email: lastmile-integration@delhivery.com</li>
                </>
              )}
              {carrier.code !== 'EKART' && carrier.code !== 'DELHIVERY' && (
                <>
                  <li>The warehouse name/ID must exactly match what's registered with the carrier</li>
                  <li>Contact carrier support to register new warehouses</li>
                </>
              )}
              <li>Changes take effect immediately for new shipments</li>
            </ul>
          </div>
        </div>
      </div>
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
    return initialData;
  });

  React.useEffect(() => {
    const updatedData: Record<string, any> = {};
    fields.forEach((field) => {
      const carrierData = carrier as any;
      updatedData[field.key] = carrierData[field.key] || '';
    });
    updatedData.test_mode = carrier.api_mode === 'test';
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
        {activeTab === 'warehouse' && <WarehouseManagementTab carrier={carrier} />}
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
      </div>
    </form>
  );
};

export default CarrierConfiguration;