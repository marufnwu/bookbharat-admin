import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Trash2,
  Eye,
  Search,
  Filter,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  X,
  BarChart3,
  FileText,
  MessageSquare,
  Zap,
  CheckSquare,
  Square,
  Download,
  ChevronDown,
  Tag,
  Monitor,
  Smartphone,
  TrendingUp,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  Tag as DiscountTag,
  Plus,
  Edit,
  Save,
  History,
  StickyNote,
  Bell,
  Send,
  Target,
  Users,
  Percent,
  Gift,
  Star,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import ValidationLogs from './ValidationLogs';
import SmsRecoveryManager from './SmsRecoveryManager';
import ABTestingManager from './ABTestingManager';

interface FilterOptions {
  customer_segments: Array<{ value: string; label: string }>;
  device_types: Array<{ value: string; label: string }>;
  sources: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  recovery_email_counts: Array<{ value: number; label: string }>;
  value_ranges: Array<{ value: string; label: string }>;
  sort_options: Array<{ value: string; label: string }>;
}

interface AbandonedCart {
  id: number;
  session_id: string;
  user_id?: number;
  user?: {
    email: string;
    name?: string;
    phone?: string;
  };
  cart_data: any;
  total_amount: number;
  items_count: number;
  currency: string;
  is_abandoned: boolean;
  abandoned_at?: string;
  recovery_email_count: number;
  last_recovery_email_sent?: string;
  status: string;
  recovery_probability: number;
  customer_segment: string;
  device_type?: string;
  source?: string;
  recovery_token?: string;
  last_activity?: string;
  expires_at?: string;
}

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface DiscountCode {
  code: string;
  type: string;
  value: number;
  min_purchase_amount?: number;
  valid_until: string;
  discount_amount: number;
  final_price: number;
}

interface RecoveryTemplate {
  name: string;
  email_subject: string;
  message: string;
  discount_percentage: number;
  follow_up_days: number;
}

interface CartNote {
  id: number;
  notes: string;
  note_type: 'internal' | 'customer_communication' | 'recovery_attempt';
  admin_user?: {
    name: string;
  };
  created_at: string;
}

interface Reminder {
  id: number;
  reminder_type: 'email' | 'sms' | 'phone_call' | 'manual_followup' | 'whatsapp';
  message_content: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'completed';
}

const AbandonedCarts: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'carts' | 'validation' | 'sms' | 'abtesting'>('carts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarts, setSelectedCarts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Enhanced UI states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCartInsightsModal, setShowCartInsightsModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'history' | 'notes' | 'discounts' | 'insights'>('details');

  // Form states
  const [discountForm, setDiscountForm] = useState({
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    valid_days: '7',
    usage_limit: '1',
  });

  const [messageForm, setMessageForm] = useState({
    message_type: 'email',
    subject: '',
    message_content: '',
    send_immediately: true,
    include_discount: false,
  });

  const [scheduleForm, setScheduleForm] = useState({
    reminder_type: 'email',
    scheduled_at: '',
    message_content: '',
  });

  const [notesForm, setNotesForm] = useState({
    notes: '',
    note_type: 'internal' as const,
  });

  // Data states
  const [templates, setTemplates] = useState<Record<string, RecoveryTemplate>>({});
  const [cartHistory, setCartHistory] = useState<any>(null);
  const [cartNotes, setCartNotes] = useState<CartNote[]>([]);
  const [cartDiscounts, setCartDiscounts] = useState<DiscountCode[]>([]);
  const [cartInsights, setCartInsights] = useState<any>(null);

  // Advanced filters state
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
    min_value: '',
    max_value: '',
    customer_segment: '',
    device_type: '',
    source: '',
    min_probability: '',
    max_probability: '',
    status: '',
    min_items: '',
    max_items: '',
    recovery_emails: '',
    sort_by: 'abandoned_at',
    sort_order: 'desc',
  });

  // Fetch filter options
  const { data: filterOptionsData } = useQuery({
    queryKey: ['abandoned-carts-filter-options'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/filter-options');
      return response.data.data as FilterOptions;
    },
  });

  // Build query params from filters
  const buildQueryParams = () => {
    const params: any = { page: currentPage, per_page: 15 };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') {
        params[key] = value;
      }
    });

    return params;
  };

  // Fetch abandoned carts
  const { data: cartsData, isLoading } = useQuery({
    queryKey: ['abandoned-carts', currentPage, filters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await api.get('/abandoned-carts', { params });
      return response.data;
    },
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['abandoned-carts-statistics'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/statistics');
      return response.data;
    },
  });

  const stats = statsData?.data || {};
  const carts = cartsData?.data || [];
  const pagination = cartsData?.pagination || {};
  const filterOptions = filterOptionsData || {} as FilterOptions;

  // Mutations
  const sendEmailMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const response = await api.post(`/abandoned-carts/${cartId}/send-recovery-email`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Recovery email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send recovery email');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const response = await api.delete(`/abandoned-carts/${cartId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Abandoned cart deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete cart');
    },
  });

  const bulkSendEmailsMutation = useMutation({
    mutationFn: async (data: { cart_ids: number[]; email_type?: string }) => {
      const response = await api.post('/abandoned-carts/bulk-send-emails', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send bulk emails');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (cartIds: number[]) => {
      const response = await api.post('/abandoned-carts/bulk-delete', { cart_ids: cartIds });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk delete carts');
    },
  });

  const markAsRecoveredMutation = useMutation({
    mutationFn: async ({ cartId, notes, recoveryMethod }: { cartId: number; notes?: string; recoveryMethod?: string }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/mark-as-recovered`, { notes, recovery_method: recoveryMethod });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cart marked as recovered successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark cart as recovered');
    },
  });

  // Enhanced mutations
  const generateDiscountMutation = useMutation({
    mutationFn: async ({ cartId, formData }: { cartId: number; formData: any }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/generate-discount-code`, formData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Discount code generated successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowDiscountModal(false);
      if (data.data?.discount) {
        setCartDiscounts(prev => [...prev, data.data.discount]);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate discount code');
    },
  });

  const scheduleReminderMutation = useMutation({
    mutationFn: async ({ cartId, formData }: { cartId: number; formData: any }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/schedule-reminder`, formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reminder scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowScheduleModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to schedule reminder');
    },
  });

  const sendPersonalizedMessageMutation = useMutation({
    mutationFn: async ({ cartId, formData }: { cartId: number; formData: any }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/send-personalized-message`, formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowMessageModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const addNotesMutation = useMutation({
    mutationFn: async ({ cartId, formData }: { cartId: number; formData: any }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/add-notes`, formData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Notes added successfully');
      if (data.data?.note) {
        setCartNotes(prev => [data.data.note, ...prev]);
      }
      setNotesForm({ notes: '', note_type: 'internal' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add notes');
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({ cartId, templateName, sendImmediately }: { cartId: number; templateName: string; sendImmediately: boolean }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/apply-recovery-template`, {
        template_name: templateName,
        send_immediately: sendImmediately
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowTemplateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to apply template');
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['recovery-templates'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/recovery-templates');
      return response.data;
    },
  });

  // Update templates when data changes
  useEffect(() => {
    if (templatesData?.data) {
      setTemplates(templatesData.data || {});
    }
  }, [templatesData]);

  // Fetch cart recovery history when modal opens
  const { data: historyData } = useQuery({
    queryKey: ['cart-recovery-history', selectedCart?.id],
    queryFn: async () => {
      if (!selectedCart?.id) return null;
      const response = await api.get(`/abandoned-carts/${selectedCart.id}/recovery-history`);
      return response.data;
    },
    enabled: !!selectedCart?.id && showDetailsModal,
  });

  // Update history data when it changes
  useEffect(() => {
    if (historyData?.data) {
      setCartHistory(historyData.data);
      setCartNotes(historyData.data?.contact_history || []);
      setCartDiscounts(historyData.data?.active_discounts || []);
      setCartInsights(historyData.data?.recovery_insights);
    }
  }, [historyData]);

  // Enhanced event handlers
  const handleViewDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowDetailsModal(true);
    setActiveModalTab('details');
  };

  const handleGenerateDiscount = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowDiscountModal(true);
  };

  const handleScheduleReminder = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowScheduleModal(true);
  };

  const handleSendMessage = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowMessageModal(true);
  };

  const handleAddNotes = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowNotesModal(true);
  };

  const handleViewHistory = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowHistoryModal(true);
  };

  const handleViewInsights = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowCartInsightsModal(true);
  };

  const handleShowTemplates = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowTemplateModal(true);
  };

  // Form submission handlers
  const handleGenerateDiscountSubmit = () => {
    if (!selectedCart) return;
    if (!discountForm.discount_value) {
      toast.error('Please enter discount value');
      return;
    }
    generateDiscountMutation.mutate({
      cartId: selectedCart.id,
      formData: discountForm
    });
  };

  const handleScheduleReminderSubmit = () => {
    if (!selectedCart) return;
    if (!scheduleForm.scheduled_at || !scheduleForm.message_content) {
      toast.error('Please fill all required fields');
      return;
    }
    scheduleReminderMutation.mutate({
      cartId: selectedCart.id,
      formData: scheduleForm
    });
  };

  const handleSendMessageSubmit = () => {
    if (!selectedCart) return;
    if (!messageForm.message_content) {
      toast.error('Please enter message content');
      return;
    }
    if (messageForm.message_type !== 'email' && !messageForm.subject) {
      toast.error('Please enter subject for email');
      return;
    }
    sendPersonalizedMessageMutation.mutate({
      cartId: selectedCart.id,
      formData: messageForm
    });
  };

  const handleAddNotesSubmit = () => {
    if (!selectedCart) return;
    if (!notesForm.notes.trim()) {
      toast.error('Please enter notes');
      return;
    }
    addNotesMutation.mutate({
      cartId: selectedCart.id,
      formData: notesForm
    });
  };

  const handleApplyTemplate = (templateName: string, sendImmediately: boolean = false) => {
    if (!selectedCart) return;
    applyTemplateMutation.mutate({
      cartId: selectedCart.id,
      templateName,
      sendImmediately
    });
  };

  const handleSendEmail = (cartId: number) => {
    if (window.confirm('Send recovery email to this customer?')) {
      sendEmailMutation.mutate(cartId);
    }
  };

  const handleDelete = (cartId: number) => {
    if (window.confirm('Are you sure you want to delete this abandoned cart?')) {
      deleteMutation.mutate(cartId);
    }
  };

  const handleSelectCart = (cartId: number) => {
    setSelectedCarts(prev =>
      prev.includes(cartId)
        ? prev.filter(id => id !== cartId)
        : [...prev, cartId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCarts([]);
    } else {
      setSelectedCarts(carts.map((cart: AbandonedCart) => cart.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkSendEmails = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to send emails to');
      return;
    }

    if (window.confirm(`Send recovery emails to ${selectedCarts.length} selected carts?`)) {
      bulkSendEmailsMutation.mutate({ cart_ids: selectedCarts });
    }
  };

  const handleBulkDelete = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to delete');
      return;
    }

    if (window.confirm(`Delete ${selectedCarts.length} selected abandoned carts?`)) {
      bulkDeleteMutation.mutate(selectedCarts);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      date_from: '',
      date_to: '',
      min_value: '',
      max_value: '',
      customer_segment: '',
      device_type: '',
      source: '',
      min_probability: '',
      max_probability: '',
      status: '',
      min_items: '',
      max_items: '',
      recovery_emails: '',
      sort_by: 'abandoned_at',
      sort_order: 'desc',
    });
    setCurrentPage(1);
  };

  const exportCarts = () => {
    const params = buildQueryParams();
    params.export = 'csv';
    const queryString = new URLSearchParams(params).toString();
    window.open(`/api/v1/abandoned-carts?${queryString}`, '_blank');
  };

  // Get device icon
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return null;
    }
  };

  // Get segment color
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'text-purple-600 bg-purple-100';
      case 'high_value': return 'text-blue-600 bg-blue-100';
      case 'repeat': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Abandoned Carts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and recover abandoned shopping carts ({pagination.total || 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters && <X className="h-4 w-4" />}
          </button>
          <button
            onClick={exportCarts}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'carts', label: 'Carts', icon: ShoppingCart },
          { id: 'validation', label: 'Validation Logs', icon: FileText },
          { id: 'sms', label: 'SMS Recovery', icon: MessageSquare },
          { id: 'abtesting', label: 'AB Testing', icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Carts Tab */}
      {activeTab === 'carts' && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Abandoned</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_abandoned || 0}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.total_value || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 7 Days</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_abandoned || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recovered Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recovered_today || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">VIP Segments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.by_segment?.vip || 0}</p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expired This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.expired_this_week || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Email, session, product..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Value Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                  <input
                    type="number"
                    value={filters.min_value}
                    onChange={(e) => handleFilterChange('min_value', e.target.value)}
                    placeholder="₹0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                  <input
                    type="number"
                    value={filters.max_value}
                    onChange={(e) => handleFilterChange('max_value', e.target.value)}
                    placeholder="₹10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Customer Segment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Segment</label>
                  <select
                    value={filters.customer_segment}
                    onChange={(e) => handleFilterChange('customer_segment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Segments</option>
                    {filterOptions.customer_segments?.map(segment => (
                      <option key={segment.value} value={segment.value}>
                        {segment.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <select
                    value={filters.device_type}
                    onChange={(e) => handleFilterChange('device_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Devices</option>
                    {filterOptions.device_types?.map(device => (
                      <option key={device.value} value={device.value}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses?.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recovery Probability Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Probability %</label>
                  <input
                    type="number"
                    value={filters.min_probability}
                    onChange={(e) => handleFilterChange('min_probability', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Probability %</label>
                  <input
                    type="number"
                    value={filters.max_probability}
                    onChange={(e) => handleFilterChange('max_probability', e.target.value)}
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Items Count Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Items</label>
                  <input
                    type="number"
                    value={filters.min_items}
                    onChange={(e) => handleFilterChange('min_items', e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
                  <input
                    type="number"
                    value={filters.max_items}
                    onChange={(e) => handleFilterChange('max_items', e.target.value)}
                    placeholder="20"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Recovery Email Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Emails</label>
                  <select
                    value={filters.recovery_emails}
                    onChange={(e) => handleFilterChange('recovery_emails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    {filterOptions.recovery_email_counts?.map(count => (
                      <option key={count.value} value={count.value}>
                        {count.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filterOptions.sort_options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <select
                    value={filters.sort_order}
                    onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedCarts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {selectedCarts.length} carts selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkSendEmails}
                    disabled={bulkSendEmailsMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send Emails
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedCarts([])}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            Select
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Segment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Probability
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Abandoned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emails
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carts.map((cart: AbandonedCart) => (
                        <tr key={cart.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectCart(cart.id)}
                              className="flex items-center"
                            >
                              {selectedCarts.includes(cart.id) ?
                                <CheckSquare className="h-4 w-4 text-blue-600" /> :
                                <Square className="h-4 w-4 text-gray-400" />
                              }
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {cart.user?.email || 'Guest'}
                                </div>
                                <div className="text-sm text-gray-500">{cart.session_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{cart.items_count} items</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{cart.total_amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(cart.customer_segment)}`}>
                              {cart.customer_segment?.replace('_', ' ') || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(cart.device_type)}
                              <span className="text-sm text-gray-900">
                                {cart.device_type || 'unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    cart.recovery_probability >= 70 ? 'bg-green-500' :
                                    cart.recovery_probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${cart.recovery_probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {cart.recovery_probability}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.abandoned_at ? new Date(cart.abandoned_at).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{cart.recovery_email_count || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              {/* Primary Actions */}
                              <button
                                onClick={() => handleViewDetails(cart)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Recovery Actions */}
                              <div className="relative group">
                                <button
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="Recovery Actions"
                                >
                                  <Target className="h-4 w-4" />
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 hidden group-hover:block">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleGenerateDiscount(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <DiscountTag className="h-4 w-4 mr-2" />
                                      Generate Discount
                                    </button>
                                    <button
                                      onClick={() => handleShowTemplates(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Apply Template
                                    </button>
                                    <button
                                      onClick={() => handleScheduleReminder(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <Bell className="h-4 w-4 mr-2" />
                                      Schedule Reminder
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Communication Actions */}
                              <div className="relative group">
                                <button
                                  className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                  title="Communication"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 hidden group-hover:block">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleSendMessage(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Message
                                    </button>
                                    <button
                                      onClick={() => handleAddNotes(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <StickyNote className="h-4 w-4 mr-2" />
                                      Add Notes
                                    </button>
                                    <button
                                      onClick={() => handleViewHistory(cart)}
                                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                      <History className="h-4 w-4 mr-2" />
                                      View History
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Standard Email Action */}
                              <button
                                onClick={() => handleSendEmail(cart.id)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                disabled={sendEmailMutation.isPending}
                                title="Send Recovery Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDelete(cart.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                disabled={deleteMutation.isPending}
                                title="Delete Cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {carts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No abandoned carts found matching your criteria</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                        disabled={currentPage === pagination.last_page}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{((currentPage - 1) * pagination.per_page) + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * pagination.per_page, pagination.total)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          {pagination.last_page > 5 && (
                            <>
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                              <button
                                onClick={() => setCurrentPage(pagination.last_page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pagination.last_page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pagination.last_page}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                            disabled={currentPage === pagination.last_page}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Details Modal */}
          {showDetailsModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Cart Recovery Center - {selectedCart.user?.email || 'Guest'}</h2>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Modal Tabs */}
                  <div className="flex gap-4 mt-4">
                    {[
                      { id: 'details', label: 'Cart Details', icon: ShoppingCart },
                      { id: 'history', label: 'Recovery History', icon: History },
                      { id: 'notes', label: 'Notes & Communication', icon: StickyNote },
                      { id: 'discounts', label: 'Discounts', icon: DiscountTag },
                      { id: 'insights', label: 'Insights', icon: Target },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveModalTab(tab.id as any)}
                        className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-2 text-sm ${
                          activeModalTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  {/* Details Tab */}
                  {activeModalTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Cart Information */}
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Cart Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedCart.user?.email || 'Guest'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedCart.user?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Session ID</label>
                              <p className="mt-1 text-sm text-gray-900 font-mono text-xs">{selectedCart.session_id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                              <p className="mt-1 text-sm text-gray-900 font-semibold text-lg">₹{selectedCart.total_amount}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Items Count</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedCart.items_count} items</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Status</label>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(selectedCart.customer_segment)}`}>
                                {selectedCart.status}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Customer Segment</label>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(selectedCart.customer_segment)}`}>
                                {selectedCart.customer_segment?.replace('_', ' ') || 'unknown'}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Device Type</label>
                              <div className="flex items-center gap-2 mt-1">
                                {getDeviceIcon(selectedCart.device_type)}
                                <span className="text-sm text-gray-900">
                                  {selectedCart.device_type || 'unknown'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Recovery Probability</label>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full ${
                                      selectedCart.recovery_probability >= 70 ? 'bg-green-500' :
                                      selectedCart.recovery_probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${selectedCart.recovery_probability}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {selectedCart.recovery_probability}%
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Abandoned At</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {selectedCart.abandoned_at
                                    ? new Date(selectedCart.abandoned_at).toLocaleString()
                                    : '-'}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {selectedCart.last_activity
                                    ? new Date(selectedCart.last_activity).toLocaleString()
                                    : '-'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Recovery Emails Sent</label>
                                <p className="mt-1 text-sm text-gray-900">{selectedCart.recovery_email_count || 0}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Expires At</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {selectedCart.expires_at
                                    ? new Date(selectedCart.expires_at).toLocaleString()
                                    : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cart Items */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Cart Items</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            {Array.isArray(selectedCart.cart_data?.items) ? (
                              <div className="space-y-3">
                                {selectedCart.cart_data.items.map((item: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div className="flex items-center gap-3">
                                      {item.image && (
                                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">{item.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {item.quantity} x ₹{item.price} = ₹{item.quantity * item.price}
                                        </p>
                                        {item.variant && (
                                          <p className="text-xs text-gray-400">Variant: {item.variant}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(selectedCart.cart_data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleGenerateDiscount(selectedCart)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                          >
                            <DiscountTag className="h-4 w-4" />
                            Generate Discount
                          </button>
                          <button
                            onClick={() => handleShowTemplates(selectedCart)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Apply Template
                          </button>
                          <button
                            onClick={() => handleScheduleReminder(selectedCart)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <Bell className="h-4 w-4" />
                            Schedule Reminder
                          </button>
                          <button
                            onClick={() => handleSendMessage(selectedCart)}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center justify-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Send Message
                          </button>
                          <button
                            onClick={() => handleAddNotes(selectedCart)}
                            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <StickyNote className="h-4 w-4" />
                            Add Notes
                          </button>
                          <button
                            onClick={() => {
                              markAsRecoveredMutation.mutate({
                                cartId: selectedCart.id,
                                notes: 'Manually marked as recovered by admin',
                                recoveryMethod: 'manual'
                              });
                            }}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                            disabled={markAsRecoveredMutation.isPending}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Mark as Recovered
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other tabs would be implemented here */}
                  {activeModalTab === 'history' && (
                    <div className="text-center py-12 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Recovery history coming soon...</p>
                    </div>
                  )}

                  {activeModalTab === 'notes' && (
                    <div className="text-center py-12 text-gray-500">
                      <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Notes and communication coming soon...</p>
                    </div>
                  )}

                  {activeModalTab === 'discounts' && (
                    <div className="text-center py-12 text-gray-500">
                      <DiscountTag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Discount management coming soon...</p>
                    </div>
                  )}

                  {activeModalTab === 'insights' && (
                    <div className="text-center py-12 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Cart insights coming soon...</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleSendEmail(selectedCart.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      disabled={sendEmailMutation.isPending}
                    >
                      <Mail className="h-4 w-4" />
                      Send Recovery Email
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discount Modal */}
          {showDiscountModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Generate Discount Code</h3>
                    <button
                      onClick={() => setShowDiscountModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                      <select
                        value={discountForm.discount_type}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, discount_type: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Discount Value ({discountForm.discount_type === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        value={discountForm.discount_value}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, discount_value: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={discountForm.discount_type === 'percentage' ? '10' : '100'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Purchase Amount (₹)</label>
                      <input
                        type="number"
                        value={discountForm.min_purchase_amount}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, min_purchase_amount: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={String(Math.floor(selectedCart.total_amount * 0.8))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valid Days</label>
                      <input
                        type="number"
                        value={discountForm.valid_days}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, valid_days: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="365"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                      <input
                        type="number"
                        value={discountForm.usage_limit}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowDiscountModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateDiscountSubmit}
                      disabled={generateDiscountMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      Generate Discount
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Modal */}
          {showTemplateModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Apply Recovery Template</h3>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(templates).map(([key, template]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {template.discount_percentage}% discount
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.message}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplyTemplate(key, false)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Schedule for Later
                          </button>
                          <button
                            onClick={() => handleApplyTemplate(key, true)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Send Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Reminder Modal */}
          {showScheduleModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Schedule Reminder</h3>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reminder Type</label>
                      <select
                        value={scheduleForm.reminder_type}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, reminder_type: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone_call">Phone Call</option>
                        <option value="manual_followup">Manual Follow-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.scheduled_at}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message Content</label>
                      <textarea
                        value={scheduleForm.message_content}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, message_content: e.target.value }))}
                        rows={4}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your reminder message..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleScheduleReminderSubmit}
                      disabled={scheduleReminderMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Schedule Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Modal */}
          {showMessageModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Send Personalized Message</h3>
                    <button
                      onClick={() => setShowMessageModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message Type</label>
                      <select
                        value={messageForm.message_type}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, message_type: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone_call">Phone Call</option>
                      </select>
                    </div>

                    {messageForm.message_type === 'email' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                          type="text"
                          value={messageForm.subject}
                          onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter subject..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message Content</label>
                      <textarea
                        value={messageForm.message_content}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, message_content: e.target.value }))}
                        rows={4}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your message..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include_discount"
                        checked={messageForm.include_discount}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, include_discount: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="include_discount" className="ml-2 block text-sm text-gray-900">
                        Include discount offer
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="send_immediately"
                        checked={messageForm.send_immediately}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, send_immediately: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="send_immediately" className="ml-2 block text-sm text-gray-900">
                        Send immediately
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMessageSubmit}
                      disabled={sendPersonalizedMessageMutation.isPending}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Modal */}
          {showNotesModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add Notes</h3>
                    <button
                      onClick={() => setShowNotesModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Note Type</label>
                      <select
                        value={notesForm.note_type}
                        onChange={(e) => setNotesForm(prev => ({ ...prev, note_type: e.target.value as any }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="internal">Internal Note</option>
                        <option value="customer_communication">Customer Communication</option>
                        <option value="recovery_attempt">Recovery Attempt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={notesForm.notes}
                        onChange={(e) => setNotesForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your notes..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowNotesModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNotesSubmit}
                      disabled={addNotesMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Modal */}
          {showHistoryModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recovery History</h3>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Recovery history coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Insights Modal */}
          {showCartInsightsModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Cart Insights</h3>
                    <button
                      onClick={() => setShowCartInsightsModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="text-center py-12 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Cart insights coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Other Tabs */}
      {activeTab === 'validation' && <ValidationLogs />}
      {activeTab === 'sms' && <SmsRecoveryManager />}
      {activeTab === 'abtesting' && <ABTestingManager />}
    </div>
  );
};

export default AbandonedCarts;