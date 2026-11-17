import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import {
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  FileCode,
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Image,
  Copy,
  ExternalLink,
  Rss,
  Globe,
  Link2,
  ScrollText
} from 'lucide-react';

import { adminApi } from '../../services/adminApi';
import { cn } from '../../utils/cn';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import TablePagination from '../../components/TablePagination';
import Input, { Textarea, Select, SearchInput } from '../../components/Input';
import Modal, { ConfirmModal } from '../../components/Modal';
import { EmptyState } from '../../components/Card';
import { SkeletonTable } from '../../components/Skeleton';
import type { TableColumn } from '../../types';

interface ProductCollection {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  type: 'manual' | 'rule_based';
  is_active: boolean;
  product_count: number;
  product_ids: number[];
  rules: any[];
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  category_name?: string;
  image_url?: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Rule {
  field: string;
  operator: string;
  value: any;
}

interface FeedFile {
  key: string;
  label: string;
  icon: React.ReactNode;
  name: string;
  ext: string;
}

const REASON_LABELS: Record<string, string> = {
  inactive: 'Inactive',
  no_price: 'No price',
  no_image: 'No image',
  no_slug: 'No link',
};

const FEED_FILES: FeedFile[] = [
  { key: 'google-shopping.xml', label: 'Google Shopping XML', icon: <Globe className="h-4 w-4 text-blue-600" />, name: 'google-shopping', ext: 'xml' },
  { key: 'google-shopping.json', label: 'Google Shopping JSON', icon: <FileCode className="h-4 w-4 text-green-600" />, name: 'google-shopping', ext: 'json' },
  { key: 'facebook-catalog.xml', label: 'Facebook Catalog XML', icon: <ShoppingBag className="h-4 w-4 text-indigo-600" />, name: 'facebook-catalog', ext: 'xml' },
  { key: 'facebook-catalog.json', label: 'Facebook Catalog JSON', icon: <FileCode className="h-4 w-4 text-green-600" />, name: 'facebook-catalog', ext: 'json' },
  { key: 'rss.xml', label: 'RSS XML', icon: <Rss className="h-4 w-4 text-orange-600" />, name: 'rss', ext: 'xml' },
];

const ProductCollections: React.FC = () => {
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [showRuleBasedModal, setShowRuleBasedModal] = useState(false);
  const [showFeedUrlsModal, setShowFeedUrlsModal] = useState(false);
  const [modalCollection, setModalCollection] = useState<ProductCollection | null>(null);

  const [copiedFeedKey, setCopiedFeedKey] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual' as 'manual' | 'rule_based',
    is_active: true,
    rules: [] as Rule[],
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });

  // Debounce the search so typing doesn't hammer the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const { data: collectionsData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['product-collections', debouncedSearch, filterType, page],
    queryFn: async () => {
      const params: any = { page, per_page: 20 };
      if (filterType) params.type = filterType;
      if (debouncedSearch) params.search = debouncedSearch;
      const response = await adminApi.getProductCollections(params);
      return response.data;
    },
  });

  const collections: ProductCollection[] = collectionsData?.data || [];
  const paginationMeta = collectionsData?.meta;

  // Live rule preview: shows how many products a rule set resolves to before
  // it is saved, so an operator never ships an empty/short ad feed.
  const [debouncedRules, setDebouncedRules] = useState<Rule[]>([]);
  useEffect(() => {
    if (!showEditModal || formData.type !== 'rule_based') return;
    const timer = setTimeout(() => setDebouncedRules(formData.rules), 400);
    return () => clearTimeout(timer);
  }, [formData.rules, formData.type, showEditModal]);

  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ['collection-preview', JSON.stringify(debouncedRules)],
    queryFn: async () => {
      const response = await adminApi.previewProductCollection({
        type: 'rule_based',
        rules: debouncedRules,
      });
      return response.data?.data;
    },
    enabled: showEditModal && formData.type === 'rule_based' && debouncedRules.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCollection) {
        return adminApi.updateProductCollection(editingCollection.id, data);
      }
      return adminApi.createProductCollection(data);
    },
    onSuccess: (response) => {
      toast.success(response.data.message || 'Collection saved successfully');
      queryClient.invalidateQueries({ queryKey: ['product-collections'] });
      closeEditModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save collection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => adminApi.deleteProductCollection(id),
    onSuccess: () => {
      toast.success('Collection deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['product-collections'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete collection');
    },
  });

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      type: 'manual',
      is_active: true,
      rules: [],
    });
  };

  const openEditModal = (collection: ProductCollection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      type: collection.type,
      is_active: collection.is_active,
      rules: collection.rules || [],
    });
    setShowEditModal(true);
  };

  const openManualModal = (collection: ProductCollection) => {
    setModalCollection(collection);
    setShowManualModal(true);
  };

  const openRuleBasedModal = (collection: ProductCollection) => {
    setModalCollection(collection);
    setShowRuleBasedModal(true);
  };

  const openFeedUrlsModal = (collection: ProductCollection) => {
    setModalCollection(collection);
    setShowFeedUrlsModal(true);
  };

  const closeManualModal = () => {
    setShowManualModal(false);
    setModalCollection(null);
  };

  const closeRuleBasedModal = () => {
    setShowRuleBasedModal(false);
    setModalCollection(null);
  };

  const closeFeedUrlsModal = () => {
    setShowFeedUrlsModal(false);
    setModalCollection(null);
    setCopiedFeedKey(null);
  };

  const handleCopyFeedUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFeedKey(key);
      toast.success('Feed URL copied to clipboard');
      setTimeout(() => setCopiedFeedKey(null), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      product_ids: formData.type === 'manual' ? (editingCollection?.product_ids || []) : [],
    });
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id !== null) {
      deleteMutation.mutate(deleteConfirm.id);
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, { field: 'category_id', operator: 'in', value: [] }],
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const { data: editCategoriesData } = useQuery({
    queryKey: ['available-categories-for-edit'],
    queryFn: async () => {
      const response = await adminApi.getAvailableCategories();
      return response.data?.data || [];
    },
    enabled: showEditModal && formData.type === 'rule_based',
  });
  const availableCategories = useMemo<Category[]>(
    () => (Array.isArray(editCategoriesData) ? editCategoriesData : []),
    [editCategoriesData]
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge variant="default">Manual</Badge>;
      case 'rule_based':
        return <Badge variant="info">Rule Based</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const getStatusBadge = (active: boolean) => {
    return active
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  const columns = useMemo<TableColumn<ProductCollection>[]>(() => [
    {
      key: 'name',
      title: 'Collection',
      width: 320,
      render: (_: any, collection: ProductCollection) => (
        <div className="flex items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
            {collection.type === 'manual' ? (
              <Tag className="h-5 w-5 text-indigo-600" />
            ) : (
              <FileCode className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="ml-4 min-w-0">
            <div className="truncate text-sm font-medium text-gray-900">{collection.name}</div>
            <div className="truncate text-xs text-gray-500">
              {collection.description || `/feeds/collections/${collection.slug}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      width: 120,
      render: (value: string) => getTypeBadge(value),
    },
    {
      key: 'product_count',
      title: 'Products',
      width: 110,
      align: 'right',
      render: (value: number) => (
        <span className="tabular-nums font-medium text-gray-900">{value ?? 0}</span>
      ),
    },
    {
      key: 'is_active',
      title: 'Status',
      width: 110,
      align: 'center',
      render: (value: boolean) => getStatusBadge(value),
    },
    {
      key: 'updated_at',
      title: 'Updated',
      width: 130,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 168,
      align: 'right',
      sticky: 'right',
      render: (_: any, collection: ProductCollection) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openFeedUrlsModal(collection)} title="Feed URLs" aria-label="Feed URLs">
            <Link2 className="h-4 w-4" />
          </Button>
          {collection.type === 'manual' ? (
            <Button variant="ghost" size="sm" onClick={() => openManualModal(collection)} title="Manage products" aria-label="Manage products">
              <ShoppingBag className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => openRuleBasedModal(collection)} title="View rules" aria-label="View rules">
              <ScrollText className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openEditModal(collection)} title="Edit" aria-label="Edit">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(collection.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Product Collections</h1>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading collections</h3>
              <div className="mt-2 text-sm text-red-700">
                Failed to load product collections. Please try again.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Collections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create curated product collections for targeted ad campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowEditModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="w-full max-w-md"
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: '', label: 'All Types' },
            { value: 'manual', label: 'Manual' },
            { value: 'rule_based', label: 'Rule Based' },
          ]}
          containerClassName="w-full sm:w-44"
        />
        <div className="text-sm text-gray-500 sm:ml-auto">
          {paginationMeta?.total != null
            ? `${paginationMeta.total} collection${paginationMeta.total === 1 ? '' : 's'}`
            : null}
        </div>
      </div>

      {/* Collections Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : collections.length === 0 ? (
        <div className="rounded-lg bg-white shadow">
          <EmptyState
            icon={<Layers className="h-10 w-10 text-gray-300" />}
            title="No collections found"
            description={
              debouncedSearch || filterType
                ? 'No collection matches the current filters.'
                : 'Create your first collection to start building ad feeds.'
            }
            action={
              <Button onClick={() => setShowEditModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            }
          />
        </div>
      ) : (
        <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
          <Table
            data={collections}
            columns={columns}
            fixedLayout
            minWidth={958}
            emptyMessage="No collections found"
            rowClassName={(collection: ProductCollection) => (collection.is_active ? "" : "bg-gray-50 text-gray-500")}
          />
          <TablePagination meta={paginationMeta} page={page} onPageChange={setPage} />
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Product Collections</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Product collections let you create targeted groups of products for ad campaigns:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Manual:</strong> Select specific products to include</li>
                <li><strong>Rule Based:</strong> Define conditions (category, price, stock) for automatic inclusion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {/* Create/Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={closeEditModal}
        title={editingCollection ? 'Edit Collection' : 'New Collection'}
        description="Collections drive the per-segment Google / Meta / RSS feeds."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={!formData.name.trim()}
            >
              {editingCollection ? 'Update' : 'Create'} Collection
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Summer Sale Collection"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Describe this collection..."
          />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.type === 'manual'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'manual' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Manual Selection</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.type === 'rule_based'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'rule_based' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Rule Based</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              {formData.type === 'rule_based' && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Rules</label>
                    <Button variant="outline" size="sm" onClick={addRule}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {formData.rules.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No rules defined.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.rules.map((rule, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <select
                              value={rule.field}
                              onChange={(e) => updateRule(index, { field: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="category_id">Category</option>
                              <option value="price">Price</option>
                              <option value="stock_quantity">Stock</option>
                              <option value="has_discount">Has Discount</option>
                              <option value="created_at">Created</option>
                            </select>

                            {rule.field === 'category_id' ? (
                              <select
                                multiple
                                value={rule.value}
                                onChange={(e) => updateRule(index, {
                                  value: Array.from(e.target.selectedOptions, opt => Number(opt.value))
                                })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm col-span-2"
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            ) : rule.field === 'has_discount' ? (
                              <select
                                value={rule.value ? 'true' : 'false'}
                                onChange={(e) => updateRule(index, { value: e.target.value === 'true' })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm col-span-2"
                              >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            ) : (
                              <>
                                <select
                                  value={rule.operator}
                                  onChange={(e) => updateRule(index, { operator: e.target.value })}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                                >
                                  {rule.field === 'price' && (
                                    <>
                                      <option value="less_than">Less than</option>
                                      <option value="greater_than">Greater than</option>
                                    </>
                                  )}
                                  {rule.field === 'stock_quantity' && (
                                    <>
                                      <option value="less_than">Less than</option>
                                      <option value="greater_than">Greater than</option>
                                      <option value="in_stock">In Stock</option>
                                    </>
                                  )}
                                  {rule.field === 'created_at' && (
                                    <option value="days_ago">Days ago</option>
                                  )}
                                </select>
                                <input
                                  type="number"
                                  value={rule.value || ''}
                                  onChange={(e) => updateRule(index, { value: Number(e.target.value) })}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm col-span-2"
                                  placeholder="Value"
                                />
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => removeRule(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {formData.type === 'rule_based' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Live preview</span>
                    {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  </div>
                  {!debouncedRules.length ? (
                    <p className="mt-1 text-xs text-gray-500">Add a rule to see how many products it resolves to.</p>
                  ) : previewData ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant={previewData.eligible > 0 ? 'success' : 'warning'}>
                          {previewData.eligible} feed-eligible
                        </Badge>
                        <span className="text-gray-600">
                          {previewData.total} matched
                          {previewData.excluded > 0 ? ` - ${previewData.excluded} excluded` : ''}
                        </span>
                      </div>
                      {previewData.excluded > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                          {Object.entries(previewData.reasons as Record<string, number>)
                            .filter(([, count]) => count > 0)
                            .map(([reason, count]) => (
                              <span key={reason} className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">
                                {REASON_LABELS[reason] || reason}: {count}
                              </span>
                            ))}
                        </div>
                      )}
                      {previewData.samples?.length > 0 && (
                        <div className="flex gap-2 overflow-hidden pt-1">
                          {previewData.samples.slice(0, 6).map((sample: any) => (
                            <div key={sample.id} className="w-12 shrink-0" title={sample.name}>
                              {sample.image_url ? (
                                <img src={sample.image_url} alt="" className="h-12 w-12 rounded border border-gray-200 object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-gray-300 bg-white">
                                  <Image className="h-4 w-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

      </Modal>

      {/* Manual Products Modal */}
      {showManualModal && modalCollection && (
        <ManualProductsModal
          collection={modalCollection}
          onClose={closeManualModal}
        />
      )}

      {/* Rule-Based Modal */}
      {showRuleBasedModal && modalCollection && (
        <RuleBasedModal
          collection={modalCollection}
          onClose={closeRuleBasedModal}
        />
      )}

      {/* Feed URLs Modal */}
      {showFeedUrlsModal && modalCollection && (
        <FeedUrlsModal
          collection={modalCollection}
          copiedKey={copiedFeedKey}
          onCopy={handleCopyFeedUrl}
          onClose={closeFeedUrlsModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.show}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete collection"
        message="This collection and its feed URLs will stop working immediately. This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

// ============================================================
// Manual Products Modal — auto-save on click, no dirty tracking
// ============================================================
interface ManualProductsModalProps {
  collection: ProductCollection;
  onClose: () => void;
}

const ManualProductsModal: React.FC<ManualProductsModalProps> = ({ collection, onClose }) => {
  const queryClient = useQueryClient();

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(collection.product_ids || []);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'sku'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const productsPerPage = 12;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const { data: availableProductsData, isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-products', debouncedSearch, selectedCategoryFilter, selectedProductIds],
    queryFn: async () => {
      const response = await adminApi.getAvailableProducts({
        search: debouncedSearch,
        exclude_ids: selectedProductIds,
        category_id: selectedCategoryFilter,
      });
      return response.data.data || [];
    },
  });
  const availableProducts = useMemo<Product[]>(
    () => availableProductsData || [],
    [availableProductsData]
  );

  const { data: selectedProductsData, isLoading: loadingSelected } = useQuery({
    queryKey: ['collection-products', collection.id],
    queryFn: async () => {
      const response = await adminApi.getProductCollection(collection.id);
      return response.data.data.products || [];
    },
  });
  const selectedProducts: Product[] = selectedProductsData || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['available-categories'],
    queryFn: async () => {
      const response = await adminApi.getAvailableCategories();
      return response.data?.data || [];
    },
  });
  const availableCategories = useMemo<Category[]>(
    () => (Array.isArray(categoriesData) ? categoriesData : []),
    [categoriesData]
  );

  const addMutation = useMutation({
    mutationFn: (productIds: number[]) => adminApi.addProductsToCollection(collection.id, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-products', collection.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add products');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productIds: number[]) => adminApi.removeProductsFromCollection(collection.id, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-products', collection.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove products');
    },
  });

  const handleAdd = (product: Product) => {
    setSelectedProductIds(prev => [...prev, product.id]);
    setPendingIds(prev => new Set(prev).add(product.id));
    addMutation.mutate([product.id], {
      onSettled: () => {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      },
    });
  };

  const handleRemove = (productId: number) => {
    setSelectedProductIds(prev => prev.filter(id => id !== productId));
    setPendingIds(prev => new Set(prev).add(productId));
    removeMutation.mutate([productId], {
      onSettled: () => {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      },
    });
  };

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = [...availableProducts];
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = Number(a.price) - Number(b.price);
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return filtered;
  }, [availableProducts, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Manage Products</h2>
            <p className="text-sm text-gray-500">{collection.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Available Products */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Available Products</h3>
                <span className="text-xs text-gray-500">{filteredAndSortedProducts.length} products</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategoryFilter || ''}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value ? Number(e.target.value) : null);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low-High)</option>
                  <option value="price-desc">Price (High-Low)</option>
                  <option value="sku-asc">SKU (A-Z)</option>
                  <option value="sku-desc">SKU (Z-A)</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {paginatedProducts.map(product => {
                    const isPending = pendingIds.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                        onClick={() => !isPending && handleAdd(product)}
                      >
                        <div className="flex items-start gap-3">
                          {product.image_url ? (
                            <div className="relative h-12 w-12 rounded flex-shrink-0 overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 hidden bg-gray-200 rounded flex items-center justify-center">
                                <Image className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              SKU: {product.sku}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.category_name}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">
                              ₹{Number(product.price).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="p-3 border-t flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * productsPerPage + 1} to {Math.min(currentPage * productsPerPage, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Selected Products */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Products
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  {selectedProductIds.length}
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingSelected && selectedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                  <p className="text-sm">Loading selected products...</p>
                </div>
              ) : selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No products selected</p>
                  <p className="text-xs text-gray-400 mt-1">Click on products to add them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map(product => {
                    const isPending = pendingIds.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className={`p-3 bg-white rounded-lg border flex items-center gap-3 ${
                          isPending ? 'border-indigo-300 opacity-60' : 'border-gray-200'
                        }`}
                      >
                        {product.image_url ? (
                          <div className="relative h-10 w-10 rounded flex-shrink-0 overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="absolute inset-0 hidden bg-gray-200 rounded flex items-center justify-center">
                              <Image className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <Image className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ₹{Number(product.price).toFixed(2)}
                          </div>
                        </div>
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        ) : (
                          <button
                            onClick={() => handleRemove(product.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove from collection"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Rule-Based Modal — read-only view of rules
// ============================================================
interface RuleBasedModalProps {
  collection: ProductCollection;
  onClose: () => void;
}

const RuleBasedModal: React.FC<RuleBasedModalProps> = ({ collection, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Rule-Based Collection</h2>
            <p className="text-sm text-gray-500">{collection.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Automatic Collection</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Products are automatically included based on the rules below. Edit the collection to change the rules.
                </p>
              </div>
            </div>
          </div>

          {collection.rules && collection.rules.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Active Rules ({collection.rules.length})
              </h3>
              <div className="space-y-2">
                {collection.rules.map((rule: Rule, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">IF</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                        {rule.field}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        {rule.operator}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-mono">
                        {typeof rule.value === 'object' ? JSON.stringify(rule.value) : String(rule.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ScrollText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No rules defined</p>
              <p className="text-xs text-gray-400 mt-1">Edit this collection to add rules</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Feed URLs Modal — standalone modal for feed URL copy
// ============================================================
interface FeedUrlsModalProps {
  collection: ProductCollection;
  copiedKey: string | null;
  onCopy: (url: string, key: string) => void;
  onClose: () => void;
}

const FeedUrlsModal: React.FC<FeedUrlsModalProps> = ({ collection, copiedKey, onCopy, onClose }) => {
  const { data: feedStatusData } = useQuery({
    queryKey: ['feed-status'],
    queryFn: async () => {
      const response = await adminApi.getFeedStatus();
      return response.data;
    },
  });
  const frontendUrl: string | undefined = feedStatusData?.data?.frontend_url;

  const { data: eligibility, isFetching: eligibilityLoading } = useQuery({
    queryKey: ['collection-eligibility', collection.id],
    queryFn: async () => {
      const response = await adminApi.getCollectionEligibility(collection.id);
      return response.data?.data;
    },
  });

  const buildUrl = (file: FeedFile): string | null => {
    if (!frontendUrl) return null;
    return `${frontendUrl.replace(/\/$/, '')}/feeds/collections/${collection.slug}/${file.name}.${file.ext}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Feed URLs</h2>
            <p className="text-sm text-gray-500">{collection.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!collection.is_active && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span>This collection is inactive. Activate it to serve feeds.</span>
            </div>
          )}

          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Feed eligibility</span>
              {eligibilityLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {eligibility ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={eligibility.eligible > 0 ? 'success' : 'error'}>
                    {eligibility.eligible} of {eligibility.total} products eligible
                  </Badge>
                  {eligibility.excluded > 0 && (
                    <span className="text-gray-600">{eligibility.excluded} will be skipped</span>
                  )}
                </div>
                {eligibility.excluded > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                    {Object.entries(eligibility.reasons as Record<string, number>)
                      .filter(([, count]) => count > 0)
                      .map(([reason, count]) => (
                        <span key={reason} className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">
                          {REASON_LABELS[reason] || reason}: {count}
                        </span>
                      ))}
                  </div>
                )}
                {eligibility.eligible === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    This feed would be empty. Merchant Center rejects empty catalogs — fix the items above first.
                  </p>
                )}
                {eligibility.samples?.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-hidden">
                    {eligibility.samples.slice(0, 8).map((sample: any) => (
                      <div key={sample.id} className="w-10 shrink-0" title={`${sample.name} — ${REASON_LABELS[sample.reason] || sample.reason}`}>
                        {sample.image_url ? (
                          <img src={sample.image_url} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-gray-300 bg-white">
                            <Image className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              !eligibilityLoading && <p className="mt-1 text-xs text-gray-500">Unable to load eligibility.</p>
            )}
          </div>

          <div className="space-y-3">
            {FEED_FILES.map((file) => {
              const url = buildUrl(file);
              if (!url) {
                return (
                  <div key={file.key} className="flex items-center gap-2 p-2 text-sm text-gray-400">
                    {file.icon}
                    <span className="font-medium">{file.label}</span>
                    <span className="ml-auto">Loading...</span>
                  </div>
                );
              }
              const copyKey = `${collection.slug}-${file.key}`;
              return (
                <div key={file.key} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 w-48 flex-shrink-0">
                    {file.icon}
                    <span className="text-sm font-medium text-gray-700">{file.label}</span>
                  </div>
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 block w-full text-xs border-gray-300 rounded-md bg-gray-50 px-2 py-1.5"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(url, copyKey)}
                    className="p-1"
                    title="Copy URL"
                  >
                    {copiedKey === copyKey ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    className="p-1"
                    title="Open URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCollections;
