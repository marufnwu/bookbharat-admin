import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { toast } from 'react-hot-toast';
import {
  Truck,
  Settings,
  ToggleLeft,
  ToggleRight,
  Globe,
  Package,
  Clock,
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
  Edit,
  Save,
  X,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface CarrierConfig {
  id: number;
  code: string;
  name: string;
  display_name?: string;
  logo_url?: string;
  api_mode: 'test' | 'live';
  is_active: boolean;
  is_primary: boolean;
  status: 'active' | 'inactive' | 'testing';
  features?: string[];
  services?: Record<string, string>;
  max_weight?: number;
  max_insurance_value?: number;
  cutoff_time?: string;
  pickup_days?: string[];
  weight_unit?: string;
  dimension_unit?: string;
  rating?: number;
  success_rate?: number;
  average_delivery_time?: number;
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
  success: boolean;
  response_time?: number;
  error?: string;
  details?: {
    mode: string;
    endpoint_reachable: boolean;
    authentication: boolean;
    services_available: boolean;
  };
}

const CarrierConfiguration: React.FC = () => {
  const queryClient = useQueryClient();
  const [testingCarrier, setTestingCarrier] = useState<number | null>(null);
  const [expandedCarrier, setExpandedCarrier] = useState<number | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<CarrierConfig | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [validatingCredentials, setValidatingCredentials] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Fetch carriers
  const { data: carriers, isLoading, refetch } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await api.get('/shipping/multi-carrier/carriers');
      return response.data.data;
    }
  });

  // Toggle carrier active status
  const toggleCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle carrier status');
    }
  });

  // Set primary carrier
  const setPrimaryMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrierId}/config`, {
        is_primary: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Primary carrier set successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set primary carrier');
    }
  });

  // Test carrier connection
  const testCarrierMutation = useMutation({
    mutationFn: async (carrierId: number) => {
      const response = await api.post(`/shipping/multi-carrier/carriers/${carrierId}/test`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(data.data?.error || 'Connection test failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Connection test failed');
    }
  });

  // Sync carriers from config
  const syncCarriersMutation = useMutation({
    mutationFn: async () => {
      return api.post('/shipping/multi-carrier/sync-from-config');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carriers synced from configuration successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sync carriers');
    }
  });

  // Update carrier credentials
  const updateCredentialsMutation = useMutation({
    mutationFn: async ({ carrierId, credentials }: { carrierId: number; credentials: any }) => {
      return api.put(`/shipping/multi-carrier/carriers/${carrierId}/config`, credentials);
    },
    onSuccess: (data, variables) => {
      // Update the carriers query cache immediately with the new data
      queryClient.setQueryData(['carriers'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((carrier: any) => {
          if (carrier.id === variables.carrierId) {
            // Update the carrier with the new credentials
            return { ...carrier, ...variables.credentials };
          }
          return carrier;
        });
      });

      // Also invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: ['carriers'] });

      toast.success('Carrier credentials updated successfully');
      setEditingCarrier(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update carrier credentials');
    }
  });

  // Validate carrier credentials
  const validateCredentialsMutation = useMutation({
    mutationFn: async ({ carrierId, credentials }: { carrierId: number; credentials: any }) => {
      return api.post(`/shipping/multi-carrier/carriers/${carrierId}/validate-credentials`, credentials);
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data.success) {
        setValidationResult({
          success: true,
          message: 'Credentials validated successfully!',
          details: data.data
        });
        toast.success('Credentials validation successful');
      } else {
        setValidationResult({
          success: false,
          message: data.message || 'Credentials validation failed',
          details: data.details
        });
        toast.error(data.message || 'Credentials validation failed');
      }
    },
    onError: (error: any) => {
      setValidationResult({
        success: false,
        message: 'Validation request failed',
        details: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Credentials validation failed');
    }
  });

  const handleToggleCarrier = (carrierId: number) => {
    toggleCarrierMutation.mutate(carrierId);
  };

  const handleSetPrimary = (carrierId: number) => {
    setPrimaryMutation.mutate(carrierId);
  };

  const handleTestConnection = async (carrierId: number) => {
    setTestingCarrier(carrierId);
    await testCarrierMutation.mutateAsync(carrierId);
    setTestingCarrier(null);
  };

  const handleSyncCarriers = () => {
    syncCarriersMutation.mutate();
  };

  const handleEditCredentials = (carrier: CarrierConfig) => {
    // Get the most current carrier data from the carriers array
    const currentCarrier = carriers?.find((c: CarrierConfig) => c.id === carrier.id) || carrier;
    setEditingCarrier(currentCarrier);
  };

  const handleSaveCredentials = (credentials: any) => {
    if (editingCarrier) {
      updateCredentialsMutation.mutate({
        carrierId: editingCarrier.id,
        credentials
      });
    }
  };

  const handleValidateCredentials = (credentials: any) => {
    if (editingCarrier) {
      setValidatingCredentials(true);
      setValidationResult(null);
      validateCredentialsMutation.mutate({
        carrierId: editingCarrier.id,
        credentials
      }, {
        onSettled: () => setValidatingCredentials(false)
      });
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Get credential fields based on carrier
  const getCredentialFields = (carrier: CarrierConfig) => {
    const baseFields = [
      { key: 'api_endpoint', label: 'API Endpoint', type: 'text', required: true },
      // webhook_url is developer-configured and not editable by admin
    ];

    switch (carrier.code) {
      case 'DELHIVERY':
        return [
          ...baseFields,
          { key: 'api_key', label: 'API Key', type: 'password', required: true },
          { key: 'client_name', label: 'Client Name', type: 'text', required: true },
        ];

      case 'BLUEDART':
        return [
          ...baseFields,
          { key: 'license_key', label: 'License Key', type: 'password', required: true },
          { key: 'login_id', label: 'Login ID', type: 'password', required: true },
        ];

      case 'XPRESSBEES':
        return [
          ...baseFields,
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'password', label: 'Password', type: 'password', required: true },
          { key: 'account_id', label: 'Account ID', type: 'text', required: true },
        ];

      case 'DTDC':
        return [
          ...baseFields,
          { key: 'access_token', label: 'Access Token', type: 'password', required: true },
          { key: 'customer_code', label: 'Customer Code', type: 'text', required: true },
        ];

      case 'ECOM_EXPRESS':
        return [
          ...baseFields,
          { key: 'username', label: 'Username', type: 'text', required: true },
          { key: 'password', label: 'Password', type: 'password', required: true },
        ];

      case 'SHADOWFAX':
        return [
          ...baseFields,
          { key: 'api_token', label: 'API Token', type: 'password', required: true },
        ];

      case 'SHIPROCKET':
        return [
          ...baseFields,
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'password', label: 'Password', type: 'password', required: true },
        ];

      default:
        return [
          ...baseFields,
          { key: 'api_key', label: 'API Key', type: 'password', required: true },
          { key: 'api_secret', label: 'API Secret', type: 'password', required: false },
        ];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'testing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'tracking': return <Activity className="h-4 w-4" />;
      case 'cod': return <CreditCard className="h-4 w-4" />;
      case 'insurance': return <Shield className="h-4 w-4" />;
      case 'reverse_pickup': return <RefreshCw className="h-4 w-4" />;
      case 'multi_piece': return <Package className="h-4 w-4" />;
      case 'same_day': return <Zap className="h-4 w-4" />;
      case 'instant': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

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
            Manage shipping carrier settings. Carriers are configured in the system config file.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSyncCarriers}
            disabled={syncCarriersMutation.isPending}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncCarriersMutation.isPending ? 'animate-spin' : ''}`} />
            Sync from Config
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Configuration Note</h3>
            <p className="mt-1 text-sm text-blue-700">
              Carrier configurations are managed through the system config file and environment variables.
              Use the toggle to enable/disable carriers and set primary carrier for automatic selection.
            </p>
          </div>
        </div>
      </div>

      {/* Carriers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {carriers?.map((carrier: CarrierConfig) => (
          <div
            key={carrier.id}
            className={`bg-white rounded-lg shadow-sm border ${carrier.is_primary ? 'border-blue-400' : 'border-gray-200'}`}
          >
            <div className="p-6">
              {/* Carrier Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  {/* Logo */}
                  {carrier.logo_url ? (
                    <img
                      src={carrier.logo_url}
                      alt={carrier.name}
                      className="h-12 w-12 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                      <Truck className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  {/* Carrier Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {carrier.display_name || carrier.name}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {carrier.code}
                      </span>
                      {carrier.is_primary && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(carrier.status)}`}>
                          {carrier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        <span className="capitalize">{carrier.api_mode || 'test'} Mode</span>
                      </div>
                      {carrier.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-400" />
                          <span>{parseFloat(String(carrier.rating)).toFixed(1)}</span>
                        </div>
                      )}
                      {carrier.success_rate && (
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                          <span>{parseFloat(String(carrier.success_rate)).toFixed(0)}% Success</span>
                        </div>
                      )}
                      {carrier.total_shipments !== undefined && (
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          <span>{Number(carrier.total_shipments).toLocaleString()} Shipments</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestConnection(carrier.id)}
                    disabled={testingCarrier === carrier.id}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Test Connection"
                  >
                    <TestTube className={`h-5 w-5 ${testingCarrier === carrier.id ? 'animate-pulse' : ''}`} />
                  </button>

                  {!carrier.is_primary && carrier.is_active && (
                    <button
                      onClick={() => handleSetPrimary(carrier.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Set as Primary"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleCarrier(carrier.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      carrier.is_active
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    title={carrier.is_active ? 'Disable Carrier' : 'Enable Carrier'}
                  >
                    {carrier.is_active ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleEditCredentials(carrier)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Credentials"
                  >
                    <Key className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setExpandedCarrier(expandedCarrier === carrier.id ? null : carrier.id)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCarrier === carrier.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Features */}
                    {carrier.features && carrier.features.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {carrier.features.map(feature => (
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
                    {carrier.services && Object.keys(carrier.services).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                        <div className="space-y-1">
                          {Object.entries(carrier.services).map(([code, name]) => (
                            <div key={code} className="flex items-center text-sm">
                              <span className="text-gray-500 font-mono text-xs mr-2">{code}:</span>
                              <span className="text-gray-700">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                            <dd className="text-gray-700">₹{carrier.max_insurance_value.toLocaleString()}</dd>
                          </div>
                        )}
                        {carrier.cutoff_time && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Cutoff Time:</dt>
                            <dd className="text-gray-700">{carrier.cutoff_time}</dd>
                          </div>
                        )}
                        {carrier.average_delivery_time && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Avg Delivery:</dt>
                            <dd className="text-gray-700">{parseFloat(String(carrier.average_delivery_time)).toFixed(1)} days</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Pickup Days */}
                    {carrier.pickup_days && carrier.pickup_days.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Pickup Days</h4>
                        <div className="flex flex-wrap gap-1">
                          {carrier.pickup_days.map(day => (
                            <span
                              key={day}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize"
                            >
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Configuration */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">API Configuration</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Mode:</dt>
                          <dd className="text-gray-700 capitalize">{carrier.api_mode}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Webhook:</dt>
                          <dd className="text-gray-700 text-xs font-mono bg-gray-100 px-2 py-1 rounded truncate" title={carrier.webhook_url || 'Not configured'}>
                            {carrier.webhook_url || 'Not configured'}
                          </dd>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 italic">
                          Webhook URLs are developer-configured and cannot be edited here.
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Configuration Notice */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <Info className="h-3 w-3 inline mr-1" />
                      Carrier credentials can be edited here. Webhook URLs and other system settings are developer-configured.
                      Use "Sync from Config" after updating the configuration files.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!carriers || carriers.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No carriers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure carriers in the system config file and sync them here.
          </p>
          <div className="mt-6">
            <button
              onClick={handleSyncCarriers}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync from Config
            </button>
          </div>
        </div>
      )}

      {/* Credential Editing Modal */}
      {editingCarrier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setEditingCarrier(null)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editingCarrier.display_name || editingCarrier.name} Credentials
              </h3>
              <button
                onClick={() => setEditingCarrier(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <CredentialForm
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

// Credential Form Component
interface CredentialFormProps {
  carrier: CarrierConfig;
  fields: Array<{ key: string; label: string; type: string; required: boolean }>;
  onSave: (credentials: any) => void;
  onValidate: (credentials: any) => void;
  onCancel: () => void;
  showPassword: Record<string, boolean>;
  onTogglePassword: (field: string) => void;
  isLoading: boolean;
  isValidating: boolean;
  validationResult: {
    success: boolean;
    message: string;
    details?: any;
  } | null;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  carrier,
  fields,
  onSave,
  onValidate,
  onCancel,
  showPassword,
  onTogglePassword,
  isLoading,
  isValidating,
  validationResult
}) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      // Try to get existing value from carrier data
      const carrierData = (carrier as any);
      initialData[field.key] = carrierData[field.key] || '';
    });
    return initialData;
  });

  // Update form data when carrier changes
  React.useEffect(() => {
    const updatedData: Record<string, string> = {};
    fields.forEach(field => {
      const carrierData = (carrier as any);
      updatedData[field.key] = carrierData[field.key] || '';
    });
    setFormData(updatedData);
  }, [carrier, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Security Notice</h4>
            <p className="mt-1 text-sm text-blue-700">
              Credentials are stored securely and encrypted. Test mode credentials are separate from live mode.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div className={`border rounded-lg p-4 mb-4 ${
          validationResult.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex">
            {validationResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
            )}
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                validationResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.success ? 'Validation Successful' : 'Validation Failed'}
              </h4>
              <p className={`mt-1 text-sm ${
                validationResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.message}
              </p>
              {validationResult.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer hover:underline">
                    View Details
                  </summary>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(validationResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
              <input
                type={field.type === 'password' && !showPassword[field.key] ? 'password' : 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
                required={field.required}
              />

              {field.type === 'password' && (
                <button
                  type="button"
                  onClick={() => onTogglePassword(field.key)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword[field.key] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={isLoading || isValidating}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onValidate(formData)}
          className="px-4 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-100 disabled:opacity-50 flex items-center"
          disabled={isLoading || isValidating}
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
          disabled={isLoading || isValidating}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Credentials
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CarrierConfiguration;