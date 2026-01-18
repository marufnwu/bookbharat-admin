import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Tag, CheckCircle, ShoppingCart, 
  TrendingUp, Calendar, AlertCircle, XCircle, 
  Clock, DollarSign, Percent, Copy, Edit, Trash2, 
  Save, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { couponsApi, categoriesApi } from '../../api';
import CategoryPicker from '../../components/CategoryPicker';
import ProductPicker from '../../components/ProductPicker';
import HelpTooltip from '../../components/HelpTooltip';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  applicable_categories?: number[];
  applicable_products?: number[];
  is_stackable?: boolean;
  first_order_only?: 'yes' | 'no';
  buy_x_get_y_config?: {
    buy_quantity: number;
    get_quantity: number;
    product_id: number | null;
  };
  created_at: string;
  updated_at: string;
}

interface CouponForm {
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  minimum_amount: number;
  maximum_discount: number;
  usage_limit: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_stackable: boolean;
  free_shipping: boolean;
  new_customers_only: boolean;
  applicable_products: number[];
  applicable_categories: number[];
  buy_x_get_y_config?: {
    buy_quantity: number;
    get_quantity: number;
    product_id: number | null;
  };
}

interface CouponStats {
  total_coupons: number;
  active_coupons: number;
  expired_coupons: number;
  total_redeemed: number;
  total_discount_given: number;
  average_discount: number;
}


// ... previous imports ...

// Helper type for Category mapping
interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  children?: CategoryNode[];
}

const Coupons: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');

  // Fetch Categories for Picker Mapping
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: categoriesApi.getCategoryTree,
  });

  const flattenCategories = (cats: CategoryNode[], level = 0): Array<CategoryNode> => {
    let result: Array<CategoryNode> = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const allCategories = flattenCategories(categoriesResponse?.data || categoriesResponse?.categories || []);
  


  const [formData, setFormData] = useState<CouponForm>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: 0,
    user_usage_limit: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
    applicable_categories: [],
    applicable_products: [],
    free_shipping: false,
    new_customers_only: false,
    is_stackable: false,
    buy_x_get_y_config: {
      buy_quantity: 1,
      get_quantity: 1,
      product_id: null,
    },
  });

  const categoryObjects = formData.applicable_categories.map(id => {
      const cat = allCategories.find(c => c.id === id);
      return cat ? {
          id: cat.id.toString(),
          name: cat.name,
          image: cat.image_url || '',
          href: ''
      } : null;
  }).filter((c): c is { id: string; name: string; image: string; href: string } => c !== null);

  // Fetch coupons
  const { data: couponsResponse, isLoading } = useQuery({
    queryKey: ['coupons', searchTerm, filterStatus],
    queryFn: () => couponsApi.getAll({ search: searchTerm, status: filterStatus }),
  });

  // Fetch stats
  const { data: statsResponse } = useQuery({
    queryKey: ['coupon-stats'],
    queryFn: () => couponsApi.getStats(),
  });

  const coupons = couponsResponse?.coupons?.data || [];
  const stats = statsResponse?.stats as CouponStats || {};

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      // Transform data for backend
      const payload = {
        ...data,
        type: data.free_shipping ? 'free_shipping' : (data.type === 'fixed' ? 'fixed_amount' : data.type),
        value: data.free_shipping ? 0 : data.value,
        minimum_order_amount: data.minimum_amount,
        maximum_discount_amount: data.maximum_discount,
        usage_limit_per_customer: data.user_usage_limit,
        starts_at: data.valid_from,
        expires_at: data.valid_until,
        first_order_only: data.new_customers_only ? 'yes' : 'no',
        is_active: data.is_active ? 1 : 0,
        is_stackable: data.is_stackable ? 1 : 0,
        buy_x_get_y_config: data.type === 'buy_x_get_y' ? data.buy_x_get_y_config : undefined,
      };

      if (editingCoupon) {
        return couponsApi.update(editingCoupon.id, payload);
      }
      return couponsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return couponsApi.delete(id);
    },
    onSuccess: () => {
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    },
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return couponsApi.updateStatus(id, active);
    },
    onSuccess: () => {
      toast.success('Coupon status updated');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-generate code if typing description and code is empty
    if (name === 'description' && !formData.code) {
      const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
      setFormData(prev => ({ ...prev, code }));
    }
  };

  const handleBuyXGetYConfigChange = (field: keyof NonNullable<CouponForm['buy_x_get_y_config']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      buy_x_get_y_config: {
        ...prev.buy_x_get_y_config!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || (!formData.free_shipping && !formData.value && formData.type !== 'buy_x_get_y')) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (formData.type === 'buy_x_get_y') {
      if (!formData.buy_x_get_y_config?.buy_quantity || formData.buy_x_get_y_config.buy_quantity <= 0) {
        toast.error('Buy quantity must be greater than 0');
        return;
      }
      if (!formData.buy_x_get_y_config?.get_quantity || formData.buy_x_get_y_config.get_quantity <= 0) {
        toast.error('Get quantity must be greater than 0');
        return;
      }
      if (!formData.buy_x_get_y_config?.product_id) {
        toast.error('Please select a product for Buy X Get Y');
        return;
      }
    }

    saveMutation.mutate(formData);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      type: (coupon.type === 'fixed_amount' ? 'fixed' : coupon.type) as CouponForm['type'],
      value: coupon.value,
      minimum_amount: coupon.minimum_order_amount || 0,
      maximum_discount: coupon.maximum_discount_amount || 0,
      usage_limit: coupon.usage_limit || 0,
      user_usage_limit: coupon.usage_limit_per_customer || 1,
      valid_from: coupon.starts_at,
      valid_until: coupon.expires_at || '',
      is_active: coupon.is_active,
      applicable_categories: coupon.applicable_categories || [],
      applicable_products: coupon.applicable_products || [],
      free_shipping: coupon.type === 'free_shipping',
      new_customers_only: coupon.first_order_only === 'yes',
      is_stackable: coupon.is_stackable || false,
      buy_x_get_y_config: coupon.buy_x_get_y_config || {
        buy_quantity: 1,
        get_quantity: 1,
        product_id: null,
      },
    });
    setShowModal(true);
  };

  const handleDelete = (coupon: Coupon) => {
    if (coupon.usage_count > 0) {
      if (!window.confirm(`This coupon has been used ${coupon.usage_count} times. Are you sure you want to delete it?`)) {
        return;
      }
    }

    if (window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      deleteMutation.mutate(coupon.id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setActiveTab('details');
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimum_amount: 0,
      maximum_discount: 0,
      usage_limit: 0,
      user_usage_limit: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
      applicable_categories: [],
      applicable_products: [],
      free_shipping: false,
      new_customers_only: false,
      is_stackable: false,
      buy_x_get_y_config: {
        buy_quantity: 1,
        get_quantity: 1,
        product_id: null,
      },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.starts_at);
    const validUntil = coupon.expires_at ? new Date(coupon.expires_at) : null;

    if (!coupon.is_active) {
      return { label: 'Disabled', color: 'gray', icon: <XCircle className="h-4 w-4" /> };
    }
    if (now < validFrom) {
      return { label: 'Scheduled', color: 'blue', icon: <Clock className="h-4 w-4" /> };
    }
    if (validUntil && now > validUntil) {
      return { label: 'Expired', color: 'red', icon: <XCircle className="h-4 w-4" /> };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'Exhausted', color: 'orange', icon: <AlertCircle className="h-4 w-4" /> };
    }
    return { label: 'Active', color: 'green', icon: <CheckCircle className="h-4 w-4" /> };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'restrictions', label: 'Restrictions' },
    { id: 'applicability', label: 'Applicability' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Coupons</p>
              <p className="text-2xl font-semibold mt-1">{stats.total_coupons || 0}</p>
            </div>
            <Tag className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Coupons</p>
              <p className="text-2xl font-semibold mt-1">{stats.active_coupons || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Times Redeemed</p>
              <p className="text-2xl font-semibold mt-1">{stats.total_redeemed || 0}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Discount</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(stats.total_discount_given || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon: Coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                          <p className="text-sm font-medium text-gray-700">{coupon.name}</p>
                          {coupon.description && (
                            <p className="text-xs text-gray-500">{coupon.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                             {coupon.type === 'percentage' && (
                                <>
                                  <Percent className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{coupon.value}%</span>
                                </>
                             )}
                             {coupon.type === 'fixed_amount' && (
                                <>
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">₹{coupon.value} off</span>
                                </>
                             )}
                             {coupon.type === 'free_shipping' && <span className="font-medium">Free Shipping</span>}
                             {coupon.type === 'buy_x_get_y' && <span className="font-medium">Buy X Get Y</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {coupon.minimum_order_amount ? `Min. spend: ₹${coupon.minimum_order_amount}` : 'No min. spend'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm">
                            {coupon.usage_count} / {coupon.usage_limit || '∞'}
                          </p>
                          {coupon.usage_limit && (
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(coupon.starts_at).toLocaleDateString()}
                          </p>
                          {coupon.expires_at && (
                            <p className="text-gray-500">
                              to {new Date(coupon.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${status.color === 'green' && 'bg-green-100 text-green-800'}
                          ${status.color === 'red' && 'bg-red-100 text-red-800'}
                          ${status.color === 'blue' && 'bg-blue-100 text-blue-800'}
                          ${status.color === 'orange' && 'bg-orange-100 text-orange-800'}
                          ${status.color === 'gray' && 'bg-gray-100 text-gray-800'}
                        `}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Copy Code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleStatusMutation.mutate({
                              id: coupon.id,
                              active: !coupon.is_active
                            })}
                            className={`p-1 ${
                              coupon.is_active
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            } rounded`}
                            title={coupon.is_active ? 'Disable' : 'Enable'}
                          >
                            {coupon.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No coupons found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'details' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coupon Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coupon Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Summer Sale"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="e.g., New Year Special"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="buy_x_get_y">Buy X Get Y</option>
                      </select>
                    </div>

                    {formData.type === 'buy_x_get_y' ? (
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.buy_x_get_y_config?.buy_quantity || 1}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                buy_x_get_y_config: { ...prev.buy_x_get_y_config!, buy_quantity: parseInt(e.target.value) || 1 }
                              }))}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Get Free</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.buy_x_get_y_config?.get_quantity || 1}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                buy_x_get_y_config: { ...prev.buy_x_get_y_config!, get_quantity: parseInt(e.target.value) || 1 }
                              }))}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                         </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Value <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="value"
                            value={formData.value}
                            onChange={handleInputChange}
                            step={formData.type === 'percentage' ? '1' : '0.01'}
                            max={formData.type === 'percentage' ? '100' : undefined}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <div className="absolute left-3 top-2.5 text-gray-400">
                            {formData.type === 'percentage' ? (
                              <Percent className="h-4 w-4" />
                            ) : (
                              <span className="text-sm">₹</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid From <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="valid_from"
                        value={formData.valid_from}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        name="valid_until"
                        value={formData.valid_until}
                        onChange={handleInputChange}
                        min={formData.valid_from}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      checked={formData.is_stackable}
                      onChange={(e) => setFormData({ ...formData, is_stackable: e.target.checked })}
                    />
                    <label className="text-sm text-gray-700 flex items-center">
                      Is Stackable
                      <HelpTooltip
                        text="If checked, this coupon can be used in combination with other coupons in the same order."
                        className="ml-2"
                      />
                    </label>
                  </div>
                  </div>
                </>
              )}

              {activeTab === 'restrictions' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="minimum_amount"
                          value={formData.minimum_amount}
                          onChange={handleInputChange}
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave 0 for no minimum
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Discount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="maximum_discount"
                          value={formData.maximum_discount}
                          onChange={handleInputChange}
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          disabled={formData.type === 'fixed'}
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Only for percentage discounts
                      </p>
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Total Usage Limit
                          <HelpTooltip text="Maximum number of times this coupon can be used by all customers combined. Leave 0 for unlimited." className="ml-2" />
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.usage_limit}
                          onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Usage Limit Per User
                          <HelpTooltip text="Maximum number of times a single customer can use this coupon. Default is 1." className="ml-2" />
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={formData.user_usage_limit}
                          onChange={(e) => setFormData({ ...formData, user_usage_limit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="free_shipping"
                        checked={formData.free_shipping}
                        onChange={handleInputChange}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Include Free Shipping</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="new_customers_only"
                        checked={formData.new_customers_only}
                        onChange={handleInputChange}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">New Customers Only</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'applicability' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Leave empty to apply coupon to all products. Select specific categories or products to restrict usage.
                    </p>
                  </div>

                  <div>
                    <CategoryPicker
                      label="Applicable Categories"
                      selected={categoryObjects}
                      onChange={(categories) => {
                         const ids = categories.map(c => parseInt(c.id));
                         setFormData(prev => ({ ...prev, applicable_categories: ids }));
                      }}
                      max={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to apply to all categories
                    </p>
                  </div>

                  <div>
                    <ProductPicker
                      label="Applicable Products"
                      selected={formData.applicable_products}
                      onChange={(productIds) => setFormData(prev => ({ ...prev, applicable_products: productIds }))}
                      max={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to apply to all products
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending
                    ? 'Saving...'
                    : editingCoupon
                    ? 'Update Coupon'
                    : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;