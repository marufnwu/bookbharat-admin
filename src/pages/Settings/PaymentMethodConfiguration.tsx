import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CurrencyRupeeIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, LoadingSpinner, Badge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { settingsApi } from '../../api';

interface PaymentMethod {
  id: number;
  payment_method: string;
  display_name: string;
  description: string;
  is_enabled: boolean;
  priority: number;
  configuration: {
    advance_payment?: {
      required: boolean;
      type: 'fixed' | 'percentage';
      value: number;
      description?: string;
    };
    service_charges?: {
      enabled?: boolean;
      type: 'fixed' | 'percentage' | 'tiered';
      value: number;
      description?: string;
      is_taxable?: boolean;
      min_charge?: number;
      max_charge?: number;
      conditions?: {
        exempt_above?: number;
      };
      tiers?: Array<{
        min: number;
        max: number;
        charge: number;
      }>;
    };
  };
  restrictions: {
    min_order_amount?: number;
    max_order_amount?: number;
    excluded_categories?: number[];
    excluded_pincodes?: string[];
  };
}

const PaymentMethodConfiguration: React.FC = () => {
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<any>({});
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Fetch payment methods
  const { data: paymentData, isLoading } = useQuery({
    queryKey: ['settings', 'payment'],
    queryFn: settingsApi.getPayment,
  });

  const updateMethodMutation = useMutation({
    mutationFn: (data: { id: number; updates: any }) =>
      settingsApi.updatePaymentConfiguration(data.id, data.updates),
    onSuccess: () => {
      showSuccess('Payment method updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
      setEditingMethod(null);
    },
    onError: (error: any) => {
      showError('Failed to update payment method', error.message);
    },
  });

  const toggleMethodMutation = useMutation({
    mutationFn: (id: number) => settingsApi.togglePaymentConfiguration(id),
    onSuccess: () => {
      showSuccess('Payment method status updated');
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
    },
    onError: (error: any) => {
      showError('Failed to toggle payment method', error.message);
    },
  });

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      display_name: method.display_name,
      description: method.description,
      priority: method.priority,
      configuration: { ...method.configuration },
      restrictions: { ...method.restrictions },
    });
  };

  const handleSave = () => {
    if (!editingMethod) return;

    updateMethodMutation.mutate({
      id: editingMethod.id,
      updates: formData,
    });
  };

  const updateConfig = (path: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const paymentMethods = paymentData?.data?.payment_methods || [];
  const codMethods = paymentMethods.filter((m: PaymentMethod) =>
    m.payment_method.includes('cod')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Method Configuration
        </h2>
        <p className="text-gray-600">
          Configure COD charges, advance payments, and order restrictions
        </p>
      </div>

      {/* COD Payment Methods */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cash on Delivery (COD) Methods
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure advance payments, service charges, and restrictions
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {codMethods.map((method: PaymentMethod) => (
            <div key={method.id} className="p-6">
              {/* Method Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {method.display_name}
                    </h4>
                    <Badge
                      variant={method.is_enabled ? 'success' : 'secondary'}
                      size="sm"
                    >
                      {method.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button
                    variant={method.is_enabled ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => toggleMethodMutation.mutate(method.id)}
                    disabled={toggleMethodMutation.isPending}
                  >
                    {method.is_enabled ? (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Current Configuration Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {/* Advance Payment */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">
                    ADVANCE PAYMENT
                  </h5>
                  {method.configuration.advance_payment?.required ? (
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

                {/* Service Charges */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">
                    SERVICE CHARGES
                  </h5>
                  {method.configuration.service_charges?.enabled ? (
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

                {/* Restrictions */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 mb-2">
                    ORDER LIMITS
                  </h5>
                  <div className="text-sm">
                    <div className="text-gray-900">
                      Min: ₹{method.restrictions.min_order_amount || 0}
                    </div>
                    <div className="text-gray-900">
                      Max:{' '}
                      {method.restrictions.max_order_amount
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

      {/* Edit Modal */}
      {editingMethod && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Configure {editingMethod.display_name}
              </h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">
                  Basic Information
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.display_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Advance Payment */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">
                  Advance Payment Configuration
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="advance-required"
                    checked={formData.configuration?.advance_payment?.required || false}
                    onChange={(e) =>
                      updateConfig('configuration.advance_payment.required', e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="advance-required" className="text-sm font-medium text-gray-700">
                    Require Advance Payment
                  </label>
                </div>

                {formData.configuration?.advance_payment?.required && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Advance Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.configuration?.advance_payment?.type || 'fixed'}
                          onChange={(e) =>
                            updateConfig('configuration.advance_payment.type', e.target.value)
                          }
                        >
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                          {formData.configuration?.advance_payment?.type === 'fixed'
                            ? ' (₹)'
                            : ' (%)'}
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.configuration?.advance_payment?.value || 0}
                          onChange={(e) =>
                            updateConfig(
                              'configuration.advance_payment.value',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step={
                            formData.configuration?.advance_payment?.type === 'percentage'
                              ? '1'
                              : '10'
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Payment Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={formData.configuration?.advance_payment?.description || ''}
                        onChange={(e) =>
                          updateConfig('configuration.advance_payment.description', e.target.value)
                        }
                        placeholder="e.g., Fixed ₹200 advance payment"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Service Charges */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">
                  Service Charges
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="service-enabled"
                    checked={formData.configuration?.service_charges?.enabled || false}
                    onChange={(e) =>
                      updateConfig('configuration.service_charges.enabled', e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="service-enabled" className="text-sm font-medium text-gray-700">
                    Enable Service Charges
                  </label>
                </div>

                {formData.configuration?.service_charges?.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Charge Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.configuration?.service_charges?.type || 'fixed'}
                          onChange={(e) =>
                            updateConfig('configuration.service_charges.type', e.target.value)
                          }
                        >
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                          {formData.configuration?.service_charges?.type === 'fixed' ? ' (₹)' : ' (%)'}
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.configuration?.service_charges?.value || 0}
                          onChange={(e) =>
                            updateConfig(
                              'configuration.service_charges.value',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Charge Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={formData.configuration?.service_charges?.description || ''}
                        onChange={(e) =>
                          updateConfig('configuration.service_charges.description', e.target.value)
                        }
                        placeholder="e.g., COD handling charge"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="service-taxable"
                        checked={formData.configuration?.service_charges?.is_taxable || false}
                        onChange={(e) =>
                          updateConfig('configuration.service_charges.is_taxable', e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="service-taxable" className="text-sm text-gray-700">
                        Service charge is taxable
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* Order Restrictions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">
                  Order Restrictions
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.restrictions?.min_order_amount || 0}
                      onChange={(e) =>
                        updateConfig('restrictions.min_order_amount', parseInt(e.target.value) || 0)
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
                      value={formData.restrictions?.max_order_amount || ''}
                      onChange={(e) =>
                        updateConfig(
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

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">💡 Configuration Tips</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>
                        <strong>Fixed Advance:</strong> Customer pays fixed amount (e.g., ₹200) upfront
                      </li>
                      <li>
                        <strong>Percentage Advance:</strong> Customer pays percentage (e.g., 20%) upfront
                      </li>
                      <li>
                        <strong>Service Charges:</strong> Additional fee for COD handling
                      </li>
                      <li>
                        <strong>Order Limits:</strong> Control minimum/maximum order values for this method
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingMethod(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMethodMutation.isPending}
              >
                {updateMethodMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodConfiguration;
