import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  CheckCircleIcon as CheckCircle,
} from '@heroicons/react/24/outline';
import { Button, LoadingSpinner, Badge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { settingsApi } from '../../api';

interface PaymentGateway {
  id: number;
  payment_method: string;
  display_name: string;
  description: string;
  is_enabled: boolean;
  is_production_mode: boolean;
  is_default: boolean;
  is_fallback: boolean;
  is_system: boolean;
  configuration: Record<string, any>;
  credential_schema?: {
    fields: Record<string, {
      type?: string;
      label?: string;
      placeholder?: string;
      description?: string;
      options?: Array<{ value: string; label: string } | string>;
      min?: number;
      max?: number;
      step?: number;
      value?: string;
      is_masked?: boolean;
    }>;
    required: string[];
    optional: string[];
  };
  restrictions: Record<string, any>;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface PaymentSettingsData {
  payment_methods: PaymentGateway[];
  stats: {
    total_methods: number;
    enabled_methods: number;
    system_methods: number;
  };
}

const PaymentSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gateways' | 'flow' | 'cod'>('gateways');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [paymentFlowType, setPaymentFlowType] = useState<string>('two_tier');
  const [defaultPaymentType, setDefaultPaymentType] = useState<string>('none');
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState<boolean>(true);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Fetch payment settings from API
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ['settings', 'payment'],
    queryFn: settingsApi.getPayment,
  });

  // Fetch payment flow settings from API
  const { data: flowSettingsData, isLoading: flowSettingsLoading } = useQuery({
    queryKey: ['settings', 'payment-flow'],
    queryFn: settingsApi.getPaymentFlowSettings,
  });

  // Update local state when flow settings are loaded
  React.useEffect(() => {
    if (flowSettingsData?.data) {
      setPaymentFlowType(flowSettingsData.data.flow_type || 'two_tier');
      setDefaultPaymentType(flowSettingsData.data.default_type || 'none');
      setCodEnabled(flowSettingsData.data.cod_enabled !== false);
      setOnlinePaymentEnabled(flowSettingsData.data.online_payment_enabled !== false);
    }
  }, [flowSettingsData]);

  const togglePaymentGatewayMutation = useMutation({
    mutationFn: (gateway: PaymentGateway) => settingsApi.togglePaymentGateway(gateway.id),
    onSuccess: (data) => {
      showSuccess(data.message || 'Gateway status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
    },
    onError: (error: any) => {
      showError('Failed to toggle payment gateway', error.message);
    },
  });

  const updatePaymentGatewayMutation = useMutation({
    mutationFn: ({ gateway, updates }: { gateway: PaymentGateway; updates: any }) =>
      settingsApi.updatePaymentGateway(gateway.id, updates),
    onSuccess: (data) => {
      showSuccess('Gateway settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
      setEditingGateway(null);
    },
    onError: (error: any) => {
      showError('Failed to update gateway settings', error.message);
    },
  });

  const updatePaymentFlowMutation = useMutation({
    mutationFn: (settings: {
      flow_type?: string;
      default_type?: string;
      cod_enabled?: string;
      online_payment_enabled?: string;
    }) =>
      settingsApi.updatePaymentFlowSettings(settings),
    onSuccess: (data) => {
      showSuccess('Payment flow settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment-flow'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
    },
    onError: (error: any) => {
      showError('Failed to update payment flow settings', error.message);
    },
  });

  const handleFlowTypeChange = (newFlowType: string) => {
    setPaymentFlowType(newFlowType);
    updatePaymentFlowMutation.mutate({ flow_type: newFlowType });
  };

  const handleDefaultTypeChange = (newDefaultType: string) => {
    setDefaultPaymentType(newDefaultType);
    updatePaymentFlowMutation.mutate({ default_type: newDefaultType });
  };

  const toggleSecretVisibility = (gatewayId: number) => {
    setShowSecrets(prev => ({
      ...prev,
      [gatewayId]: !prev[gatewayId]
    }));
  };

  const maskSecret = (secret: string, show: boolean) => {
    if (show || !secret) return secret;
    return '•'.repeat(8) + secret.slice(-4);
  };

  const getGatewayIcon = (keyword: string) => {
    switch (keyword.toLowerCase()) {
      case 'razorpay':
        return '💳';
      case 'payu':
        return '💰';
      case 'cashfree':
        return '📱';
      case 'phonepe':
        return '📲';
      case 'cod':
        return '🏦';
      default:
        return '💳';
    }
  };

  if (paymentLoading) return <LoadingSpinner />;

  const paymentSettingsData: PaymentSettingsData = paymentData?.data || {};
  const gateways = paymentSettingsData?.payment_methods || [];
  const paymentMethods = paymentSettingsData?.payment_methods || [];
  const stats = paymentSettingsData?.stats || { total_methods: 0, enabled_methods: 0, system_methods: 0 };

  // Create a map of payment methods by gateway keyword for easy lookup
  const methodsByGateway = paymentMethods.reduce((acc: any, method: any) => {
    const gatewayKeyword = method.payment_method.split('_')[0]; // Extract base gateway (cod, razorpay, etc.)
    if (!acc[gatewayKeyword]) acc[gatewayKeyword] = [];
    acc[gatewayKeyword].push(method);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('flow')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'flow'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Payment Flow & Visibility
            </button>
            <button
              onClick={() => setActiveTab('cod')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cod'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              COD Configuration
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'gateways'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Payment Gateways
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content: Payment Gateways */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{stats.total_methods}</div>
              <div className="text-sm text-gray-500">Total Gateways</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.enabled_methods}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-gray-400">{stats.total_methods - stats.enabled_methods}</div>
              <div className="text-sm text-gray-500">Inactive</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.system_methods}</div>
              <div className="text-sm text-gray-500">System</div>
            </div>
          </div>

          {/* Gateway List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {gateways.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {gateways.map((gateway: PaymentGateway) => (
                  <div
                    key={gateway.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!gateway.is_enabled ? 'opacity-60' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${gateway.is_enabled ? 'bg-green-50' : 'bg-gray-100'
                        }`}>
                        {getGatewayIcon(gateway.payment_method)}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{gateway.display_name}</h3>
                          <span className="text-xs text-gray-400">({gateway.payment_method})</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{gateway.description}</p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {gateway.is_enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        )}
                        {gateway.is_production_mode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            Test
                          </span>
                        )}
                        {gateway.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Default
                          </span>
                        )}
                        {gateway.credential_schema && (
                          gateway.credential_schema.required?.every(key =>
                            gateway.credential_schema?.fields[key]?.value
                          ) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Setup
                            </span>
                          )
                        )}
                      </div>

                      {/* Priority */}
                      <div className="text-xs text-gray-400 w-16 text-center flex-shrink-0">
                        Priority: {gateway.priority}
                      </div>

                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={gateway.is_enabled}
                          onChange={() => togglePaymentGatewayMutation.mutate(gateway)}
                          disabled={togglePaymentGatewayMutation.isPending}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-green-500"></div>
                      </label>

                      {/* Configure Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGateway(gateway)}
                        className="flex-shrink-0"
                      >
                        <CogIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CurrencyRupeeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Gateways</h3>
                <p className="text-gray-500 mb-4 text-sm">Run the payment seeders to set up payment gateways.</p>
                <code className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg inline-block">
                  php artisan db:seed --class=PaymentMethodSeeder
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Payment Flow Settings */}
      {activeTab === 'flow' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment Flow Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Control how payment options are presented to customers</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Flow Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Flow Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  value={paymentFlowType}
                  onChange={(e) => handleFlowTypeChange(e.target.value)}
                  disabled={updatePaymentFlowMutation.isPending}
                >
                  <option value="two_tier">Two-Tier Selection (Full Payment vs COD)</option>
                  <option value="single_list">Single Gateway List (All options together)</option>
                  <option value="cod_first">COD First (Show COD prominently)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  <strong>Two-Tier:</strong> Shows "Full Payment" vs "COD" choice first<br />
                  <strong>Single List:</strong> All gateways including COD in one list<br />
                  <strong>COD First:</strong> Prominently displays COD option first
                </p>
              </div>

              {/* Default Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Payment Selection
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  value={defaultPaymentType}
                  onChange={(e) => handleDefaultTypeChange(e.target.value)}
                  disabled={updatePaymentFlowMutation.isPending}
                >
                  <option value="none">No Default (User must choose)</option>
                  <option value="online">Full Payment (Online)</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Pre-select a payment type when customers reach the payment page
                </p>
              </div>
            </div>

            {/* Payment Type Visibility Controls */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Payment Type Visibility</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Online Payment Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Online Payment (Full Payment)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Show "Full Payment (Pay Online Now)" option
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={onlinePaymentEnabled}
                      onChange={(e) => {
                        setOnlinePaymentEnabled(e.target.checked);
                        updatePaymentFlowMutation.mutate({
                          online_payment_enabled: e.target.checked ? '1' : '0'
                        });
                      }}
                      disabled={updatePaymentFlowMutation.isPending}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* COD Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Cash on Delivery (COD)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Show "Cash on Delivery" option
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={codEnabled}
                      onChange={(e) => {
                        setCodEnabled(e.target.checked);
                        updatePaymentFlowMutation.mutate({
                          cod_enabled: e.target.checked ? '1' : '0'
                        });
                      }}
                      disabled={updatePaymentFlowMutation.isPending}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 <strong>Tip:</strong> You can hide payment options to force customers to use a specific payment method. For example, turn off COD to only accept online payments.
              </p>
            </div>

            {/* Success Message */}
            {updatePaymentFlowMutation.isSuccess && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Settings Saved!</p>
                    <p className="text-green-700">
                      Payment flow settings have been updated successfully. Changes will take effect immediately on the customer checkout page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CogIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">💡 How It Works</p>
                  <p className="text-blue-700">
                    These settings control the payment selection UI on your checkout page. Changes are saved automatically when you select an option.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: COD Payment Methods Configuration */}
      {activeTab === 'cod' && paymentData?.data?.payment_methods && paymentData.data.payment_methods.filter((m: any) => m.payment_method?.includes('cod')).length > 0 && (
        <CODMethodsSection
          methods={paymentData.data.payment_methods.filter((m: any) => m.payment_method?.includes('cod'))}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] })}
        />
      )}

      {/* Gateway Configuration Modal */}
      {editingGateway && (
        <GatewayConfigModal
          gateway={editingGateway}
          onClose={() => setEditingGateway(null)}
          onSave={(updates) => updatePaymentGatewayMutation.mutate({ gateway: editingGateway, updates })}
          saving={updatePaymentGatewayMutation.isPending}
          showSecrets={showSecrets[editingGateway.id] || false}
          onToggleSecrets={() => toggleSecretVisibility(editingGateway.id)}
        />
      )}
    </div>
  );
};

// Gateway Configuration Modal Component
interface GatewayConfigModalProps {
  gateway: PaymentGateway;
  onClose: () => void;
  onSave: (updates: any) => void;
  saving: boolean;
  showSecrets: boolean;
  onToggleSecrets: () => void;
}

const GatewayConfigModal: React.FC<GatewayConfigModalProps> = ({
  gateway,
  onClose,
  onSave,
  saving,
  showSecrets,
  onToggleSecrets
}) => {
  // Extract credential values from credential_schema.fields
  const getInitialCredentials = () => {
    const credentials: Record<string, any> = {};
    if (gateway.credential_schema?.fields) {
      Object.entries(gateway.credential_schema.fields).forEach(([key, field]: [string, any]) => {
        // Use the value from the schema if it exists and is not masked
        if (field.value !== undefined && !field.is_masked) {
          credentials[key] = field.value;
        } else if (field.value !== undefined && field.is_masked) {
          // For masked values, show empty to allow user to enter new value
          credentials[key] = '';
        }
      });
    }
    return credentials;
  };

  const [formData, setFormData] = useState({
    name: gateway.display_name,
    description: gateway.description,
    is_enabled: gateway.is_enabled,
    is_production_mode: gateway.is_production_mode,
    priority: gateway.priority,
    configuration: { ...gateway.configuration, ...getInitialCredentials() },
  });

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

  const renderConfigFields = () => {
    // Check if gateway has credential_schema
    if (!gateway.credential_schema || !gateway.credential_schema.fields) {
      // If no schema, check if it's COD (special handling for non-API gateways)
      if (gateway.payment_method === 'cod') {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.service_charge || 0}
                onChange={(e) => updateConfig('service_charge', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.min_order_amount || 0}
                onChange={(e) => updateConfig('min_order_amount', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Order Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.max_order_amount || 0}
                onChange={(e) => updateConfig('max_order_amount', parseInt(e.target.value) || 0)}
                placeholder="50000"
              />
            </div>
          </div>
        );
      }

      return (
        <div className="text-sm text-gray-500">
          No configuration schema available for this gateway.
        </div>
      );
    }

    // Dynamically render form fields based on credential_schema
    const schema = gateway.credential_schema;
    const fields = schema.fields || {};
    const requiredFields = schema.required || [];
    const optionalFields = schema.optional || [];

    // Combine required and optional fields
    const allFieldKeys = [...requiredFields, ...optionalFields];

    // If no fields defined in required/optional arrays, use all field keys
    const fieldKeysToRender = allFieldKeys.length > 0 ? allFieldKeys : Object.keys(fields);

    return (
      <div className="space-y-4">
        {fieldKeysToRender.map((fieldKey) => {
          const fieldSchema = fields[fieldKey];
          if (!fieldSchema) {
            // If field schema not found, still render a basic input
            return (
              <div key={fieldKey}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  {requiredFields.includes(fieldKey) && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuration[fieldKey] || ''}
                  onChange={(e) => updateConfig(fieldKey, e.target.value)}
                  placeholder={`Enter ${fieldKey.replace(/_/g, ' ')}`}
                />
              </div>
            );
          }

          const fieldType = fieldSchema.type || 'string';
          const label = fieldSchema.label || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          const isRequired = requiredFields.includes(fieldKey);
          const isMasked = fieldSchema.is_masked === true;
          const maskedValue = isMasked && fieldSchema.value ? fieldSchema.value : null;
          const placeholder = isMasked && maskedValue
            ? `Current: ${maskedValue} (leave empty to keep)`
            : (fieldSchema.placeholder || `Enter ${label.toLowerCase()}`);
          const description = fieldSchema.description || '';

          // Determine if this field should be masked (for sensitive data)
          const isSensitive = fieldType === 'password' ||
            fieldKey.includes('secret') ||
            fieldKey.includes('key') ||
            fieldKey.includes('salt') ||
            fieldKey.includes('password') ||
            fieldKey.includes('token');

          return (
            <div key={fieldKey}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {!isRequired && <span className="text-gray-400 text-xs ml-2">(Optional)</span>}
              </label>

              {fieldType === 'select' && fieldSchema.options ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuration[fieldKey] || ''}
                  onChange={(e) => updateConfig(fieldKey, e.target.value)}
                >
                  <option value="">Select {label}</option>
                  {fieldSchema.options.map((option: any) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
              ) : fieldType === 'number' ? (
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuration[fieldKey] || ''}
                  onChange={(e) => updateConfig(fieldKey, parseFloat(e.target.value) || 0)}
                  placeholder={placeholder}
                  min={fieldSchema.min}
                  max={fieldSchema.max}
                  step={fieldSchema.step}
                />
              ) : fieldType === 'boolean' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`field-${fieldKey}`}
                    checked={formData.configuration[fieldKey] || false}
                    onChange={(e) => updateConfig(fieldKey, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`field-${fieldKey}`} className="ml-2 text-sm text-gray-700">
                    {description || 'Enable'}
                  </label>
                </div>
              ) : (
                <input
                  type={isSensitive ? (showSecrets ? 'text' : 'password') : 'text'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuration[fieldKey] || ''}
                  onChange={(e) => updateConfig(fieldKey, e.target.value)}
                  placeholder={placeholder}
                  required={isRequired && !isMasked}
                />
              )}

              {isMasked && maskedValue && (
                <p className="mt-1 text-xs text-green-600">✓ Value already set (showing masked). Leave empty to keep current value.</p>
              )}
              {description && fieldType !== 'boolean' && (
                <p className="mt-1 text-xs text-gray-500">{description}</p>
              )}
            </div>
          );
        })}

        {fieldKeysToRender.length === 0 && (
          <div className="text-sm text-gray-500">
            No configuration fields defined for this gateway.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Configure {gateway.display_name}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onToggleSecrets}>
                {showSecrets ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gateway Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_production"
                  checked={formData.is_production_mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_production_mode: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_production" className="ml-2 block text-sm text-gray-900">
                  Production Mode
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-4">API Configuration</h4>
              {renderConfigFields()}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => onSave(formData)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// COD Methods Section Component
interface CODMethodsSectionProps {
  methods: any[];
  onRefresh: () => void;
}

const CODMethodsSection: React.FC<CODMethodsSectionProps> = ({ methods, onRefresh }) => {
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const { showSuccess, showError } = useNotificationStore();

  // Only show the main 'cod' method, hide the variants
  const mainCodMethod = methods.find((m) => m.payment_method === 'cod');

  const toggleMethodMutation = useMutation({
    mutationFn: (id: number) => settingsApi.togglePaymentGateway(id),
    onSuccess: () => {
      showSuccess('COD status updated successfully');
      onRefresh();
    },
    onError: (error: any) => {
      showError('Failed to toggle COD', error.message);
    },
  });

  const updateMethodMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      settingsApi.updatePaymentGateway(id, updates),
    onSuccess: () => {
      showSuccess('COD configuration saved successfully');
      onRefresh();
      setEditingMethod(null);
    },
    onError: (error: any) => {
      showError('Failed to update COD configuration', error.message);
    },
  });

  if (!mainCodMethod) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        <p>COD payment method not found in database.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Cash on Delivery (COD)</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure COD advance payments, service charges, and order restrictions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={mainCodMethod.is_enabled ? 'success' : 'secondary'}>
                {mainCodMethod.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Button
                variant={mainCodMethod.is_enabled ? 'danger' : 'success'}
                size="sm"
                onClick={() => toggleMethodMutation.mutate(mainCodMethod.id)}
                disabled={toggleMethodMutation.isPending}
              >
                {mainCodMethod.is_enabled ? 'Disable COD' : 'Enable COD'}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Configuration Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyRupeeIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Advance Payment</h4>
              </div>
              {mainCodMethod.configuration?.advance_payment?.required ? (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {mainCodMethod.configuration.advance_payment.type === 'fixed'
                      ? `₹${mainCodMethod.configuration.advance_payment.value}`
                      : `${mainCodMethod.configuration.advance_payment.value}%`}
                  </p>
                  <p className="text-sm text-gray-600">Required upfront</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-500">Not Required</p>
                  <p className="text-sm text-gray-400">Pay full amount on delivery</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <CogIcon className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Service Charges</h4>
              </div>
              {mainCodMethod.configuration?.service_charges?.enabled ? (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {mainCodMethod.configuration.service_charges.type === 'fixed'
                      ? `₹${mainCodMethod.configuration.service_charges.value}`
                      : `${mainCodMethod.configuration.service_charges.value}%`}
                  </p>
                  <p className="text-sm text-gray-600">COD handling fee</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-500">No Charges</p>
                  <p className="text-sm text-gray-400">Free COD service</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Order Limits</h4>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Min: <span className="font-bold text-gray-900">₹{mainCodMethod.restrictions?.min_order_amount || 0}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Max:{' '}
                  <span className="font-bold text-gray-900">
                    {mainCodMethod.restrictions?.max_order_amount
                      ? `₹${mainCodMethod.restrictions.max_order_amount}`
                      : 'No limit'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setEditingMethod(mainCodMethod)}>
              <CogIcon className="h-4 w-4 mr-2" />
              Configure COD Settings
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="p-6 bg-blue-50">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">💡 How COD Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-800">
            <div>
              <strong>No Advance:</strong> Customer pays full amount on delivery
            </div>
            <div>
              <strong>Fixed Advance (₹200):</strong> Customer pays ₹200 online, rest on delivery
            </div>
            <div>
              <strong>Percentage Advance (20%):</strong> Customer pays 20% online, 80% on delivery
            </div>
          </div>
        </div>
      </div>

      {/* Hide old multiple COD sections */}
      <div className="hidden">
        <div className="divide-y divide-gray-200">
          {methods.map((method: any) => (
            <div key={method.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{method.display_name}</h4>
                    <Badge variant={method.is_enabled ? 'success' : 'secondary'} size="sm">
                      {method.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMethod(method)}
                  >
                    <CogIcon className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button
                    variant={method.is_enabled ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => toggleMethodMutation.mutate(method.id)}
                    disabled={toggleMethodMutation.isPending}
                  >
                    {method.is_enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              {/* Current Configuration Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">ADVANCE PAYMENT</h5>
                  {method.configuration?.advance_payment?.required ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {method.configuration.advance_payment.type === 'fixed'
                          ? `₹${method.configuration.advance_payment.value}`
                          : `${method.configuration.advance_payment.value}%`}
                      </div>
                      <div className="text-gray-600 text-xs">Required upfront</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No advance required</div>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">SERVICE CHARGES</h5>
                  {method.configuration?.service_charges?.enabled ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {method.configuration.service_charges.type === 'fixed'
                          ? `₹${method.configuration.service_charges.value}`
                          : `${method.configuration.service_charges.value}%`}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {method.configuration.service_charges.description || 'Service charge'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No service charges</div>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">ORDER LIMITS</h5>
                  <div className="text-sm">
                    <div className="text-gray-900">Min: ₹{method.restrictions?.min_order_amount || 0}</div>
                    <div className="text-gray-900">
                      Max:{' '}
                      {method.restrictions?.max_order_amount
                        ? `₹${method.restrictions.max_order_amount}`
                        : 'No limit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COD Configuration Modal */}
      {editingMethod && (
        <CODConfigModal
          method={editingMethod}
          onClose={() => setEditingMethod(null)}
          onSave={(updates) => updateMethodMutation.mutate({ id: editingMethod.id, updates })}
          saving={updateMethodMutation.isPending}
        />
      )}
    </>
  );
};

// COD Configuration Modal Component
interface CODConfigModalProps {
  method: any;
  onClose: () => void;
  onSave: (updates: any) => void;
  saving: boolean;
}

const CODConfigModal: React.FC<CODConfigModalProps> = ({ method, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    display_name: method.display_name,
    description: method.description,
    priority: method.priority,
    configuration: {
      advance_payment: method.configuration?.advance_payment || {
        required: false,
        type: 'fixed',
        value: 0,
      },
      service_charges: method.configuration?.service_charges || {
        enabled: false,
        type: 'fixed',
        value: 0,
      },
    },
    restrictions: {
      min_order_amount: method.restrictions?.min_order_amount || 100,
      max_order_amount: method.restrictions?.max_order_amount || null,
    },
  });

  const updateNestedValue = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Configure {method.display_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ✕
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Basic Information</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Advance Payment */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Advance Payment</h4>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="advance-required"
                checked={formData.configuration.advance_payment.required}
                onChange={(e) =>
                  updateNestedValue('configuration.advance_payment.required', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="advance-required" className="text-sm font-medium text-gray-700">
                Require Advance Payment
              </label>
            </div>

            {formData.configuration.advance_payment.required && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.configuration.advance_payment.type}
                    onChange={(e) =>
                      updateNestedValue('configuration.advance_payment.type', e.target.value)
                    }
                  >
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value{' '}
                    {formData.configuration.advance_payment.type === 'fixed' ? '(₹)' : '(%)'}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.configuration.advance_payment.value}
                    onChange={(e) =>
                      updateNestedValue(
                        'configuration.advance_payment.value',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="0"
                    step={formData.configuration.advance_payment.type === 'percentage' ? '1' : '10'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service Charges */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Service Charges</h4>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="service-enabled"
                checked={formData.configuration.service_charges.enabled}
                onChange={(e) =>
                  updateNestedValue('configuration.service_charges.enabled', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="service-enabled" className="text-sm font-medium text-gray-700">
                Enable Service Charges
              </label>
            </div>

            {formData.configuration.service_charges.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.configuration.service_charges.type}
                    onChange={(e) =>
                      updateNestedValue('configuration.service_charges.type', e.target.value)
                    }
                  >
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value {formData.configuration.service_charges.type === 'fixed' ? '(₹)' : '(%)'}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.configuration.service_charges.value}
                    onChange={(e) =>
                      updateNestedValue(
                        'configuration.service_charges.value',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Restrictions */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Order Restrictions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.restrictions.min_order_amount}
                  onChange={(e) =>
                    updateNestedValue('restrictions.min_order_amount', parseInt(e.target.value) || 0)
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Order Amount (₹)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.restrictions.max_order_amount || ''}
                  onChange={(e) =>
                    updateNestedValue(
                      'restrictions.max_order_amount',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  min="0"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="text-sm font-semibold text-yellow-900 mb-2">💡 Quick Tips</h5>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• <strong>Fixed Advance:</strong> Good for specific amount like ₹200, ₹300 - same for all orders</li>
              <li>• <strong>Percentage Advance:</strong> Good for 20%, 30% - scales with order value</li>
              <li>• <strong>Service Charge:</strong> Covers COD handling costs - typically ₹30-₹50 or 2%</li>
              <li>• <strong>Min Order:</strong> Set higher (₹500+) for advance payment COD to ensure worthwhile</li>
              <li>• <strong>Max Order:</strong> Limit high-value COD to reduce risk (e.g., ₹50,000)</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;