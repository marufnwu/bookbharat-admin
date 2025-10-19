import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bundleVariantsApi } from '../api/extended';
import { ProductBundleVariant } from '../types';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Button, Input } from '../components';

interface BundleVariantManagerProps {
  productId: number;
  productPrice: number;
  productStock: number;
}

const BundleVariantManager: React.FC<BundleVariantManagerProps> = ({
  productId,
  productPrice,
  productStock,
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductBundleVariant | null>(null);
  const [formData, setFormData] = useState<Partial<ProductBundleVariant>>({
    name: '',
    sku: '',
    quantity: 2,
    pricing_type: 'percentage_discount',
    discount_percentage: 10,
    fixed_price: undefined,
    fixed_discount: undefined,
    compare_price: undefined,
    stock_management_type: 'use_main_product',
    stock_quantity: 0,
    is_active: true,
    sort_order: 0,
  });
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Fetch existing bundle variants
  const { data: variantsData, isLoading } = useQuery({
    queryKey: ['bundleVariants', productId],
    queryFn: () => bundleVariantsApi.getAll(productId),
    enabled: !!productId && productId > 0,
  });

  const variants = variantsData?.bundle_variants || [];

  // Debug: Track showForm state changes
  useEffect(() => {
    console.log('showForm changed to:', showForm);
  }, [showForm]);

  // Debug: Track editingVariant state changes
  useEffect(() => {
    console.log('editingVariant changed to:', editingVariant);
  }, [editingVariant]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<ProductBundleVariant>) => {
      console.log('Creating bundle variant:', data);
      return bundleVariantsApi.create(productId, data);
    },
    onSuccess: () => {
      console.log('Bundle variant created successfully');
      queryClient.invalidateQueries({ queryKey: ['bundleVariants', productId] });
      toast.success('Bundle variant created successfully');
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create bundle variant');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductBundleVariant> }) => {
      console.log('Updating bundle variant:', id, data);
      return bundleVariantsApi.update(productId, id, data);
    },
    onSuccess: () => {
      console.log('Bundle variant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bundleVariants', productId] });
      toast.success('Bundle variant updated successfully');
      resetForm();
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update bundle variant');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bundleVariantsApi.delete(productId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundleVariants', productId] });
      toast.success('Bundle variant deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete bundle variant');
    },
  });

  // Calculate price preview
  useEffect(() => {
    if (formData.quantity && formData.quantity >= 2) {
      const basePrice = productPrice * formData.quantity;
      let bundlePrice = basePrice;

      switch (formData.pricing_type) {
        case 'percentage_discount':
          if (formData.discount_percentage) {
            bundlePrice = basePrice * (1 - formData.discount_percentage / 100);
          }
          break;
        case 'fixed_price':
          bundlePrice = formData.fixed_price || basePrice;
          break;
        case 'fixed_discount':
          bundlePrice = Math.max(0, basePrice - (formData.fixed_discount || 0));
          break;
      }

      setCalculatedPrice(Math.round(bundlePrice * 100) / 100);
    }
  }, [formData, productPrice]);

  const resetForm = () => {
    console.log('resetForm called');
    setFormData({
      name: '',
      sku: '',
      quantity: 2,
      pricing_type: 'percentage_discount',
      discount_percentage: 10,
      fixed_price: undefined,
      fixed_discount: undefined,
      compare_price: undefined,
      stock_management_type: 'use_main_product',
      stock_quantity: 0,
      is_active: true,
      sort_order: 0,
    });
    setEditingVariant(null);
    setShowForm(false);
    setCalculatedPrice(null);
  };

  const handleEdit = (variant: ProductBundleVariant) => {
    setEditingVariant(variant);
    setFormData({
      ...variant,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this bundle variant?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    // Validation
    if (!formData.name || !formData.sku || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.quantity < 2) {
      toast.error('Quantity must be at least 2');
      return;
    }

    if (formData.pricing_type === 'percentage_discount' && !formData.discount_percentage) {
      toast.error('Please enter discount percentage');
      return;
    }

    if (formData.pricing_type === 'fixed_price' && !formData.fixed_price) {
      toast.error('Please enter fixed price');
      return;
    }

    if (formData.pricing_type === 'fixed_discount' && !formData.fixed_discount) {
      toast.error('Please enter fixed discount amount');
      return;
    }

    if (formData.stock_management_type === 'separate_stock' && formData.stock_quantity === undefined) {
      toast.error('Please enter stock quantity for separate stock management');
      return;
    }

    if (editingVariant) {
      updateMutation.mutate({
        id: editingVariant.id!,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof ProductBundleVariant, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // When pricing type changes, clear other pricing fields to avoid confusion
      if (field === 'pricing_type') {
        if (value === 'percentage_discount') {
          updated.fixed_price = undefined;
          updated.fixed_discount = undefined;
          if (!updated.discount_percentage) {
            updated.discount_percentage = 10;
          }
        } else if (value === 'fixed_price') {
          updated.discount_percentage = undefined;
          updated.fixed_discount = undefined;
        } else if (value === 'fixed_discount') {
          updated.discount_percentage = undefined;
          updated.fixed_price = undefined;
        }
      }
      
      return updated;
    });
  };

  const moveVariant = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      // Swap with previous
      const variant1 = variants[index];
      const variant2 = variants[index - 1];
      updateMutation.mutate({
        id: variant1.id!,
        data: { sort_order: variant2.sort_order },
      });
      updateMutation.mutate({
        id: variant2.id!,
        data: { sort_order: variant1.sort_order },
      });
    } else if (direction === 'down' && index < variants.length - 1) {
      // Swap with next
      const variant1 = variants[index];
      const variant2 = variants[index + 1];
      updateMutation.mutate({
        id: variant1.id!,
        data: { sort_order: variant2.sort_order },
      });
      updateMutation.mutate({
        id: variant2.id!,
        data: { sort_order: variant1.sort_order },
      });
    }
  };

  const getSavings = (variant: ProductBundleVariant) => {
    const originalPrice = productPrice * variant.quantity;
    const bundlePrice = variant.calculated_price || 0;
    return originalPrice - bundlePrice;
  };

  const getSavingsPercentage = (variant: ProductBundleVariant) => {
    const originalPrice = productPrice * variant.quantity;
    if (originalPrice <= 0) return 0;
    const savings = getSavings(variant);
    return Math.round((savings / originalPrice) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bundle Variants</h3>
          <p className="text-sm text-gray-600">
            Create quantity-based bundles with special pricing for this product
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              console.log('Closing form');
              resetForm();
            } else {
              console.log('Opening form');
              setShowForm(true);
              setEditingVariant(null);
            }
          }}
          className="flex items-center gap-2"
        >
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              Add Bundle Variant
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bundle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Pack of 3 Books"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="e.g., BOOK-001-PACK3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity per Bundle <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                min="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Number of items in this bundle</p>
            </div>

            {/* Pricing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pricing_type}
                onChange={(e) => handleInputChange('pricing_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="percentage_discount">Percentage Discount</option>
                <option value="fixed_price">Fixed Bundle Price</option>
                <option value="fixed_discount">Fixed Discount Amount</option>
              </select>
            </div>

          </div>

          {/* Pricing Value - Full width section with conditional rendering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.pricing_type === 'percentage_discount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.discount_percentage || ''}
                  onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Discount percentage (0-100%)</p>
              </div>
            )}

            {formData.pricing_type === 'fixed_price' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Bundle Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.fixed_price || ''}
                  onChange={(e) => handleInputChange('fixed_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Total price for the bundle</p>
              </div>
            )}

            {formData.pricing_type === 'fixed_discount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Discount Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.fixed_discount || ''}
                  onChange={(e) => handleInputChange('fixed_discount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Amount to discount from total</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Stock Management Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Management <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stock_management_type}
                onChange={(e) => handleInputChange('stock_management_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="use_main_product">Use Main Product Stock</option>
                <option value="separate_stock">Separate Stock</option>
              </select>
            </div>

            {/* Stock Quantity (if separate stock) */}
            {formData.stock_management_type === 'separate_stock' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Number of bundles available</p>
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Active (Visible on storefront)
              </label>
            </div>
          </div>

          {/* Price Preview */}
          {calculatedPrice !== null && formData.quantity && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Price Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Original Price:</span>
                  <span className="font-semibold text-blue-900 ml-2">
                    ₹{(productPrice * formData.quantity).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Bundle Price:</span>
                  <span className="font-semibold text-blue-900 ml-2">
                    ₹{calculatedPrice.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Savings:</span>
                  <span className="font-semibold text-green-600 ml-2">
                    ₹{(productPrice * formData.quantity - calculatedPrice).toFixed(2)} (
                    {Math.round(((productPrice * formData.quantity - calculatedPrice) / (productPrice * formData.quantity)) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingVariant ? 'Update Bundle Variant' : 'Create Bundle Variant'}
            </Button>
            <Button
              variant="secondary"
              onClick={resetForm}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No bundle variants created yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Bundle Variant" to create quantity-based bundles
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bundle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {variants.map((variant: ProductBundleVariant, index: number) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                      <div className="text-xs text-gray-500">{variant.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {variant.quantity} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{variant.calculated_price?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-gray-500 line-through">
                      ₹{(productPrice * variant.quantity).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {getSavingsPercentage(variant)}% off
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.stock_management_type === 'use_main_product'
                      ? `Uses main (${Math.floor(productStock / variant.quantity)} bundles)`
                      : `${variant.stock_quantity} bundles`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        variant.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {variant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => moveVariant(index, 'up')}
                          className="text-gray-400 hover:text-gray-600"
                          title="Move up"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}
                      {index < variants.length - 1 && (
                        <button
                          onClick={() => moveVariant(index, 'down')}
                          className="text-gray-400 hover:text-gray-600"
                          title="Move down"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(variant)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id!)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Bundle Variants Guide</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Create quantity-based bundles (e.g., "Pack of 3", "Pack of 5")</li>
          <li>• Choose pricing strategy: percentage discount, fixed price, or fixed discount</li>
          <li>• Manage stock separately or use main product stock</li>
          <li>• Bundles appear as options on the product page for customers</li>
        </ul>
      </div>
    </div>
  );
};

export default BundleVariantManager;

