import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { bundleDiscountRulesApi } from '../../api';
import { Table, Button, Badge, LoadingSpinner, Input } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { TableColumn } from '../../types';

interface DiscountRule {
  id: number;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_percentage?: number;
  discount_amount?: number;
  min_products?: number;
  max_products?: number;
  category_id?: number;
  customer_tier?: string;
  min_order_value?: number;
  max_discount_cap?: number;
  priority: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  category?: {
    name: string;
  };
}

const BundleDiscountRules: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
    is_active: '',
    discount_type: '',
    sort_by: 'priority',
    sort_order: 'desc',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);
  const [testingRule, setTestingRule] = useState<DiscountRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_percentage: '',
    discount_amount: '',
    min_products: '',
    max_products: '',
    category_id: '',
    customer_tier: '',
    min_order_value: '',
    max_discount_cap: '',
    priority: '10',
    is_active: true,
    valid_from: '',
    valid_until: '',
  });

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['bundle-discount-rules', filters],
    queryFn: () => bundleDiscountRulesApi.getRules(filters),
  });

  const { data: statsData } = useQuery({
    queryKey: ['bundle-discount-rules-stats'],
    queryFn: bundleDiscountRulesApi.getStatistics,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['bundle-categories'],
    queryFn: bundleDiscountRulesApi.getCategories,
  });

  const { data: tiersData } = useQuery({
    queryKey: ['customer-tiers'],
    queryFn: bundleDiscountRulesApi.getCustomerTiers,
  });

  // Mutations
  const deleteRuleMutation = useMutation({
    mutationFn: bundleDiscountRulesApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules-stats'] });
      showSuccess('Rule deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete rule', error.response?.data?.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: bundleDiscountRulesApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules-stats'] });
      showSuccess('Rule status updated');
    },
    onError: (error: any) => {
      showError('Failed to update status', error.response?.data?.message);
    },
  });

  const duplicateRuleMutation = useMutation({
    mutationFn: bundleDiscountRulesApi.duplicateRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules'] });
      showSuccess('Rule duplicated successfully');
    },
    onError: (error: any) => {
      showError('Failed to duplicate rule', error.response?.data?.message);
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: bundleDiscountRulesApi.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules-stats'] });
      setShowCreateModal(false);
      showSuccess('Rule created successfully');
    },
    onError: (error: any) => {
      showError('Failed to create rule', error.response?.data?.message);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      bundleDiscountRulesApi.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-discount-rules-stats'] });
      setEditingRule(null);
      showSuccess('Rule updated successfully');
    },
    onError: (error: any) => {
      showError('Failed to update rule', error.response?.data?.message);
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        description: editingRule.description || '',
        discount_type: editingRule.discount_type,
        discount_percentage: editingRule.discount_percentage?.toString() || '',
        discount_amount: editingRule.discount_amount?.toString() || '',
        min_products: editingRule.min_products?.toString() || '',
        max_products: editingRule.max_products?.toString() || '',
        category_id: editingRule.category_id?.toString() || '',
        customer_tier: editingRule.customer_tier || '',
        min_order_value: editingRule.min_order_value?.toString() || '',
        max_discount_cap: editingRule.max_discount_cap?.toString() || '',
        priority: editingRule.priority.toString(),
        is_active: editingRule.is_active,
        valid_from: editingRule.valid_from || '',
        valid_until: editingRule.valid_until || '',
      });
    } else if (!showCreateModal) {
      setFormData({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_percentage: '',
        discount_amount: '',
        min_products: '',
        max_products: '',
        category_id: '',
        customer_tier: '',
        min_order_value: '',
        max_discount_cap: '',
        priority: '10',
        is_active: true,
        valid_from: '',
        valid_until: '',
      });
    }
  }, [editingRule, showCreateModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      priority: parseInt(formData.priority),
      is_active: formData.is_active,
    };

    // Add discount value
    if (formData.discount_type === 'percentage') {
      data.discount_percentage = parseFloat(formData.discount_percentage);
    } else {
      data.discount_amount = parseFloat(formData.discount_amount);
    }

    // Add optional fields
    if (formData.min_products) data.min_products = parseInt(formData.min_products);
    if (formData.max_products) data.max_products = parseInt(formData.max_products);
    if (formData.category_id) data.category_id = parseInt(formData.category_id);
    if (formData.customer_tier) data.customer_tier = formData.customer_tier;
    if (formData.min_order_value) data.min_order_value = parseFloat(formData.min_order_value);
    if (formData.max_discount_cap) data.max_discount_cap = parseFloat(formData.max_discount_cap);
    if (formData.valid_from) data.valid_from = formData.valid_from;
    if (formData.valid_until) data.valid_until = formData.valid_until;

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: number) => {
    toggleActiveMutation.mutate(id);
  };

  const handleDuplicate = (id: number) => {
    if (window.confirm('Create a copy of this rule?')) {
      duplicateRuleMutation.mutate(id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="error">Inactive</Badge>
    );
  };

  const getDiscountDisplay = (rule: DiscountRule) => {
    if (rule.discount_type === 'percentage') {
      return `${rule.discount_percentage}% off`;
    } else {
      return `₹${rule.discount_amount} off`;
    }
  };

  const stats = statsData?.statistics || {};
  const rules = rulesData?.rules?.data || [];
  const pagination = rulesData?.rules || {};

  const columns: TableColumn<DiscountRule>[] = [
    {
      key: 'name',
      title: 'Rule Name',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {record.description && (
            <div className="text-sm text-gray-500">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'discount_type',
      title: 'Discount',
      render: (_, record) => (
        <div>
          <div className="font-medium">{getDiscountDisplay(record)}</div>
          <div className="text-sm text-gray-500">
            {record.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
          </div>
        </div>
      ),
    },
    {
      key: 'min_products',
      title: 'Products',
      render: (_, record) => {
        if (record.min_products && record.max_products) {
          return `${record.min_products}-${record.max_products}`;
        } else if (record.min_products) {
          return `${record.min_products}+`;
        }
        return 'Any';
      },
    },
    {
      key: 'category',
      title: 'Category',
      render: (_, record) => record.category?.name || 'All',
    },
    {
      key: 'customer_tier',
      title: 'Customer Tier',
      render: (value) => value || 'All',
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      render: (value) => <Badge>{value}</Badge>,
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            onClick={() => setTestingRule(record)}
            className="text-purple-600 hover:text-purple-800"
            title="Test Rule"
          >
            <BeakerIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleActive(record.id)}
            className={`${
              record.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
            }`}
            title={record.is_active ? 'Deactivate' : 'Activate'}
          >
            {record.is_active ? 'Off' : 'On'}
          </button>
          <button
            onClick={() => handleDuplicate(record.id)}
            className="text-blue-600 hover:text-blue-800"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditingRule(record)}
            className="text-gray-600 hover:text-gray-800"
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
        <h1 className="text-2xl font-bold text-gray-900">Bundle Discount Rules</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure dynamic discount rules for product bundles
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Rules</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total_rules || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Active Rules</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.active_rules || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Percentage Rules</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.percentage_rules || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Fixed Amount Rules</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">
            {stats.fixed_rules || 0}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Create Rule
            </Button>
          </div>

          <div className="flex gap-2">
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={filters.discount_type}
              onChange={(e) => setFilters({ ...filters, discount_type: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
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
            data={rules}
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
        <h3 className="font-medium text-blue-900 mb-2">About Bundle Discount Rules</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Rules are applied based on priority (higher number = higher priority)</li>
          <li>• Percentage discounts: Apply a % discount on the total bundle price</li>
          <li>• Fixed amount discounts: Deduct a fixed amount from the bundle price</li>
          <li>• Category and tier filters make rules more targeted</li>
          <li>• Use "Test" to simulate rule application before activating</li>
          <li>• Duplicate rules to create variants for A/B testing</li>
        </ul>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRule ? 'Edit Discount Rule' : 'Create Discount Rule'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRule(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 2-Product Bundle Discount"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    required
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                {formData.discount_type === 'percentage' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage * (%)
                    </label>
                    <Input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount * (₹)
                    </label>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Products
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.min_products}
                    onChange={(e) => setFormData({ ...formData, min_products: e.target.value })}
                    placeholder="e.g., 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Products
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_products}
                    onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Value (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_cap}
                    onChange={(e) => setFormData({ ...formData, max_discount_cap: e.target.value })}
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category ID
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Tier
                  </label>
                  <Input
                    value={formData.customer_tier}
                    onChange={(e) => setFormData({ ...formData, customer_tier: e.target.value })}
                    placeholder="e.g., premium, gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher number = higher priority</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="flex-1">
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRule(null);
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

export default BundleDiscountRules;
