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
} from '@heroicons/react/24/outline';
import { productsApi, categoriesApi, brandsApi } from '../../api';
import { Table, Button, Input, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Product, FilterOptions, TableColumn } from '../../types';
import { format } from 'date-fns';

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
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
            {record.images && record.images.length > 0 ? (
              <img
                src={record.images[0].image_url || record.images[0].image_path}
                alt={record.images[0].alt_text || record.name || record.title}
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500">No Image</span>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.name || value}</div>
            <div className="text-sm text-gray-500">{record.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      render: (_, record) => record.category?.name || 'N/A',
    },
    {
      key: 'brand',
      title: 'Brand',
      render: (_, record) => record.brand?.name || 'N/A',
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium">{formatCurrency(value)}</div>
          {record.sale_price && (
            <div className="text-sm text-red-600">{formatCurrency(record.sale_price)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'stock_quantity',
      title: 'Stock',
      sortable: true,
      render: (value, record) => getStockBadge(value, record.manage_stock),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Link to={`/products/${record.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/products/${record.id}/edit`}>
            <Button variant="ghost" size="sm">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(record.id)}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
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