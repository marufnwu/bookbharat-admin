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
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { productsApi, bundleVariantsApi } from '../../api';
import { Button, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { format } from 'date-fns';
import { Product, ProductBundleVariant } from '../../types';
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

  // Helper function to safely parse free_shipping_zones
  const getParsedShippingZones = (zones: any): string[] => {
    if (Array.isArray(zones)) {
      return zones;
    }
    if (typeof zones === 'string') {
      try {
        return JSON.parse(zones || '[]');
      } catch {
        return [];
      }
    }
    return [];
  };

  const shippingZones = getParsedShippingZones(product?.free_shipping_zones);

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
    if (product.stock_quantity < 10) return <Badge variant="warning">Low Stock ({product.stock_quantity})</Badge>;
    return <Badge variant="success">In Stock ({product.stock_quantity})</Badge>;
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'active':
        return (
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-700 font-medium">Active</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-700 font-medium">Inactive</span>
          </div>
        );
      case 'draft':
        return (
          <div className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-gray-700 font-medium">Draft</span>
          </div>
        );
      default:
        return <Badge>{product.status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const parseDimensions = (product: Product) => {
    // If dimensions string exists, try to parse it
    if (product.dimensions) {
      // Handle both 'x' and '×' as delimiters
      const parts = product.dimensions.includes('×')
        ? product.dimensions.split('×')
        : product.dimensions.split('x');

      if (parts.length === 3) {
        return {
          length: parts[0]?.trim(),
          width: parts[1]?.trim(),
          height: parts[2]?.trim(),
          display: product.dimensions
        };
      }
    }

    return null;
  };

  const getRatingDisplay = () => {
    const rating = Number(product.rating) || 0;
    const reviews = Number(product.review_count) || 0;

    if (rating === 0 && reviews === 0) {
      return (
        <div className="flex items-center text-gray-400">
          <StarIcon className="h-5 w-5 mr-1" />
          <span className="text-sm">No reviews yet</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="flex items-center text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-5 w-5 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
        <span className="ml-1 text-sm text-gray-500">({reviews} reviews)</span>
      </div>
    );
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
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/products"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  {product.is_featured && (
                    <Badge variant="warning" className="text-xs">
                      <StarIcon className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  {product.category?.name && (
                    <span className="text-sm text-gray-400">•</span>
                  )}
                  {product.category?.name && (
                    <p className="text-sm text-gray-500">Category: {product.category.name}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                {getRatingDisplay()}
              </div>
              <Link to={`/products/${id}/edit`}>
                <Button>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TagIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock</p>
              <div className="mt-1">{getStockBadge()}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CubeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Price</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</p>
              {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                <p className="text-xs text-gray-500 line-through">{formatCurrency(Number(product.compare_price))}</p>
              )}
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sales</p>
              <p className="text-lg font-bold text-gray-900">{product.sales_count || 0}</p>
              <p className="text-xs text-gray-500">units sold</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
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
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
        {activeTab === 'details' && (
          <div className="p-6 space-y-8">
            {/* Product Overview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-blue-600" />
                Product Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Product Name</label>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
                      <div className="mt-1">{getStatusBadge()}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</label>
                      <p className="text-sm font-medium text-gray-900">{product.category?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">SKU</label>
                      <p className="text-sm font-medium text-gray-900">{product.sku}</p>
                    </div>
                  </div>

                  {(product.author || product.publisher || product.isbn) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {product.author && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Author</label>
                          <p className="text-sm font-medium text-gray-900">{product.author}</p>
                        </div>
                      )}
                      {product.publisher && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Publisher</label>
                          <p className="text-sm font-medium text-gray-900">{product.publisher}</p>
                        </div>
                      )}
                      {product.isbn && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">ISBN</label>
                          <p className="text-sm font-medium text-gray-900">{product.isbn}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Quick Stats</span>
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900 font-medium">{format(new Date(product.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    {product.pages && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pages</span>
                        <span className="text-gray-900 font-medium">{product.pages}</span>
                      </div>
                    )}
                    {product.language && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Language</span>
                        <span className="text-gray-900 font-medium">{product.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none admin-product-description"
                  dangerouslySetInnerHTML={{
                    __html: product.description || '<p class="text-gray-500 italic">No description available</p>'
                  }}
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Pricing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Selling Price</span>
                    <div className="p-1.5 bg-green-100 rounded">
                      <CurrencyRupeeIcon className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(parseFloat(product.price))}
                  </p>
                </div>

                {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Compare Price</span>
                      <div className="p-1.5 bg-blue-100 rounded">
                        <TagIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-blue-900 line-through">
                      {formatCurrency(parseFloat(product.compare_price))}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {Math.round(((1 - Number(product.price) / Number(product.compare_price)) * 100))}% off
                    </p>
                  </div>
                )}

                {product.cost_price && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700">Cost Price</span>
                      <div className="p-1.5 bg-orange-100 rounded">
                        <CubeIcon className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-orange-900">
                      {formatCurrency(parseFloat(product.cost_price))}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Margin: {Math.round(((Number(product.price) - Number(product.cost_price)) / Number(product.price)) * 100)}%
                    </p>
                  </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Profit</span>
                    <div className="p-1.5 bg-purple-100 rounded">
                      <ChartBarIcon className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  {product.cost_price ? (
                    <>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(Number(product.price) - Number(product.cost_price))}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Per unit
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-purple-600">Set cost price to see profit</p>
                  )}
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
          <div className="p-6 bg-white rounded-lg">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Dimensions</label>
                <p className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const dimensions = parseDimensions(product);
                    return dimensions ? dimensions.display : 'N/A';
                  })()}
                </p>
                {(() => {
                    const dimensions = parseDimensions(product);
                    return dimensions ? (
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                        <span>L: {dimensions.length}cm</span>
                        <span>•</span>
                        <span>W: {dimensions.width}cm</span>
                        <span>•</span>
                        <span>H: {dimensions.height}cm</span>
                      </div>
                    ) : null;
                  })()}
              </div>
            </div>

            {/* Shipping Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Free Shipping</label>
                  <div className="mt-1">
                    {product.free_shipping_enabled && product.free_shipping_type !== 'none' ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-green-600 font-medium">
                          Enabled ({product.free_shipping_type === 'all_zones' ? 'All Zones' : `Zones: ${shippingZones.length > 0 ? shippingZones.join(', ') : 'None'}`})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-500">Not Available</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Quantity for Free Shipping</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product.free_shipping_enabled && product.free_shipping_min_quantity
                      ? `${product.free_shipping_min_quantity} units`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {product.free_shipping_enabled && product.free_shipping_type !== 'none' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Free Shipping Details:</strong>
                    {product.free_shipping_type === 'all_zones'
                      ? ' Free shipping available to all zones (A-E).'
                      : ` Free shipping available to zones: ${shippingZones.length > 0 ? shippingZones.join(', ') : 'None selected'}.`
                    }
                    {product.free_shipping_min_quantity > 1 && ` Requires minimum quantity of ${product.free_shipping_min_quantity} units.`}
                  </p>
                </div>
              )}
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
          </div>
        )}

        {activeTab === 'bundle-variants' && (
          <div className="p-6 bg-white rounded-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Bundle Variants</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Quantity-based bundle options for this product
                  </p>
                </div>
              </div>
              <div>
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
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="p-6 bg-white rounded-lg">
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
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="p-6 bg-white rounded-lg">
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
          </div>
        )}

        {activeTab === 'images' && (
          <div className="p-6 bg-white rounded-lg">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Product Images</h3>

          <div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;