'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit2, Trash2, Eye, Calendar, Percent, ShoppingCart } from 'lucide-react';

interface Discount {
  id: number;
  code: string;
  discount_percentage: number;
  cart_value_min: number;
  cart_value_max: number | null;
  valid_from: string;
  valid_until: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  description: string | null;
}

interface DiscountStats {
  active_count: number;
  expired_count: number;
  inactive_count: number;
  total_used: number;
  total_revenue: number;
  average_discount: number;
}

export const DiscountManagement: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    cart_value_min: 0,
    cart_value_max: '',
    valid_from: '',
    valid_until: '',
    max_uses: '',
    description: ''
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1/admin';

  // Fetch discounts
  const { data: discountsData, isLoading: discountsLoading, refetch: refetchDiscounts } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/discounts`);
      return response.data;
    }
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['discount-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/discounts/stats`);
      return response.data;
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return axios.put(`${API_BASE}/abandoned-carts/discounts/${editingId}`, data);
      }
      return axios.post(`${API_BASE}/abandoned-carts/discounts`, data);
    },
    onSuccess: () => {
      refetchDiscounts();
      resetForm();
      setShowForm(false);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`${API_BASE}/abandoned-carts/discounts/${id}`);
    },
    onSuccess: () => {
      refetchDiscounts();
    }
  });

  useEffect(() => {
    if (discountsData?.data) {
      setDiscounts(discountsData.data.data || discountsData.data);
    }
  }, [discountsData]);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      cart_value_min: 0,
      cart_value_max: '',
      valid_from: '',
      valid_until: '',
      max_uses: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleEdit = (discount: Discount) => {
    setFormData({
      code: discount.code,
      discount_percentage: discount.discount_percentage,
      cart_value_min: discount.cart_value_min,
      cart_value_max: discount.cart_value_max?.toString() || '',
      valid_from: discount.valid_from,
      valid_until: discount.valid_until,
      max_uses: discount.max_uses?.toString() || '',
      description: discount.description || ''
    });
    setEditingId(discount.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      cart_value_max: formData.cart_value_max ? parseFloat(formData.cart_value_max) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
    };
    saveMutation.mutate(submitData);
  };

  const stats = statsData?.data as DiscountStats;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.active_count || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.expired_count || 0}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{stats?.inactive_count || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Used</p>
          <p className="text-2xl font-bold text-green-600">{stats?.total_used || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-purple-600">₹{(stats?.total_revenue || 0).toFixed(0)}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg Discount</p>
          <p className="text-2xl font-bold text-indigo-600">{(stats?.average_discount || 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Discount' : 'Create New Discount'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={editingId !== null}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Cart Value</label>
              <input
                type="number"
                value={formData.cart_value_min}
                onChange={(e) => setFormData({ ...formData, cart_value_min: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Cart Value</label>
              <input
                type="number"
                value={formData.cart_value_max}
                onChange={(e) => setFormData({ ...formData, cart_value_max: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Discount'}
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
          Create Discount
        </button>
      )}

      {/* Discounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Discount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cart Value Range</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Valid Period</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discountsLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading discounts...
                </td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No discounts found
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{discount.code}</td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <Percent className="h-4 w-4 text-blue-600" />
                    {discount.discount_percentage}%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ₹{discount.cart_value_min} {discount.cart_value_max ? `- ₹${discount.cart_value_max}` : '+'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(discount.valid_from).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {discount.used_count} / {discount.max_uses || '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        discount.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDiscount(discount);
                        setShowDetails(true);
                      }}
                      className="p-1 hover:bg-blue-100 rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-1 hover:bg-yellow-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-yellow-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this discount?')) {
                          deleteMutation.mutate(discount.id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetails && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Discount Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-mono">{selectedDiscount.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p>{selectedDiscount.discount_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Period</p>
                <p>{new Date(selectedDiscount.valid_from).toLocaleDateString()} - {new Date(selectedDiscount.valid_until).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p>{selectedDiscount.description || 'N/A'}</p>
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

export default DiscountManagement;
