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
  keyword: string;
  name: string;
  description: string;
  is_active: boolean;
  is_production: boolean;
  supported_currencies: string[];
  configuration: Record<string, any>;
  webhook_config: Record<string, any>;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface PaymentSettingsData {
  payment_settings: PaymentGateway[];
  payment_methods: any[];
  stats: {
    active_gateways: number;
    enabled_methods: number;
    production_gateways: number;
  };
}

const PaymentSettings: React.FC = () => {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [paymentFlowType, setPaymentFlowType] = useState<string>('two_tier');
  const [defaultPaymentType, setDefaultPaymentType] = useState<string>('none');
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
    mutationFn: (settings: { flow_type?: string; default_type?: string }) =>
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
  const gateways = paymentSettingsData?.payment_settings || [];
  const stats = paymentSettingsData?.stats || { active_gateways: 0, enabled_methods: 0, production_gateways: 0 };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Gateways</p>
              <p className="text-lg font-semibold text-gray-900">{stats.active_gateways}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Production Mode</p>
              <p className="text-lg font-semibold text-gray-900">{stats.production_gateways}</p>
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

      {/* Payment Gateways */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Gateways</h3>
          <p className="text-sm text-gray-500 mt-1">Configure your payment gateways and API settings</p>
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
                          checked={gateway.is_active}
                          onChange={() => togglePaymentGatewayMutation.mutate(gateway)}
                          disabled={togglePaymentGatewayMutation.isPending}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getGatewayIcon(gateway.keyword)}</span>
                        <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{gateway.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {gateway.is_active ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Inactive</Badge>
                        )}
                        {gateway.is_production ? (
                          <Badge variant="danger" size="sm">Production</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Test Mode</Badge>
                        )}
                        <span className="text-xs text-gray-400">Priority: {gateway.priority}</span>
                        <div className="flex gap-1">
                          {gateway.supported_currencies.map(currency => (
                            <span key={currency} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {currency}
                            </span>
                          ))}
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

      {/* Payment Flow Settings */}
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
    name: gateway.name,
    description: gateway.description,
    is_active: gateway.is_active,
    is_production: gateway.is_production,
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
    switch (gateway.keyword) {
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
              Configure {gateway.name}
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
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
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
                  checked={formData.is_production}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_production: e.target.checked }))}
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

export default PaymentSettings;