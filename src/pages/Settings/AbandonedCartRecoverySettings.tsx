import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  AlertCircle,
  Settings,
  Mail,
  DollarSign,
  Clock,
  BarChart3,
  MessageSquare,
  Smartphone,
  Loader,
  Target,
  Sliders,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

// Detection Criteria Section Component
const DetectionCriteriaSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [criteria, setCriteria] = useState({
    min_inactive_minutes: 2,
    max_inactive_hours: 24,
    abandonment_score_threshold: 70,
    high_value_cart_threshold: 1000,
    time_weight: 30,
    value_weight: 25,
    session_weight: 20,
    completion_weight: 15,
    history_weight: 10,
    value_thresholds: { tier1: 500, tier2: 1000, tier3: 2000, tier4: 5000 },
    segment_thresholds: {
      vip_spent: 50000,
      vip_orders: 20,
      high_value_spent: 20000,
      high_value_orders: 10,
      repeat_orders: 3,
    },
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['abandoned-cart-detection-settings'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/settings');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setCriteria((prev) => ({ ...prev, ...settingsData }));
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof criteria) => {
      const response = await api.put('/abandoned-carts/settings', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Detection criteria saved successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-cart-detection-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save criteria');
    },
  });

  const handleChange = (key: string, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  const handleNestedChange = (parent: 'value_thresholds' | 'segment_thresholds', key: string, value: number) => {
    setCriteria((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }));
  };

  const totalWeight = criteria.time_weight + criteria.value_weight + criteria.session_weight + criteria.completion_weight + criteria.history_weight;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 text-blue-600 animate-spin mr-2" />
          Loading detection criteria...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Target className="h-5 w-5 text-purple-600" />
        Detection Criteria
      </h3>
      <p className="text-sm text-gray-600">Configure when and how carts are detected as abandoned.</p>

      {/* Timing Settings */}
      <div className="border-b pb-4">
        <h4 className="flex items-center gap-2 text-md font-medium text-gray-800 mb-3">
          <Clock className="h-4 w-4 text-gray-600" />
          Detection Timing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Inactive (minutes)</label>
            <input
              type="number"
              value={criteria.min_inactive_minutes}
              onChange={(e) => handleChange('min_inactive_minutes', parseInt(e.target.value) || 1)}
              min={1}
              max={1440}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Wait time before detection</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Lookback (hours)</label>
            <input
              type="number"
              value={criteria.max_inactive_hours}
              onChange={(e) => handleChange('max_inactive_hours', parseInt(e.target.value) || 1)}
              min={1}
              max={168}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">How far back to look</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Auto-Abandon Score</label>
            <input
              type="number"
              value={criteria.abandonment_score_threshold}
              onChange={(e) => handleChange('abandonment_score_threshold', parseInt(e.target.value) || 50)}
              min={1}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Score threshold (0-100)</p>
          </div>
        </div>
      </div>

      {/* Score Weights */}
      <div className="border-b pb-4">
        <h4 className="flex items-center gap-2 text-md font-medium text-gray-800 mb-3">
          <Sliders className="h-4 w-4 text-gray-600" />
          Score Calculation Weights
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Total: {totalWeight}%
          </span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Weight (%)</label>
            <input
              type="number"
              value={criteria.time_weight}
              onChange={(e) => handleChange('time_weight', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Value Weight (%)</label>
            <input
              type="number"
              value={criteria.value_weight}
              onChange={(e) => handleChange('value_weight', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Session Weight (%)</label>
            <input
              type="number"
              value={criteria.session_weight}
              onChange={(e) => handleChange('session_weight', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Completion (%)</label>
            <input
              type="number"
              value={criteria.completion_weight}
              onChange={(e) => handleChange('completion_weight', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">History (%)</label>
            <input
              type="number"
              value={criteria.history_weight}
              onChange={(e) => handleChange('history_weight', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Value Thresholds */}
      <div className="border-b pb-4">
        <h4 className="flex items-center gap-2 text-md font-medium text-gray-800 mb-3">
          <DollarSign className="h-4 w-4 text-gray-600" />
          Cart Value Tiers (₹)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tier 1 (Low)</label>
            <input
              type="number"
              value={criteria.value_thresholds.tier1}
              onChange={(e) => handleNestedChange('value_thresholds', 'tier1', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tier 2</label>
            <input
              type="number"
              value={criteria.value_thresholds.tier2}
              onChange={(e) => handleNestedChange('value_thresholds', 'tier2', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tier 3</label>
            <input
              type="number"
              value={criteria.value_thresholds.tier3}
              onChange={(e) => handleNestedChange('value_thresholds', 'tier3', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tier 4 (High)</label>
            <input
              type="number"
              value={criteria.value_thresholds.tier4}
              onChange={(e) => handleNestedChange('value_thresholds', 'tier4', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-2 px-3 py-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">High-Value Cart Threshold (₹)</label>
          <input
            type="number"
            value={criteria.high_value_cart_threshold}
            onChange={(e) => handleChange('high_value_cart_threshold', parseInt(e.target.value) || 0)}
            className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Carts above this get priority treatment</p>
        </div>
      </div>

      {/* Customer Segment Thresholds */}
      <div className="pb-4">
        <h4 className="flex items-center gap-2 text-md font-medium text-gray-800 mb-3">
          <Settings className="h-4 w-4 text-gray-600" />
          Customer Segment Thresholds
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-purple-800 mb-2">VIP Customers</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600">Total Spent (₹)</label>
                <input
                  type="number"
                  value={criteria.segment_thresholds.vip_spent}
                  onChange={(e) => handleNestedChange('segment_thresholds', 'vip_spent', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">OR Orders ≥</label>
                <input
                  type="number"
                  value={criteria.segment_thresholds.vip_orders}
                  onChange={(e) => handleNestedChange('segment_thresholds', 'vip_orders', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">High-Value Customers</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600">Total Spent (₹)</label>
                <input
                  type="number"
                  value={criteria.segment_thresholds.high_value_spent}
                  onChange={(e) => handleNestedChange('segment_thresholds', 'high_value_spent', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">OR Orders ≥</label>
                <input
                  type="number"
                  value={criteria.segment_thresholds.high_value_orders}
                  onChange={(e) => handleNestedChange('segment_thresholds', 'high_value_orders', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Repeat Customers</p>
            <div>
              <label className="text-xs text-gray-600">Orders ≥</label>
              <input
                type="number"
                value={criteria.segment_thresholds.repeat_orders}
                onChange={(e) => handleNestedChange('segment_thresholds', 'repeat_orders', parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(criteria)}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Detection Criteria'}
        </button>
      </div>
    </div>
  );
};

interface RecoverySettings {
  recovery_enabled: boolean;
  recovery_min_cart_value: number;
  recovery_abandonment_time: number;
  recovery_discount_second_email: number;
  recovery_discount_final_email: number;
  recovery_email_interval_first: number;
  recovery_email_interval_second: number;
  recovery_email_interval_final: number;
  recovery_discount_code_validity: number;
  recovery_sms_enabled: boolean;
  sms_gateway: string;
  sms_high_value_threshold: number;
  sms_rate_limit_hours: number;
  recovery_discount_sms: number;
  sms_message_template: string;
  sms_max_retries: number;
  recovery_data_retention_days: number;
  recovery_enable_analytics: boolean;
  ab_testing_enabled: boolean;
  ab_test_duration_days: number;
  ab_min_sample_size: number;
  ab_confidence_threshold: number;
  ab_auto_winner_threshold: number;
  segmentation_enabled: boolean;
  segment_1: string;
  segment_2: string;
  segment_3: string;
  segment_4: string;
}

const AbandonedCartRecoverySettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RecoverySettings>({
    recovery_enabled: true,
    recovery_min_cart_value: 100,
    recovery_abandonment_time: 1,
    recovery_discount_second_email: 5,
    recovery_discount_final_email: 10,
    recovery_email_interval_first: 1,
    recovery_email_interval_second: 24,
    recovery_email_interval_final: 48,
    recovery_discount_code_validity: 7,
    recovery_sms_enabled: false,
    sms_gateway: 'twilio', // Default
    sms_high_value_threshold: 1000,
    sms_rate_limit_hours: 1,
    recovery_discount_sms: 10,
    sms_message_template: 'Your cart is abandoned. Complete your purchase now!',
    sms_max_retries: 3,
    recovery_data_retention_days: 90,
    recovery_enable_analytics: true,
    ab_testing_enabled: false,
    ab_test_duration_days: 7,
    ab_min_sample_size: 100,
    ab_confidence_threshold: 0.95,
    ab_auto_winner_threshold: 0.9,
    segmentation_enabled: false,
    segment_1: '',
    segment_2: '',
    segment_3: '',
    segment_4: '',
  });

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['abandoned-cart-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/general');
      return response.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setFormData((prev) => ({
        ...prev,
        ...settingsData,
      }));
    }
  }, [settingsData]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RecoverySettings) => {
      const response = await api.put('/settings/general', { settings: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Recovery settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-cart-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleChange = (key: keyof RecoverySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> When a customer abandons their cart, automated emails are sent to encourage them to complete their purchase. You can customize the timing, discounts, and data retention below.
            </p>
          </div>
        </div>
      </div>

      {/* Detection Criteria Settings */}
      <DetectionCriteriaSection />

      {/* Main Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Enable/Disable */}
        <div className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-600" />
              <div>
                <label className="text-sm font-medium text-gray-900">Enable Cart Recovery</label>
                <p className="text-xs text-gray-500 mt-1">Activate or deactivate the entire recovery system</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('recovery_enabled', !formData.recovery_enabled)}
              className={`px-4 py-2 rounded-md font-medium transition ${
                formData.recovery_enabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formData.recovery_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Cart Value Settings */}
        <div className="border-b pb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <DollarSign className="h-5 w-5 text-gray-600" />
            Cart Value Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Cart Value (₹)</label>
              <input
                type="number"
                value={formData.recovery_min_cart_value}
                onChange={(e) => handleChange('recovery_min_cart_value', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Only recover carts above this amount</p>
            </div>
          </div>
        </div>

        {/* Timing Settings */}
        <div className="border-b pb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            Email Timing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mark as Abandoned After (hours)</label>
              <input
                type="number"
                value={formData.recovery_abandonment_time}
                onChange={(e) => handleChange('recovery_abandonment_time', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Email After (hours)</label>
              <input
                type="number"
                value={formData.recovery_email_interval_first}
                onChange={(e) => handleChange('recovery_email_interval_first', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Second Email After (hours)</label>
              <input
                type="number"
                value={formData.recovery_email_interval_second}
                onChange={(e) => handleChange('recovery_email_interval_second', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Final Email After (hours)</label>
              <input
                type="number"
                value={formData.recovery_email_interval_final}
                onChange={(e) => handleChange('recovery_email_interval_final', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="border-b pb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Mail className="h-5 w-5 text-gray-600" />
            Discount Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Second Email Discount (%)</label>
              <input
                type="number"
                value={formData.recovery_discount_second_email}
                onChange={(e) => handleChange('recovery_discount_second_email', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Offer in second recovery email</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Final Email Discount (%)</label>
              <input
                type="number"
                value={formData.recovery_discount_final_email}
                onChange={(e) => handleChange('recovery_discount_final_email', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Offer in final recovery email</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code Validity (days)</label>
              <input
                type="number"
                value={formData.recovery_discount_code_validity}
                onChange={(e) => handleChange('recovery_discount_code_validity', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Days discount codes remain valid</p>
            </div>
          </div>
        </div>

        {/* SMS & Analytics */}
        <div className="border-b pb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900">SMS Recovery for High-Value Carts</label>
                  <p className="text-xs text-gray-500 mt-1">Send SMS for carts above threshold</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('recovery_sms_enabled', !formData.recovery_sms_enabled)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  formData.recovery_sms_enabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formData.recovery_sms_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {formData.recovery_sms_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMS Gateway</label>
                  <select
                    value={formData.sms_gateway}
                    onChange={(e) => handleChange('sms_gateway', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="aws_sns">AWS SNS</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose SMS provider</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">High-Value Threshold (₹)</label>
                  <input
                    type="number"
                    value={formData.sms_high_value_threshold}
                    onChange={(e) => handleChange('sms_high_value_threshold', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Send SMS only for carts above this value</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate Limit (hours)</label>
                  <input
                    type="number"
                    value={formData.sms_rate_limit_hours}
                    onChange={(e) => handleChange('sms_rate_limit_hours', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum hours between SMS to same customer</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMS Discount (%)</label>
                  <input
                    type="number"
                    value={formData.recovery_discount_sms}
                    onChange={(e) => handleChange('recovery_discount_sms', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Discount offered in SMS recovery</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Retry Attempts</label>
                  <input
                    type="number"
                    value={formData.sms_max_retries}
                    onChange={(e) => handleChange('sms_max_retries', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Retry failed SMS up to X times</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">SMS Message Template</label>
                  <textarea
                    value={formData.sms_message_template}
                    onChange={(e) => handleChange('sms_message_template', e.target.value)}
                    rows={3}
                    placeholder="Use placeholders: {amount}, {code}, {discount}, {link}, {store}"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{amount}'}, {'{code}'}, {'{discount}'}, {'{link}'}, {'{store}'} as placeholders</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable Recovery Analytics</label>
                  <p className="text-xs text-gray-500 mt-1">Track conversions and revenue from recovered carts</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('recovery_enable_analytics', !formData.recovery_enable_analytics)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  formData.recovery_enable_analytics
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formData.recovery_enable_analytics ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* A/B Testing */}
        <div className="border-b pb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Smartphone className="h-5 w-5 text-gray-600" />
            A/B Testing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enable A/B Testing</label>
              <button
                onClick={() => handleChange('ab_testing_enabled', !formData.ab_testing_enabled)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  formData.ab_testing_enabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formData.ab_testing_enabled ? 'Enabled' : 'Disabled'}
              </button>
              <p className="text-xs text-gray-500 mt-1">Run different recovery strategies simultaneously</p>
            </div>
            {formData.ab_testing_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Duration (days)</label>
                  <input
                    type="number"
                    value={formData.ab_test_duration_days}
                    onChange={(e) => handleChange('ab_test_duration_days', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Sample Size</label>
                  <input
                    type="number"
                    value={formData.ab_min_sample_size}
                    onChange={(e) => handleChange('ab_min_sample_size', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confidence Threshold</label>
                  <input
                    type="number"
                    value={formData.ab_confidence_threshold}
                    onChange={(e) => handleChange('ab_confidence_threshold', parseFloat(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auto Winner Threshold</label>
                  <input
                    type="number"
                    value={formData.ab_auto_winner_threshold}
                    onChange={(e) => handleChange('ab_auto_winner_threshold', parseFloat(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Segmentation */}
        <div className="border-b pb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            Segmentation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enable Customer Segmentation</label>
              <button
                onClick={() => handleChange('segmentation_enabled', !formData.segmentation_enabled)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  formData.segmentation_enabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formData.segmentation_enabled ? 'Enabled' : 'Disabled'}
              </button>
              <p className="text-xs text-gray-500 mt-1">Target recovery emails based on customer segments</p>
            </div>
            {formData.segmentation_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segment 1</label>
                  <input
                    type="text"
                    value={formData.segment_1}
                    onChange={(e) => handleChange('segment_1', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segment 2</label>
                  <input
                    type="text"
                    value={formData.segment_2}
                    onChange={(e) => handleChange('segment_2', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segment 3</label>
                  <input
                    type="text"
                    value={formData.segment_3}
                    onChange={(e) => handleChange('segment_3', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segment 4</label>
                  <input
                    type="text"
                    value={formData.segment_4}
                    onChange={(e) => handleChange('segment_4', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Data Retention Period (days)</label>
          <input
            type="number"
            value={formData.recovery_data_retention_days}
            onChange={(e) => handleChange('recovery_data_retention_days', parseInt(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Delete abandoned carts after X days (GDPR compliance)</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setFormData(settingsData || {})}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          disabled={updateMutation.isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AbandonedCartRecoverySettings;
