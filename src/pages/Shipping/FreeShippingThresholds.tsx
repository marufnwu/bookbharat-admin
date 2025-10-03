import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import { toast } from 'react-hot-toast';
import { Edit2, Save, X, Info } from 'lucide-react';

interface ThresholdData {
  zone: string;
  zone_name: string;
  threshold: number;
  enabled: boolean;
  has_custom_value: boolean;
}

const FreeShippingThresholds: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Fetch thresholds
  const { data, isLoading } = useQuery({
    queryKey: ['free-shipping-thresholds'],
    queryFn: () => shippingApi.getFreeShippingThresholds(),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { zone: string; threshold?: number; enabled?: boolean }) =>
      shippingApi.updateFreeShippingThreshold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-shipping-thresholds'] });
      toast.success('Free shipping configuration updated successfully');
      setEditingZone(null);
      setEditValue('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    },
  });

  // Toggle enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: (data: { zone: string; enabled: boolean }) =>
      shippingApi.updateFreeShippingThreshold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-shipping-thresholds'] });
      toast.success('Free shipping status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleEdit = (zone: string, currentValue: number) => {
    setEditingZone(zone);
    setEditValue(currentValue.toString());
  };

  const handleCancel = () => {
    setEditingZone(null);
    setEditValue('');
  };

  const handleSave = (zone: string) => {
    const threshold = parseFloat(editValue);

    if (isNaN(threshold) || threshold < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (threshold > 99999) {
      toast.error('Threshold cannot exceed ₹99,999');
      return;
    }

    updateMutation.mutate({ zone, threshold });
  };

  const handleToggleEnabled = (zone: string, currentEnabled: boolean) => {
    toggleEnabledMutation.mutate({ zone, enabled: !currentEnabled });
  };

  const getZoneColor = (zone: string) => {
    const colors: Record<string, string> = {
      A: 'green',
      B: 'blue',
      C: 'purple',
      D: 'orange',
      E: 'red',
    };
    return colors[zone] || 'gray';
  };

  const thresholds: ThresholdData[] = (data as any)?.thresholds || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading thresholds...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">About Free Shipping Thresholds</h3>
            <p className="mt-1 text-sm text-blue-700">
              Set minimum order values for each shipping zone to qualify for free shipping.
              When a customer's order value meets or exceeds the threshold for their delivery zone,
              shipping charges will be waived automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Zone-wise Free Shipping Thresholds</h3>
          <p className="mt-1 text-sm text-gray-600">
            Configure minimum order values for free shipping in each delivery zone
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enabled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Free Shipping Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {thresholds.map((threshold) => {
                const color = getZoneColor(threshold.zone);
                const isEditing = editingZone === threshold.zone;

                return (
                  <tr key={threshold.zone} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                        Zone {threshold.zone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {threshold.zone_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleEnabled(threshold.zone, threshold.enabled)}
                        disabled={toggleEnabledMutation.isPending}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                          threshold.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            threshold.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">₹</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                            min="0"
                            max="99999"
                            step="0.01"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          ₹{threshold.threshold.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {threshold.has_custom_value ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleSave(threshold.zone)}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(threshold.zone, threshold.threshold)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Toggle the switch to enable/disable</strong> free shipping for each zone</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Each shipping zone can have its own free shipping threshold</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>When enabled and customer's order value meets or exceeds the threshold, shipping is free</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The threshold is checked after applying any discounts or coupons</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Free shipping is disabled by default - you must enable it for each zone</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Changes take effect immediately for new orders</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FreeShippingThresholds;
