import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import { toast } from 'react-hot-toast';
import { Edit2, Save, X, Info, Truck } from 'lucide-react';
import { Button, Card, CardContent, Badge, PageSkeleton } from '../../components';

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

  const getZoneBadgeVariant = (zone: string): 'success' | 'info' | 'purple' | 'warning' | 'error' | 'default' => {
    const variants: Record<string, 'success' | 'info' | 'purple' | 'warning' | 'error' | 'default'> = {
      A: 'success',
      B: 'info',
      C: 'purple',
      D: 'warning',
      E: 'error',
    };
    return variants[zone] || 'default';
  };

  const thresholds: ThresholdData[] = (data as any)?.thresholds || [];

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Free Shipping Thresholds</h1>
          <p className="text-sm text-gray-600 mt-1">Configure minimum order values for free shipping by zone</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
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
                  const isEditing = editingZone === threshold.zone;

                  return (
                    <tr key={threshold.zone} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={"info"}>
                          Zone {threshold.zone}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {threshold.zone_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(threshold.zone, threshold.enabled)}
                          disabled={toggleEnabledMutation.isPending}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                            threshold.enabled ? 'bg-primary-600' : 'bg-gray-200'
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
                              className="w-32 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
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
                        <Badge variant={threshold.has_custom_value ? 'success' : 'default'}>
                          {threshold.has_custom_value ? 'Custom' : 'Default'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(threshold.zone)}
                              loading={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={updateMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(threshold.zone, threshold.threshold)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {thresholds.map((threshold) => {
          const isEditing = editingZone === threshold.zone;

          return (
            <Card key={threshold.zone}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={"info"}>
                      Zone {threshold.zone}
                    </Badge>
                    <Badge variant={threshold.has_custom_value ? 'success' : 'default'}>
                      {threshold.has_custom_value ? 'Custom' : 'Default'}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleToggleEnabled(threshold.zone, threshold.enabled)}
                    disabled={toggleEnabledMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                      threshold.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        threshold.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Zone Name</p>
                    <p className="text-sm font-medium text-gray-900">{threshold.zone_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Free Shipping Threshold</p>
                    {isEditing ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gray-500">₹</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="0.00"
                          min="0"
                          max="99999"
                          step="0.01"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        ₹{threshold.threshold.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSave(threshold.zone)}
                        loading={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleEdit(threshold.zone, threshold.threshold)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit Threshold
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">How it works:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span><strong>Toggle the switch to enable/disable</strong> free shipping for each zone</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span>Each shipping zone can have its own free shipping threshold</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span>When enabled and customer's order value meets or exceeds the threshold, shipping is free</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span>The threshold is checked after applying any discounts or coupons</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span>Free shipping is disabled by default - you must enable it for each zone</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary-600">•</span>
              <span>Changes take effect immediately for new orders</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreeShippingThresholds;
