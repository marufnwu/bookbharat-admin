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
  const [activeTab, setActiveTab] = useState<'gateways' | 'flow' | 'cod'>('flow');
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
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'flow'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Flow & Visibility
            </button>
            <button
              onClick={() => setActiveTab('cod')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cod'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              COD Configuration
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'gateways'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Gateways
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards - Only show on gateways tab */}
      {activeTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Gateways</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total_methods}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Enabled Methods</p>
              <p className="text-lg font-semibold text-gray-900">{stats.enabled_methods}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Payment Methods</p>
              <p className="text-lg font-semibold text-gray-900">{stats.enabled_methods}</p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Tab Content: Payment Gateways */}
      {activeTab === 'gateways' && (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Gateways (Master Switches)</h3>
          <p className="text-sm text-gray-500 mt-1">Configure your payment gateways and API settings</p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📌 Single Source of Truth - Hierarchical System:</strong>
            </p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4">
              <li>• <strong>Gateway Toggle (below)</strong> = Master switch for entire gateway (Razorpay, Cashfree, etc.)</li>
              <li>• <strong>Method Configuration</strong> = Individual method switch (go to "COD Configuration" tab)</li>
              <li>• <strong>Visibility Rule:</strong> Customers see a payment method ONLY if BOTH Gateway AND Method are enabled</li>
            </ul>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {gateways.length > 0 ? gateways.map((gateway: PaymentGateway) => (
              <div key={gateway.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={gateway.is_enabled}
                          onChange={() => togglePaymentGatewayMutation.mutate(gateway)}
                          disabled={togglePaymentGatewayMutation.isPending}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getGatewayIcon(gateway.payment_method)}</span>
                        <h4 className="font-medium text-gray-900">{gateway.display_name}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{gateway.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {gateway.is_enabled ? (
                          <Badge variant="success" size="sm">Gateway Active</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Gateway Inactive</Badge>
                        )}
                        {gateway.is_production_mode ? (
                          <Badge variant="danger" size="sm">Production</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Test Mode</Badge>
                        )}
                        {/* Single Source of Truth: Show if customers can see this */}
                        {(() => {
                          const linkedMethods = methodsByGateway[gateway.payment_method] || [];
                          const enabledMethods = linkedMethods.filter((m: any) => m.is_enabled);
                          const canCustomersSee = gateway.is_enabled && enabledMethods.length > 0;

                          if (canCustomersSee) {
                            return <Badge variant="success" size="sm">✓ Visible to Customers</Badge>;
                          } else if (!gateway.is_enabled && enabledMethods.length > 0) {
                            return <Badge variant="warning" size="sm">⚠ Config Enabled But Gateway Off</Badge>;
                          } else if (gateway.is_enabled && enabledMethods.length === 0) {
                            return <Badge variant="secondary" size="sm">No Payment Methods</Badge>;
                          } else {
                            return <Badge variant="secondary" size="sm">Hidden from Customers</Badge>;
                          }
                        })()}
                        <span className="text-xs text-gray-400">Priority: {gateway.priority}</span>
                        <div className="flex gap-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            INR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGateway(gateway)}
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* CUSTOMER VISIBILITY - HIERARCHICAL SINGLE SOURCE OF TRUTH */}
                <div className="mt-4 pt-4 border-t-2 border-blue-100 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-blue-900 mb-2">
                        🛒 Customer Checkout Visibility (SINGLE SOURCE OF TRUTH)
                      </h5>
                      <div className="text-xs text-blue-700 mb-3 bg-blue-100 p-2 rounded">
                        <strong>Visibility Rule:</strong> Gateway (this toggle) AND Method (configuration) must BOTH be ON
                      </div>
                      {(() => {
                        const linkedMethods = methodsByGateway[gateway.payment_method] || [];
                        const enabledMethods = linkedMethods.filter((m: any) => m.is_enabled);
                        const canCustomersSee = gateway.is_enabled && enabledMethods.length > 0;

                        if (canCustomersSee) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-green-700 font-medium">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>VISIBLE - Customers can select this payment method</span>
                              </div>
                              <div className="text-sm text-gray-700 ml-7">
                                <strong>Payment Methods Available:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {enabledMethods.map((method: any) => (
                                    <li key={method.id}>{method.display_name}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        } else if (!gateway.is_enabled && enabledMethods.length > 0) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-red-700 font-medium">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>❌ BLOCKED - Gateway Master Switch is OFF</span>
                              </div>
                              <div className="text-sm text-gray-700 ml-7">
                                <p className="mb-2 font-semibold text-red-800">⚠️ CRITICAL: These methods are enabled but customers CANNOT see them because the gateway is disabled!</p>
                                <p className="mb-2 bg-yellow-50 border border-yellow-200 p-2 rounded">
                                  <strong>Action Required:</strong> Turn ON the gateway toggle above (Master Switch) to enable these {enabledMethods.length} method(s):
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {enabledMethods.map((method: any) => (
                                    <li key={method.id} className="text-gray-900">{method.display_name}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        } else if (gateway.is_enabled && enabledMethods.length === 0) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-red-700 font-medium">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>HIDDEN - Gateway is ON but NO payment methods configured</span>
                              </div>
                              <div className="text-sm text-gray-700 ml-7">
                                <p className="text-red-600 font-medium">⚠️ Action Required:</p>
                                <p className="mt-1">This gateway is active but customers cannot use it because no payment method is configured.</p>
                                <p className="mt-2">
                                  {linkedMethods.length > 0 ? (
                                    <>Found {linkedMethods.length} disabled method(s). Enable them or create a new payment method configuration.</>
                                  ) : (
                                    <>No payment methods found. You need to create a payment method configuration for this gateway in the database.</>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                              <span>HIDDEN - Not visible to customers</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Configuration Preview */}
                {gateway.configuration && Object.keys(gateway.configuration).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Configuration</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(gateway.id)}
                      >
                        {showSecrets[gateway.id] ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {Object.entries(gateway.configuration).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-mono text-xs text-gray-800">
                            {typeof value === 'string' && (key.includes('key') || key.includes('secret') || key.includes('salt'))
                              ? maskSecret(value, showSecrets[gateway.id] || false)
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8">
                <CurrencyRupeeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Gateways</h3>
                <p className="text-gray-500 mb-4">Run the payment seeders to set up payment gateways.</p>
                <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded-lg">
                  <code>php artisan db:seed --class=PaymentSettingSeeder</code><br />
                  <code>php artisan db:seed --class=EnablePaymentGatewaysSeeder</code>
                </div>
              </div>
            )}
          </div>
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
  const [formData, setFormData] = useState({
    name: gateway.display_name,
    description: gateway.description,
    is_enabled: gateway.is_enabled,
    is_production_mode: gateway.is_production_mode,
    priority: gateway.priority,
    configuration: { ...gateway.configuration },
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
    switch (gateway.payment_method) {
      case 'razorpay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.key || ''}
                onChange={(e) => updateConfig('key', e.target.value)}
                placeholder="rzp_test_xxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.secret || ''}
                onChange={(e) => updateConfig('secret', e.target.value)}
                placeholder="Enter Razorpay secret key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (Optional)</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.webhook_secret || ''}
                onChange={(e) => updateConfig('webhook_secret', e.target.value)}
                placeholder="Enter webhook secret"
              />
            </div>
          </div>
        );

      case 'payu':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.merchant_key || ''}
                onChange={(e) => updateConfig('merchant_key', e.target.value)}
                placeholder="Enter PayU merchant key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Salt</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.salt || ''}
                onChange={(e) => updateConfig('salt', e.target.value)}
                placeholder="Enter PayU salt"
              />
            </div>
          </div>
        );

      case 'cashfree':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.app_id || ''}
                onChange={(e) => updateConfig('app_id', e.target.value)}
                placeholder="Enter Cashfree client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input
                type={showSecrets ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.configuration.secret_key || ''}
                onChange={(e) => updateConfig('secret_key', e.target.value)}
                placeholder="Enter Cashfree secret key"
              />
            </div>
          </div>
        );

      case 'cod':
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

      default:
        return (
          <div className="text-sm text-gray-500">
            No specific configuration available for this gateway.
          </div>
        );
    }
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
    mutationFn: (id: number) => settingsApi.togglePaymentConfiguration(id),
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
      settingsApi.updatePaymentConfiguration(id, updates),
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