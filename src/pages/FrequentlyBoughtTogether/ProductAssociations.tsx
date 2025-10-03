import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { productAssociationsApi, productsApi } from '../../api';
import { Table, Button, Input, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { TableColumn } from '../../types';

interface Association {
  id: number;
  product_id: number;
  associated_product_id: number;
  frequency: number;
  confidence_score: number;
  product?: {
    id: number;
    title: string;
    sku: string;
  };
  associated_product?: {
    id: number;
    title: string;
    sku: string;
  };
}

const ProductAssociations: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
    min_confidence: '',
    min_frequency: '',
    sort_by: 'confidence_score',
    sort_order: 'desc',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<Association | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    associated_product_id: '',
    frequency: '1',
    confidence_score: '0.5',
  });

  // Product search states
  const [productSearch, setProductSearch] = useState('');
  const [associatedProductSearch, setAssociatedProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedAssociatedProducts, setSelectedAssociatedProducts] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAssociatedDropdown, setShowAssociatedDropdown] = useState(false);

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: associationsData, isLoading } = useQuery({
    queryKey: ['product-associations', filters],
    queryFn: () => productAssociationsApi.getAssociations(filters),
  });

  const { data: statsData } = useQuery({
    queryKey: ['product-associations-stats'],
    queryFn: productAssociationsApi.getStatistics,
  });

  // Product search queries
  const { data: productSearchResults } = useQuery({
    queryKey: ['product-search', productSearch],
    queryFn: () => productsApi.getProducts({ search: productSearch, per_page: 10 }),
    enabled: productSearch.length > 1,
  });

  const { data: associatedProductSearchResults } = useQuery({
    queryKey: ['associated-product-search', associatedProductSearch],
    queryFn: () => productsApi.getProducts({ search: associatedProductSearch, per_page: 10 }),
    enabled: associatedProductSearch.length > 1,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: productAssociationsApi.deleteAssociation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-associations'] });
      queryClient.invalidateQueries({ queryKey: ['product-associations-stats'] });
      showSuccess('Association deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete association', error.response?.data?.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: productAssociationsApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-associations'] });
      queryClient.invalidateQueries({ queryKey: ['product-associations-stats'] });
      setSelectedIds([]);
      showSuccess('Associations deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete associations', error.response?.data?.message);
    },
  });

  const generateMutation = useMutation({
    mutationFn: productAssociationsApi.generateAssociations,
    onSuccess: (data) => {
      setGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['product-associations'] });
      queryClient.invalidateQueries({ queryKey: ['product-associations-stats'] });

      if (data.async) {
        showSuccess('Association generation started in background. This may take a few minutes.');
      } else {
        showSuccess(`Generated ${data.statistics?.total || 0} associations successfully`);
      }
    },
    onError: (error: any) => {
      setGenerating(false);
      showError('Failed to generate associations', error.response?.data?.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: productAssociationsApi.createAssociation,
    onError: (error: any) => {
      showError('Failed to create association', error.response?.data?.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      productAssociationsApi.updateAssociation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-associations'] });
      queryClient.invalidateQueries({ queryKey: ['product-associations-stats'] });
      setEditingAssociation(null);
      showSuccess('Association updated successfully');
    },
    onError: (error: any) => {
      showError('Failed to update association', error.response?.data?.message);
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingAssociation) {
      setFormData({
        product_id: editingAssociation.product_id.toString(),
        associated_product_id: editingAssociation.associated_product_id.toString(),
        frequency: editingAssociation.frequency.toString(),
        confidence_score: editingAssociation.confidence_score.toString(),
      });
      // Set selected products for display (single product in edit mode)
      if (editingAssociation.product) {
        setSelectedProduct(editingAssociation.product);
        setProductSearch(editingAssociation.product.title || '');
      }
      if (editingAssociation.associated_product) {
        setSelectedAssociatedProducts([editingAssociation.associated_product]);
        setAssociatedProductSearch('');
      }
    } else {
      setFormData({
        product_id: '',
        associated_product_id: '',
        frequency: '1',
        confidence_score: '0.5',
      });
      setSelectedProduct(null);
      setSelectedAssociatedProducts([]);
      setProductSearch('');
      setAssociatedProductSearch('');
    }
  }, [editingAssociation, showCreateModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProductDropdown(false);
      setShowAssociatedDropdown(false);
    };

    if (showProductDropdown || showAssociatedDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProductDropdown, showAssociatedDropdown]);

  const handleGenerate = () => {
    if (window.confirm('This will analyze your order history and generate associations. Continue?')) {
      setGenerating(true);
      generateMutation.mutate({ months: 6, min_orders: 2, async: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      showError('Please select a main product');
      return;
    }

    if (selectedAssociatedProducts.length === 0) {
      showError('Please select at least one associated product');
      return;
    }

    if (editingAssociation) {
      // Edit mode: update single association
      const data = {
        product_id: selectedProduct.id,
        associated_product_id: selectedAssociatedProducts[0].id,
        frequency: parseInt(formData.frequency),
        confidence_score: parseFloat(formData.confidence_score),
      };
      updateMutation.mutate({ id: editingAssociation.id, data });
    } else {
      // Create mode: create multiple associations
      const promises = selectedAssociatedProducts.map((associatedProduct) => {
        const data = {
          product_id: selectedProduct.id,
          associated_product_id: associatedProduct.id,
          frequency: parseInt(formData.frequency),
          confidence_score: parseFloat(formData.confidence_score),
        };
        return createMutation.mutateAsync(data);
      });

      try {
        await Promise.all(promises);
        showSuccess(`Created ${selectedAssociatedProducts.length} associations successfully`);
        setShowCreateModal(false);
        queryClient.invalidateQueries({ queryKey: ['product-associations'] });
        queryClient.invalidateQueries({ queryKey: ['product-associations-stats'] });
      } catch (error: any) {
        showError('Failed to create some associations', error.response?.data?.message);
      }
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setProductSearch(product.name || product.title);
    setShowProductDropdown(false);
    setFormData({ ...formData, product_id: product.id.toString() });
  };

  const handleAssociatedProductSelect = (product: any) => {
    // Check if product is already selected
    if (selectedAssociatedProducts.some(p => p.id === product.id)) {
      showError('This product is already added');
      return;
    }

    // Check if trying to associate with itself
    if (selectedProduct && selectedProduct.id === product.id) {
      showError('Cannot associate a product with itself');
      return;
    }

    // Add to list
    setSelectedAssociatedProducts([...selectedAssociatedProducts, product]);
    setAssociatedProductSearch('');
    setShowAssociatedDropdown(false);
  };

  const handleRemoveAssociatedProduct = (productId: number) => {
    setSelectedAssociatedProducts(selectedAssociatedProducts.filter(p => p.id !== productId));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this association?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected associations?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const getConfidenceBadge = (score: number) => {
    const percentage = (score * 100).toFixed(0);
    if (score >= 0.5) {
      return <Badge variant="success">{percentage}%</Badge>;
    } else if (score >= 0.3) {
      return <Badge variant="warning">{percentage}%</Badge>;
    }
    return <Badge variant="error">{percentage}%</Badge>;
  };

  const stats = statsData?.statistics || {};
  const associations = associationsData?.associations?.data || [];
  const pagination = associationsData?.associations || {};

  const columns: TableColumn<Association>[] = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      render: (value) => `#${value}`,
    },
    {
      key: 'product',
      title: 'Product',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {record.product?.title || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{record.product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'associated_product',
      title: 'Associated Product',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {record.associated_product?.title || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{record.associated_product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'frequency',
      title: 'Frequency',
      sortable: true,
      render: (value) => <span className="font-medium">{value}x</span>,
    },
    {
      key: 'confidence_score',
      title: 'Confidence',
      sortable: true,
      render: (value) => getConfidenceBadge(value),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingAssociation(record)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Associations</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage products that are frequently bought together
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Associations</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total_associations || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">High Confidence</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.high_confidence || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">≥ 50%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Medium Confidence</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">
            {stats.medium_confidence || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">30% - 50%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Avg Confidence</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.average_confidence ? (stats.average_confidence * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Associations'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Create Manual
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-64"
            />
            <Input
              type="number"
              placeholder="Min Confidence (0-1)"
              value={filters.min_confidence}
              onChange={(e) => handleFilterChange('min_confidence', e.target.value)}
              className="w-48"
              min="0"
              max="1"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Min Frequency"
              value={filters.min_frequency}
              onChange={(e) => handleFilterChange('min_frequency', e.target.value)}
              className="w-40"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Table
            data={associations}
            columns={columns}
            pagination={{
              current: pagination.current_page || 1,
              pageSize: pagination.per_page || 20,
              total: pagination.total || 0,
              onChange: (page) => setFilters({ ...filters, page }),
            }}
            onSort={(key, direction) => {
              setFilters({
                ...filters,
                sort_by: key,
                sort_order: direction,
              });
            }}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How to use Product Associations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Generate Associations" to automatically create associations from your order history</li>
          <li>• Associations with confidence ≥ 30% are shown in "Frequently Bought Together"</li>
          <li>• Higher confidence scores indicate stronger product relationships</li>
          <li>• Frequency shows how many times products were purchased together</li>
          <li>• Use "Create Manual" to add custom product pairings</li>
        </ul>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAssociation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAssociation ? 'Edit Association' : 'Create Manual Association'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAssociation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Main Product Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Product *
                </label>
                {selectedProduct && !editingAssociation ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{selectedProduct.name || selectedProduct.title}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {selectedProduct.sku} | ID: {selectedProduct.id}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setProductSearch('');
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search by name, SKU, or ID..."
                      disabled={!!editingAssociation}
                    />
                    {showProductDropdown && productSearchResults?.products?.data && productSearchResults.products.data.length > 0 && (
                      <div
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {productSearchResults.products.data.map((product: any) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{product.name || product.title}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} | ID: {product.id} | ₹{product.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Associated Products Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Associated Products (Frequently Bought Together) *
                </label>

                {/* Display selected products */}
                {selectedAssociatedProducts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selectedAssociatedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name || product.title}</div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku} | ID: {product.id}
                          </div>
                        </div>
                        {!editingAssociation && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssociatedProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input (hidden in edit mode) */}
                {!editingAssociation && (
                  <>
                    <Input
                      value={associatedProductSearch}
                      onChange={(e) => {
                        setAssociatedProductSearch(e.target.value);
                        setShowAssociatedDropdown(true);
                      }}
                      onFocus={() => setShowAssociatedDropdown(true)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search to add more products..."
                      disabled={!!editingAssociation}
                    />
                    {showAssociatedDropdown && associatedProductSearchResults?.products?.data && associatedProductSearchResults.products.data.length > 0 && (
                      <div
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {associatedProductSearchResults.products.data.map((product: any) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAssociatedProductSelect(product)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{product.name || product.title}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} | ID: {product.id} | ₹{product.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!editingAssociation && selectedAssociatedProducts.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {selectedAssociatedProducts.length} product{selectedAssociatedProducts.length > 1 ? 's' : ''} added. Keep searching to add more.
                  </p>
                )}
              </div>

              {editingAssociation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Products cannot be changed when editing. Only frequency and confidence score can be updated.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many times bought together
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence Score *
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.confidence_score}
                    onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
                    placeholder="0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0.5+ = High, 0.3-0.5 = Medium
                  </p>
                </div>
              </div>

              {!editingAssociation && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> You can add multiple associated products! Each one will be linked to the main product with the same frequency and confidence score.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAssociation
                    ? 'Update Association'
                    : `Create ${selectedAssociatedProducts.length} Association${selectedAssociatedProducts.length > 1 ? 's' : ''}`
                  }
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAssociation(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAssociations;
