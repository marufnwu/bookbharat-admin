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
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { productsApi, categoriesApi, brandsApi } from '../../api';
import { Table, Button, Input, Badge, LoadingSpinner, Card, CardContent, StatusBadge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Product, FilterOptions, TableColumn } from '../../types';
import { computeSeoScore, getSeoScoreColor } from '../../utils/seoScore';
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

  const restoreProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Product restored successfully');
    },
    onError: (error: any) => {
      showError('Failed to restore product', error.response?.data?.message);
    },
  });

  const forceDeleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.forceDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Product permanently deleted');
    },
    onError: (error: any) => {
      showError('Cannot delete product with orders', error.response?.data?.message);
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

  const handleRestoreProduct = (id: number) => {
    restoreProductMutation.mutate(id);
  };

  const handleForceDeleteProduct = (id: number) => {
    if (window.confirm('Permanently delete this product? This cannot be undone and will fail if the product has orders.')) {
      forceDeleteMutation.mutate(id);
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
    const shippingConfig = product.shipping_config;
    if (!shippingConfig?.zones) return null;

    const allFree = ['A','B','C','D','E'].every(z => (shippingConfig.zones?.[z]?.shipping ?? 0) === 0);
    if (!allFree) return null;

    return (
      <div className="flex items-center text-green-600">
        <TruckIcon className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">Free Shipping</span>
      </div>
    );
  };

  const getPreorderBadge = (product: Product) => {
    if (!product.is_preorder) return null;

    return (
      <div className="flex items-center gap-1">
        <Badge variant="purple" size="sm" icon={<CalendarIcon className="h-3 w-3" />}>
          Preorder
        </Badge>
        {product.release_date && (
          <span className="text-xs text-purple-600">
            {new Date(product.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    );
  };

  const getStockDisplay = (product: Product) => {
    if (!product.manage_stock) {
      return <span className="text-gray-400 text-xs">Not managed</span>;
    }
    const qty = product.stock_quantity || 0;
    const reserved = product.reserved_quantity || 0;
    const available = qty - reserved;

    return (
      <div className="text-right">
        <span className={`text-sm font-medium ${qty === 0 ? 'text-red-600' : qty < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
          {qty} in stock
        </span>
        {reserved > 0 && (
          <div className="text-xs text-purple-500">{reserved} reserved</div>
        )}
      </div>
    );
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
      wrap: true,
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
              <div className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]" title={record.name || value}>{record.name || value}</div>
              {(record as any).deleted_at && (
                <Badge variant="error" size="sm">Deleted</Badge>
              )}
              {record.is_featured && (
                <Badge variant="warning" size="sm">Featured</Badge>
              )}
              {getPreorderBadge(record)}
            </div>
            <div className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">SKU: {record.sku}</div>
            <div className="flex items-center flex-wrap gap-1 mt-1">
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
      key: 'seo',
      title: 'SEO',
      render: (_, record) => {
        const p = record as any;
        if (!p.focus_keyword) {
          return (
            <span className="text-xs text-gray-400" title="Add SEO fields by editing this product">
              —
            </span>
          );
        }
        const { score } = computeSeoScore({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          short_description: p.short_description || '',
          meta_title: p.meta_title || '',
          meta_description: p.meta_description || '',
          meta_keywords: p.meta_keywords || '',
          focus_keyword: p.focus_keyword || '',
          images: p.images || [],
        });
        const color = getSeoScoreColor(score);
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${color}20`, color }}
            title={`SEO Score: ${score}/100`}
          >
            {score}
          </span>
        );
      },
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (_, record) => getStockDisplay(record),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => {
        const isDeleted = (record as any).deleted_at;
        return (
          <div className="flex items-center space-x-1">
            {isDeleted ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestoreProduct(record.id)}
                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                  title="Restore product"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleForceDeleteProduct(record.id)}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Permanently delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        );
      },
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
                variant="danger"
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
                <option value="trashed">Deleted (Trash)</option>
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

      {/* Products Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow">
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

      {/* Products Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : ((productsResponse as any)?.products?.data || []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No products found</p>
            </CardContent>
          </Card>
        ) : (
          ((productsResponse as any)?.products?.data || []).map((product: Product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Product Image */}
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getFullImageUrl(product.images[0].image_url) || getFullImageUrl(product.images[0].image_path) || '/placeholder-image.png'}
                        alt={product.images[0].alt_text || product.name || product.title}
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-400">No img</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {product.name || product.title}
                          </h3>
                          {(product as any).deleted_at && (
                            <Badge variant="error" size="sm">Deleted</Badge>
                          )}
                          {product.is_featured && (
                            <Badge variant="warning" size="sm">Featured</Badge>
                          )}
                          {getPreorderBadge(product)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                      </div>
                      <StatusBadge status={product.status as any} size="sm" />
                    </div>

                    {/* Price & Stock */}
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                          <span className="text-xs text-gray-500 line-through ml-1">
                            {formatCurrency(Number(product.compare_price))}
                          </span>
                        )}
                      </div>
                      {getStockBadge(product.stock_quantity || 0, product.manage_stock || false)}
                    </div>

                    {/* Preorder Info for Mobile */}
                    {product.is_preorder && (
                      <div className="mt-2 flex items-center gap-2">
                        {getPreorderBadge(product)}
                      </div>
                    )}

                    {/* Category & Free Shipping */}
                    <div className="mt-2 flex items-center flex-wrap gap-1">
                      {product.category?.name && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {product.category.name}
                        </span>
                      )}
                      {getFreeShippingBadge(product)}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                      {(product as any).deleted_at ? (
                        <>
                          <button
                            onClick={() => handleRestoreProduct(product.id)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                            title="Restore product"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleForceDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Permanently delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Mobile Pagination */}
        {((productsResponse as any)?.products?.total || 0) > (filters.per_page || 10) && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 1) <= 1}
              onClick={() => handlePageChange((filters.page || 1) - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {filters.page || 1} of {Math.ceil(((productsResponse as any)?.products?.total || 0) / (filters.per_page || 10))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 1) >= Math.ceil(((productsResponse as any)?.products?.total || 0) / (filters.per_page || 10))}
              onClick={() => handlePageChange((filters.page || 1) + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;