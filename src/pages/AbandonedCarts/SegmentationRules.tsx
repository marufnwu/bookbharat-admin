'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit2, Trash2, Eye, Users, TrendingUp, Download } from 'lucide-react';

interface SegmentCriteria {
  min_cart_value: number | undefined;
  max_cart_value: number | undefined;
  is_repeat_customer: boolean;
  min_previous_purchases: number | undefined;
  customer_lifetime_value: number | undefined;
}

interface SegmentRules {
  recovery_discount: number;
  email_frequency: string;
  sms_enabled: boolean;
  retry_attempts: number;
}

interface Segment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  rules: SegmentRules;
  customer_count: number;
  recovery_rate: number;
  created_at: string;
  updated_at: string;
}

interface SegmentStats {
  total_segments: number;
  total_customers: number;
  recovery_rates: Array<{ segment: string; rate: number }>;
}

export const SegmentationRules: React.FC = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    criteria: {
      min_cart_value: undefined as number | undefined,
      max_cart_value: undefined as number | undefined,
      is_repeat_customer: false,
      min_previous_purchases: undefined as number | undefined,
      customer_lifetime_value: undefined as number | undefined
    },
    rules: {
      recovery_discount: 10,
      email_frequency: 'daily',
      sms_enabled: false,
      retry_attempts: 3
    }
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1/admin';

  // Fetch segments
  const { data: segmentsData, isLoading: segmentsLoading, refetch: refetchSegments } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/segments`);
      return response.data;
    }
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['segment-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/segments/stats`);
      return response.data;
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        criteria: JSON.stringify(data.criteria),
        rules: JSON.stringify(data.rules)
      };
      
      if (editingId) {
        return axios.put(`${API_BASE}/abandoned-carts/segments/${editingId}`, payload);
      }
      return axios.post(`${API_BASE}/abandoned-carts/segments`, payload);
    },
    onSuccess: () => {
      refetchSegments();
      resetForm();
      setShowForm(false);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`${API_BASE}/abandoned-carts/segments/${id}`);
    },
    onSuccess: () => {
      refetchSegments();
    }
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.get(`${API_BASE}/abandoned-carts/segments/export?segment_id=${id}`);
    }
  });

  useEffect(() => {
    if (segmentsData?.data) {
      setSegments(segmentsData.data);
    }
  }, [segmentsData]);

  const resetForm = () => {
    setFormData({
      name: '',
      criteria: {
        min_cart_value: undefined as number | undefined,
        max_cart_value: undefined as number | undefined,
        is_repeat_customer: false,
        min_previous_purchases: undefined as number | undefined,
        customer_lifetime_value: undefined as number | undefined
      },
      rules: {
        recovery_discount: 10,
        email_frequency: 'daily',
        sms_enabled: false,
        retry_attempts: 3
      }
    });
    setEditingId(null);
  };

  const handleEdit = (segment: Segment) => {
    const defaultCriteria = {
      min_cart_value: undefined as number | undefined,
      max_cart_value: undefined as number | undefined,
      is_repeat_customer: false,
      min_previous_purchases: undefined as number | undefined,
      customer_lifetime_value: undefined as number | undefined
    };

    const defaultRules = {
      recovery_discount: 10,
      email_frequency: 'daily' as const,
      sms_enabled: false,
      retry_attempts: 3
    };

    setFormData({
      name: segment.name,
      criteria: segment.criteria ? { ...segment.criteria } : defaultCriteria,
      rules: segment.rules ? { ...segment.rules } : defaultRules
    });
    setEditingId(segment.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleExport = (segment: Segment) => {
    exportMutation.mutate(segment.id, {
      onSuccess: (response) => {
        // Download CSV
        const csv = atob(response.data.data.csv);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.data.filename;
        a.click();
      }
    });
  };

  const stats = statsData?.data as SegmentStats;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Segments</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_segments || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-3xl font-bold text-purple-600">{(stats?.total_customers || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg Recovery Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.recovery_rates && stats.recovery_rates.length > 0
              ? (stats.recovery_rates.reduce((sum, r) => sum + r.rate, 0) / stats.recovery_rates.length).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Segment' : 'Create New Segment'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Segment name (e.g., High-Value Customers)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Criteria */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Segmentation Criteria</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Cart Value</label>
                  <input
                    type="number"
                    value={formData.criteria.min_cart_value || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, min_cart_value: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Cart Value</label>
                  <input
                    type="number"
                    value={formData.criteria.max_cart_value || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, max_cart_value: e.target.value ? parseFloat(e.target.value) : undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Previous Purchases</label>
                  <input
                    type="number"
                    value={formData.criteria.min_previous_purchases || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, min_previous_purchases: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Customer Lifetime Value</label>
                  <input
                    type="number"
                    value={formData.criteria.customer_lifetime_value || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, customer_lifetime_value: e.target.value ? parseFloat(e.target.value) : undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.criteria.is_repeat_customer || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, is_repeat_customer: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Repeat Customers Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recovery Rules</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Recovery Discount %</label>
                  <input
                    type="number"
                    value={formData.rules.recovery_discount}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: { ...formData.rules, recovery_discount: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email Frequency</label>
                  <select
                    value={formData.rules.email_frequency}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: { ...formData.rules, email_frequency: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily</option>
                    <option value="every_3_days">Every 3 Days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Retry Attempts</label>
                  <input
                    type="number"
                    value={formData.rules.retry_attempts}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: { ...formData.rules, retry_attempts: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="10"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.rules.sms_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: { ...formData.rules, sms_enabled: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Enable SMS Recovery</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Segment'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Segment
        </button>
      )}

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segmentsLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading segments...
          </div>
        ) : segments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No segments found
          </div>
        ) : (
          segments.map((segment) => (
            <div key={segment.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                  <p className="text-xs text-gray-500">ID: {segment.id}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedSegment(segment);
                      setShowDetails(true);
                    }}
                    className="p-1 hover:bg-blue-100 rounded"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleEdit(segment)}
                    className="p-1 hover:bg-yellow-100 rounded"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-yellow-600" />
                  </button>
                  <button
                    onClick={() => handleExport(segment)}
                    className="p-1 hover:bg-green-100 rounded"
                    title="Export"
                  >
                    <Download className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this segment?')) {
                        deleteMutation.mutate(segment.id);
                      }
                    }}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Card Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Customers
                  </span>
                  <span className="font-medium">{segment.customer_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Recovery Rate
                  </span>
                  <span className="font-medium">{(segment.recovery_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">{segment.rules?.recovery_discount || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SMS Enabled</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    segment.rules?.sms_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {segment.rules?.sms_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{selectedSegment.name}</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Criteria</p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  {selectedSegment.criteria?.min_cart_value && (
                    <p>Min Cart: ₹{selectedSegment.criteria.min_cart_value}</p>
                  )}
                  {selectedSegment.criteria?.max_cart_value && (
                    <p>Max Cart: ₹{selectedSegment.criteria.max_cart_value}</p>
                  )}
                  {selectedSegment.criteria?.is_repeat_customer && (
                    <p>Repeat Customers Only</p>
                  )}
                  {selectedSegment.criteria?.min_previous_purchases && (
                    <p>Min Purchases: {selectedSegment.criteria.min_previous_purchases}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Rules</p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>Discount: {selectedSegment.rules?.recovery_discount}%</p>
                  <p>Email: {selectedSegment.rules?.email_frequency}</p>
                  <p>Retries: {selectedSegment.rules?.retry_attempts}</p>
                  <p>SMS: {selectedSegment.rules?.sms_enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Performance</p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>Customers: {selectedSegment.customer_count}</p>
                  <p>Recovery Rate: {(selectedSegment.recovery_rate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentationRules;
