import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Percent,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface DiscountManagerProps {
  cartId: number;
}

interface CartDiscount {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minValue?: number;
  maxValue?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: {
    recoveryAttemptId?: number;
    customerSegment?: string;
    cartValue?: number;
    recoveryReason?: string;
  };
}

interface NewDiscount {
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minValue?: number;
  maxValue?: number;
  usageLimit?: number;
  expiresAt?: string;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({ cartId }) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [newDiscount, setNewDiscount] = useState<NewDiscount>({
    discountType: 'percentage',
    discountValue: 10,
  });
  const [editingData, setEditingData] = useState<NewDiscount>({
    discountType: 'percentage',
    discountValue: 10,
  });

  const {
    data: discounts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['cart-discounts', cartId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/discounts`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart discounts');
      }
      return response.json() as Promise<{ success: boolean; data: CartDiscount[] }>;
    },
    select: (result) => result.data,
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (discountData: NewDiscount) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        throw new Error('Failed to create discount');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-discounts', cartId] });
      setIsCreating(false);
      setNewDiscount({ discountType: 'percentage', discountValue: 10 });
    },
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async ({ discountId, discountData }: { discountId: number; discountData: Partial<NewDiscount> }) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/discounts/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        throw new Error('Failed to update discount');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-discounts', cartId] });
      setEditingDiscount(null);
      setEditingData({ discountType: 'percentage', discountValue: 10 });
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (discountId: number) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/discounts/${discountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-discounts', cartId] });
    },
  });

  const toggleDiscountMutation = useMutation({
    mutationFn: async ({ discountId, isActive }: { discountId: number; isActive: boolean }) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/discounts/${discountId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle discount');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-discounts', cartId] });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDiscount = (discount: CartDiscount) => {
    if (discount.discountType === 'percentage') {
      return `${discount.discountValue}%`;
    } else {
      return `₹${discount.discountValue}`;
    }
  };

  const handleCreateDiscount = () => {
    if (newDiscount.discountValue > 0) {
      createDiscountMutation.mutate(newDiscount);
    }
  };

  const handleUpdateDiscount = (discountId: number) => {
    if (editingData.discountValue && editingData.discountValue > 0) {
      updateDiscountMutation.mutate({
        discountId,
        discountData: editingData
      });
    }
  };

  const filteredDiscounts = discounts?.filter(discount =>
    showInactive || discount.isActive
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading discounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load discounts</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Discount Management
        </h3>

        <div className="flex items-center space-x-3">
          {/* Show Inactive Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInactive" className="ml-2 text-sm text-gray-700">
              Show Inactive
            </label>
          </div>

          {/* Create Discount Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Discount
          </button>
        </div>
      </div>

      {/* Create Discount Form */}
      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Create New Discount</h4>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={newDiscount.discountType}
                  onChange={(e) => setNewDiscount({ ...newDiscount, discountType: e.target.value as any })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={newDiscount.discountValue}
                  onChange={(e) => setNewDiscount({ ...newDiscount, discountValue: parseFloat(e.target.value) || 0 })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={newDiscount.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  min="0"
                  step={newDiscount.discountType === 'percentage' ? '1' : '1'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Value (Optional)
                </label>
                <input
                  type="number"
                  value={newDiscount.minValue || ''}
                  onChange={(e) => setNewDiscount({ ...newDiscount, minValue: parseFloat(e.target.value) || undefined })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum order value"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount Amount (Optional)
                </label>
                <input
                  type="number"
                  value={newDiscount.maxValue || ''}
                  onChange={(e) => setNewDiscount({ ...newDiscount, maxValue: parseFloat(e.target.value) || undefined })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Maximum discount amount"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  value={newDiscount.usageLimit || ''}
                  onChange={(e) => setNewDiscount({ ...newDiscount, usageLimit: parseInt(e.target.value) || undefined })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Number of times this discount can be used"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newDiscount.expiresAt || ''}
                  onChange={(e) => setNewDiscount({ ...newDiscount, expiresAt: e.target.value })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewDiscount({ discountType: 'percentage', discountValue: 10 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDiscount}
                disabled={createDiscountMutation.isPending || newDiscount.discountValue <= 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {createDiscountMutation.isPending ? 'Creating...' : 'Create Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discounts List */}
      {filteredDiscounts.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No discounts found</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first discount to incentivize cart recovery
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscounts.map((discount) => (
            <div key={discount.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Discount Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        {discount.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(discount.code)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy discount code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      discount.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {discount.isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </span>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Percent className="h-3 w-3 mr-1" />
                      {formatDiscount(discount)}
                    </span>

                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(discount.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Discount Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <div className="font-medium text-gray-900">
                        {discount.usedCount} of {discount.usageLimit || '∞'}
                      </div>
                    </div>

                    {discount.minValue && (
                      <div>
                        <span className="text-gray-500">Min Value:</span>
                        <div className="font-medium text-gray-900">₹{discount.minValue}</div>
                      </div>
                    )}

                    {discount.maxValue && (
                      <div>
                        <span className="text-gray-500">Max Discount:</span>
                        <div className="font-medium text-gray-900">₹{discount.maxValue}</div>
                      </div>
                    )}

                    {discount.expiresAt && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <div className="font-medium text-gray-900">
                          {new Date(discount.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  {discount.metadata && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {discount.metadata.customerSegment && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="font-medium">Segment:</span>
                          <span className="ml-2 capitalize">{discount.metadata.customerSegment}</span>
                        </div>
                      )}
                      {discount.metadata.cartValue && (
                        <div className="flex items-center text-xs text-gray-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span className="font-medium">Cart Value:</span>
                          <span className="ml-2">₹{discount.metadata.cartValue}</span>
                        </div>
                      )}
                      {discount.metadata.recoveryReason && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="font-medium">Reason:</span>
                          <span className="ml-2">{discount.metadata.recoveryReason}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingDiscount === discount.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Type
                          </label>
                          <select
                            value={editingData.discountType || discount.discountType}
                            onChange={(e) => setEditingData({ ...editingData, discountType: e.target.value as any })}
                            className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed_amount">Fixed Amount (₹)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            value={editingData.discountValue || discount.discountValue}
                            onChange={(e) => setEditingData({ ...editingData, discountValue: parseFloat(e.target.value) || 0 })}
                            className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingDiscount(null);
                            setEditingData({ discountType: 'percentage', discountValue: 10 });
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateDiscount(discount.id)}
                          disabled={updateDiscountMutation.isPending}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateDiscountMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingDiscount(discount.id);
                      setEditingData({
                        discountType: discount.discountType,
                        discountValue: discount.discountValue,
                        minValue: discount.minValue,
                        maxValue: discount.maxValue,
                        usageLimit: discount.usageLimit,
                        expiresAt: discount.expiresAt,
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit discount"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => toggleDiscountMutation.mutate({
                      discountId: discount.id,
                      isActive: !discount.isActive
                    })}
                    className="text-gray-400 hover:text-gray-600"
                    title={discount.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {discount.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteDiscountMutation.mutate(discount.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete discount"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Discount Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {discounts?.filter(d => d.isActive).length || 0}
            </div>
            <div className="text-xs text-gray-600">Active Discounts</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {discounts?.reduce((sum, d) => sum + d.usedCount, 0) || 0}
            </div>
            <div className="text-xs text-gray-600">Total Uses</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {discounts?.filter(d => d.expiresAt && new Date(d.expiresAt) > new Date()).length || 0}
            </div>
            <div className="text-xs text-gray-600">Active & Expiring</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountManager;