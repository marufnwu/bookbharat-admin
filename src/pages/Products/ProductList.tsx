import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { productsApi, categoriesApi, brandsApi } from '../../api';
import { Table, Button, Input, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Product, FilterOptions, TableColumn } from '../../types';
import { format } from 'date-fns';
import { getFullImageUrl } from '../../utils/imageUrl';

const ProductList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    per_page: 10,
    search: '',
    status: '',
    category_id: undefined,
    brand_id: undefined,
    sort_by: 'created_at',
    sort_direction: 'desc',
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: categoriesApi.getAllCategories,
  });

  const { data: brandsResponse } = useQuery({
    queryKey: ['brands', 'all'],
    queryFn: brandsApi.getAllBrands,
  });

  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Product deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete product', error.response?.data?.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: productsApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts([]);
      showSuccess('Products deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete products', error.response?.data?.message);
    },
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: key,
      sort_direction: direction,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="error">Inactive</Badge>;
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStockBadge = (quantity: number, manageStock: boolean) => {
    if (!manageStock) {
      return <Badge variant="info">Not Managed</Badge>;
    }
    if (quantity === 0) {
      return <Badge variant="error">Out of Stock</Badge>;
    }
    if (quantity < 10) {
      return <Badge variant="warning">Low Stock ({quantity})</Badge>;
    }
    return <Badge variant="success">In Stock ({quantity})</Badge>;
  };

  const getFreeShippingBadge = (product: Product) => {
    if (!product.free_shipping_enabled || product.free_shipping_type === 'none') {
      return null;
    }

    if (product.free_shipping_type === 'all_zones') {
      return (
        <div className="flex items-center text-green-600">
          <TruckIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Free Shipping</span>
        </div>
      );
    }

    const zones = product.free_shipping_zones ?
      (Array.isArray(product.free_shipping_zones) ? product.free_shipping_zones : JSON.parse(product.free_shipping_zones || '[]')) : [];

    if (zones.length > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TruckIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Free ({zones.length} zones)</span>
        </div>
      );
    }

    return null;
  };

  const getRatingStars = (rating: number) => {
    const numericRating = Number(rating) || 0;

    if (!numericRating || numericRating === 0) {
      return (
        <div className="flex items-center text-gray-400">
          <StarIcon className="h-4 w-4 mr-1" />
          <span className="text-xs">No reviews</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="flex items-center text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-4 w-4 ${i < Math.floor(numericRating) ? 'fill-current' : ''}`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600 ml-1">({numericRating.toFixed(1)})</span>
      </div>
    );
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      render: (value) => `#${value}`,
    },
    {
      key: 'title',
      title: 'Product',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {record.images && record.images.length > 0 ? (
              <img
                src={getFullImageUrl(record.images[0].image_url) || getFullImageUrl(record.images[0].image_path) || '/placeholder-image.png'}
                alt={record.images[0].alt_text || record.name || record.title}
                className="h-12 w-12 rounded-lg object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-400">No img</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="font-medium text-gray-900 truncate">{record.name || value}</div>
              {record.is_featured && (
                <Badge variant="warning" size="sm">Featured</Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">SKU: {record.sku}</div>
            <div className="flex items-center space-x-2 mt-1">
              {record.category?.name && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {record.category.name}
                </span>
              )}
              {getFreeShippingBadge(record)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-semibold text-gray-900">{formatCurrency(value)}</div>
          {record.compare_price && Number(record.compare_price) > Number(value) && (
            <div className="text-sm text-gray-500 line-through">{formatCurrency(Number(record.compare_price))}</div>
          )}
          {record.compare_price && Number(record.compare_price) > Number(value) && (
            <div className="text-xs text-green-600">
              {Math.round(((1 - Number(value) / Number(record.compare_price)) * 100))}% off
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      title: 'Rating',
      render: (_, record) => getRatingStars(record.rating || 0),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center space-x-1">
          <Link
            to={`/products/${record.id}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="View product details"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          <Link
            to={`/products/${record.id}/edit`}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Edit product"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(record.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete product"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your product catalog
          </p>
        </div>
        <Link to="/products/create">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                loading={bulkDeleteMutation.isPending}
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">All Categories</option>
                {((categoriesResponse as any)?.data?.data || (categoriesResponse as any)?.data || []).map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.brand_id || ''}
                onChange={(e) => handleFilterChange('brand_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">All Brands</option>
                {((brandsResponse as any)?.data || []).map((brand: any) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per Page
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.per_page}
                onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={(productsResponse as any)?.products?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: filters.page || 1,
            total: (productsResponse as any)?.products?.total || 0,
            pageSize: filters.per_page || 10,
            onChange: handlePageChange,
          }}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};

export default ProductList;