import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  ChartBarIcon,
  StarIcon,
  PhotoIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { productsApi, bundleVariantsApi } from '../../api';
import { Button, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { format } from 'date-fns';
import { ProductBundleVariant } from '../../types';
import { getFullImageUrl } from '../../utils/imageUrl';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('details');

  // Fetch product data
  const { data: productResponse, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(Number(id)),
    enabled: !!id,
  });

  // Fetch bundle variants
  const { data: bundleVariantsData } = useQuery({
    queryKey: ['bundleVariants', id],
    queryFn: () => bundleVariantsApi.getAll(Number(id)),
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteProduct(Number(id)),
    onSuccess: () => {
      showSuccess('Product deleted successfully');
      navigate('/products');
    },
    onError: (error: any) => {
      showError('Failed to delete product', error.response?.data?.message);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const product = productResponse?.product;
  const analytics = productResponse?.analytics;
  const bundleVariants = bundleVariantsData?.bundle_variants || [];

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/products" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  const getStockBadge = () => {
    if (!product.manage_stock) return <Badge variant="info">Stock Not Managed</Badge>;
    if (product.stock_quantity === 0) return <Badge variant="error">Out of Stock</Badge>;
    if (product.stock_quantity < 10) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const tabs = [
    { id: 'details', name: 'Details', icon: TagIcon },
    { id: 'inventory', name: 'Inventory', icon: CubeIcon },
    { id: 'bundle-variants', name: 'Bundle Variants', icon: Squares2X2Icon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'reviews', name: 'Reviews', icon: StarIcon },
    { id: 'images', name: 'Images', icon: PhotoIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/products"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/products/${id}/edit`}>
                <Button variant="outline">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={deleteMutation.isPending}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{product.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <p className="mt-1 text-sm text-gray-900">{product.brand || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <p className="mt-1 text-sm text-gray-900">{product.author || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(product.created_at), 'PPP')}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <div 
                className="text-sm text-gray-700 prose prose-sm max-w-none admin-product-description"
                dangerouslySetInnerHTML={{
                  __html: product.description || 'No description available'
                }}
              />
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Regular Price</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(parseFloat(product.price))}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compare Price</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {product.compare_price ? formatCurrency(parseFloat(product.compare_price)) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {product.cost_price ? formatCurrency(parseFloat(product.cost_price)) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={product.is_featured}
                    disabled
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={product.is_bestseller}
                    disabled
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Bestseller</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={product.is_digital}
                    disabled
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Digital Product</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Inventory Management</h3>
              {getStockBadge()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">{product.stock_quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">{product.min_stock_level}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manage Stock</label>
                <p className="mt-1 text-sm text-gray-900">
                  {product.manage_stock ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight</label>
                <p className="mt-1 text-sm text-gray-900">{product.weight || 'N/A'} kg</p>
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Product Variants</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Variant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.variants.map((variant: any) => (
                        <tr key={variant.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(variant.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.stock_quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bundle-variants' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bundle Variants</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Quantity-based bundle options for this product
                </p>
              </div>
              <Link to={`/products/${id}/edit`}>
                <Button variant="outline">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Manage Bundles
                </Button>
              </Link>
            </div>

            {bundleVariants.length > 0 ? (
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
                        Pricing
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bundleVariants.map((variant: ProductBundleVariant) => {
                      const originalPrice = parseFloat(product.price) * variant.quantity;
                      const bundlePrice = variant.calculated_price || 0;
                      const savings = originalPrice - bundlePrice;
                      const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
                      
                      return (
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
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {variant.pricing_type === 'percentage_discount' && `${variant.discount_percentage}% off`}
                              {variant.pricing_type === 'fixed_price' && 'Fixed Price'}
                              {variant.pricing_type === 'fixed_discount' && `₹${variant.fixed_discount} off`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(bundlePrice)}
                              </div>
                              <div className="text-xs text-gray-500 line-through">
                                {formatCurrency(originalPrice)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {savingsPercent}% off
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.stock_management_type === 'use_main_product'
                              ? `Uses main stock`
                              : `${variant.stock_quantity} bundles`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={variant.is_active ? 'success' : 'default'}>
                              {variant.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No bundle variants created</p>
                <p className="text-sm text-gray-400 mb-4">
                  Create quantity-based bundles to offer special pricing
                </p>
                <Link to={`/products/${id}/edit`}>
                  <Button>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Add Bundle Variants
                  </Button>
                </Link>
              </div>
            )}

            {/* Info box */}
            {bundleVariants.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Bundle Variants Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Total Bundles:</span>
                    <span className="ml-2">{bundleVariants.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Active Bundles:</span>
                    <span className="ml-2">{bundleVariants.filter((v: ProductBundleVariant) => v.is_active).length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Best Savings:</span>
                    <span className="ml-2">
                      {Math.max(...bundleVariants.map((v: ProductBundleVariant) => {
                        const original = parseFloat(product.price) * v.quantity;
                        const bundle = v.calculated_price || 0;
                        return original > 0 ? Math.round(((original - bundle) / original) * 100) : 0;
                      }), 0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CurrencyRupeeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.sales_data?.total_revenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Sold</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.sales_data?.total_sold || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <StarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.performance_metrics?.average_rating || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">View Count</span>
                    <span className="text-sm font-medium">{analytics.performance_metrics?.view_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-sm font-medium">{analytics.performance_metrics?.conversion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wishlist Count</span>
                    <span className="text-sm font-medium">{analytics.performance_metrics?.wishlist_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Return Rate</span>
                    <span className="text-sm font-medium">{analytics.performance_metrics?.return_rate || 0}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Inventory Levels</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Stock</span>
                    <span className="text-sm font-medium">{analytics.inventory_levels?.current_stock || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reserved Stock</span>
                    <span className="text-sm font-medium">{analytics.inventory_levels?.reserved_stock || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available Stock</span>
                    <span className="text-sm font-medium">{analytics.inventory_levels?.available_stock || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
              <div className="flex items-center space-x-2">
                <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold">{product.rating || 0}/5</span>
                <span className="text-sm text-gray-500">({product.reviews_count || 0} reviews)</span>
              </div>
            </div>

            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</span>
                          <div className="ml-4 flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {format(new Date(review.created_at), 'PPP')}
                        </p>
                      </div>
                      <Badge variant={review.status === 'approved' ? 'success' : 'warning'}>
                        {review.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No reviews yet</p>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>

            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image: any) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getFullImageUrl(image.image_url) || getFullImageUrl(image.url) || '/placeholder-image.png'}
                      alt={image.alt_text || image.alt || product.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png';
                      }}
                    />
                    {image.is_primary && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No images uploaded</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;