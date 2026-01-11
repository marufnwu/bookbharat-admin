import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Gift,
  CheckCircle,
  Clock,
  User,
  ShoppingCart,
  DollarSign,
  Calendar,
  Smartphone,
  Monitor,
  Tag,
  RefreshCw,
  Send,
  Plus,
  AlertCircle,
  TrendingUp,
  History,
  StickyNote,
  Bell,
  ExternalLink,
  Copy,
  Percent,
  Target,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface CartNote {
  id: number;
  notes: string;
  note_type: string;
  admin_user?: { name: string };
  created_at: string;
}

interface CartDiscount {
  id: number;
  discount_code: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
  is_active: boolean;
  times_used: number;
}

interface RecoveryAttempt {
  id: number;
  channel: string;
  status: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
}

const CartDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'recovery' | 'discounts' | 'notes' | 'history'>('overview');
  const [sendChannel, setSendChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [emailType, setEmailType] = useState<'first_reminder' | 'second_reminder' | 'final_reminder'>('first_reminder');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  // Discount form
  const [discountForm, setDiscountForm] = useState({
    discount_type: 'percentage',
    discount_value: '10',
    valid_days: '7',
    min_purchase_amount: '',
  });
  
  // Note form
  const [noteForm, setNoteForm] = useState({
    notes: '',
    note_type: 'internal',
  });

  // Fetch cart details
  const { data: cartData, isLoading, error, refetch } = useQuery({
    queryKey: ['abandoned-cart-detail', id],
    queryFn: async () => {
      const response = await api.get(`/abandoned-carts/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch recovery history
  const { data: historyData } = useQuery({
    queryKey: ['cart-recovery-history', id],
    queryFn: async () => {
      const response = await api.get(`/abandoned-carts/${id}/recovery-history`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch cart insights
  const { data: insightsData } = useQuery({
    queryKey: ['cart-insights', id],
    queryFn: async () => {
      const response = await api.get(`/abandoned-carts/${id}/insights`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const cart = cartData;
  const history = historyData;
  const insights = insightsData;

  // Mutations
  const sendRecoveryMutation = useMutation({
    mutationFn: async (data: { channel: string; email_type: string }) => {
      const response = await api.post(`/abandoned-carts/${id}/send-recovery-email`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Recovery message sent successfully');
      setShowSendModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['cart-recovery-history', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const generateDiscountMutation = useMutation({
    mutationFn: async (data: any) => {
      // Clean up empty values
      const cleanData: any = {
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      };
      if (data.valid_days) cleanData.valid_days = data.valid_days;
      if (data.min_purchase_amount) cleanData.min_purchase_amount = data.min_purchase_amount;
      
      const response = await api.post(`/abandoned-carts/${id}/generate-discount`, cleanData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Discount code generated!');
      setShowDiscountModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate discount');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/abandoned-carts/${id}/add-notes`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Note added');
      setShowNoteModal(false);
      setNoteForm({ notes: '', note_type: 'internal' });
      queryClient.invalidateQueries({ queryKey: ['cart-recovery-history', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });

  const markRecoveredMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/abandoned-carts/${id}/mark-as-recovered`, {
        notes: 'Manually marked as recovered from detail view'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cart marked as recovered');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as recovered');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getDeviceIcon = (type?: string) => {
    return type === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  const getSegmentColor = (segment?: string) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'high_value': return 'bg-blue-100 text-blue-800';
      case 'repeat': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'abandoned': return 'bg-red-100 text-red-800';
      case 'recovered': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Cart not found</h2>
        <Link to="/abandoned-carts" className="text-blue-600 hover:underline mt-2 inline-block">
          ← Back to Abandoned Carts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/abandoned-carts')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cart #{cart.id}
            </h1>
            <p className="text-sm text-gray-500">
              {cart.user?.email || 'Guest User'} • Abandoned {new Date(cart.abandoned_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cart.status)}`}>
            {cart.status}
          </span>
          {cart.status !== 'recovered' && (
            <button
              onClick={() => markRecoveredMutation.mutate()}
              disabled={markRecoveredMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Recovered
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Recovery Message
          </button>
          <button
            onClick={() => setShowDiscountModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Generate Discount
          </button>
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <StickyNote className="h-4 w-4" />
            Add Note
          </button>
          {cart.recovery_token && (
            <button
              onClick={() => {
                const baseUrl = window.location.origin.replace(':3003', ':3000');
                copyToClipboard(`${baseUrl}/api/v1/cart-recovery/recover/${cart.recovery_token}`);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Recovery Link
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'items', label: 'Cart Items', icon: ShoppingCart },
            { id: 'recovery', label: 'Recovery', icon: TrendingUp },
            { id: 'discounts', label: 'Discounts', icon: Percent },
            { id: 'notes', label: 'Notes', icon: StickyNote },
            { id: 'history', label: 'History', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer Information
                </h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Email:</span> <span className="font-medium">{cart.user?.email || 'N/A'}</span></p>
                  <p><span className="text-gray-500">Name:</span> <span className="font-medium">{cart.user?.name || 'N/A'}</span></p>
                  <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{cart.user?.phone || 'N/A'}</span></p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">Segment:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getSegmentColor(cart.customer_segment)}`}>
                      {cart.customer_segment || 'Regular'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Cart Value */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Cart Value
                </h3>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">₹{cart.total?.toLocaleString()}</p>
                  <p><span className="text-gray-500">Items:</span> <span className="font-medium">{cart.total_items}</span></p>
                  <p><span className="text-gray-500">Currency:</span> <span className="font-medium">{cart.currency || 'INR'}</span></p>
                </div>
              </div>

              {/* Recovery Metrics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Recovery Metrics
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-500">Probability:</span>{' '}
                    <span className={`font-medium ${cart.recovery_probability >= 70 ? 'text-green-600' : cart.recovery_probability >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {cart.recovery_probability}%
                    </span>
                  </p>
                  <p><span className="text-gray-500">Emails Sent:</span> <span className="font-medium">{cart.recovery_email_count || 0}</span></p>
                  <p><span className="text-gray-500">Last Email:</span> <span className="font-medium">{cart.last_recovery_email_sent ? new Date(cart.last_recovery_email_sent).toLocaleDateString() : 'Never'}</span></p>
                </div>
              </div>

              {/* Device & Source */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  {getDeviceIcon(cart.device_type)} Device & Source
                </h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Device:</span> <span className="font-medium capitalize">{cart.device_type || 'Unknown'}</span></p>
                  <p><span className="text-gray-500">Source:</span> <span className="font-medium capitalize">{cart.source || 'Direct'}</span></p>
                  <p><span className="text-gray-500">Session:</span> <span className="font-medium text-xs">{cart.session_id?.substring(0, 16)}...</span></p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Timeline
                </h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(cart.created_at).toLocaleString()}</span></p>
                  <p><span className="text-gray-500">Abandoned:</span> <span className="font-medium">{cart.abandoned_at ? new Date(cart.abandoned_at).toLocaleString() : 'N/A'}</span></p>
                  <p><span className="text-gray-500">Last Activity:</span> <span className="font-medium">{cart.last_activity ? new Date(cart.last_activity).toLocaleString() : 'N/A'}</span></p>
                </div>
              </div>

              {/* AI Insights */}
              {insights && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> AI Insights
                  </h3>
                  <div className="space-y-2 text-sm">
                    {insights.recommendations?.map((rec: string, i: number) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </p>
                    ))}
                    {insights.best_time_to_contact && (
                      <p><span className="text-gray-600">Best time:</span> <span className="font-medium">{insights.best_time_to_contact}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cart Items ({cart.total_items})</h3>
            <div className="space-y-4">
              {cart.items?.map((item: CartItem) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    {item.variant && <p className="text-sm text-gray-500">Variant: {item.variant}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.price?.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No items data available</p>
              )}
            </div>
          </div>
        )}

        {/* Recovery Tab */}
        {activeTab === 'recovery' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recovery Attempts</h3>
              <button
                onClick={() => setShowSendModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send New
              </button>
            </div>
            <div className="space-y-3">
              {history?.recovery_attempts?.map((attempt: RecoveryAttempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getChannelIcon(attempt.channel)}
                    <div>
                      <p className="font-medium capitalize">{attempt.channel}</p>
                      <p className="text-sm text-gray-500">{new Date(attempt.sent_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      attempt.status === 'sent' ? 'bg-green-100 text-green-800' :
                      attempt.status === 'opened' ? 'bg-blue-100 text-blue-800' :
                      attempt.status === 'clicked' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {attempt.status}
                    </span>
                    {attempt.opened_at && (
                      <span className="text-xs text-gray-500">Opened: {new Date(attempt.opened_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No recovery attempts yet</p>
              )}
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated Discounts</h3>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate New
              </button>
            </div>
            <div className="space-y-3">
              {history?.active_discounts?.map((discount: CartDiscount) => (
                <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-mono font-medium">{discount.discount_code}</p>
                      <p className="text-sm text-gray-500">
                        {discount.discount_type === 'percentage' ? `${discount.discount_value}% off` : `₹${discount.discount_value} off`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${discount.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {discount.is_active ? 'Active' : 'Expired'}
                    </span>
                    <span className="text-xs text-gray-500">Used: {discount.times_used}x</span>
                    <button
                      onClick={() => copyToClipboard(discount.discount_code)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No discounts generated yet</p>
              )}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notes & Comments</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {history?.contact_history?.map((note: CartNote) => (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      note.note_type === 'internal' ? 'bg-gray-100 text-gray-800' :
                      note.note_type === 'customer_communication' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {note.note_type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {note.admin_user?.name || 'System'} • {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{note.notes}</p>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No notes yet</p>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {history?.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{event.action}</p>
                      <p className="text-sm text-gray-500">{new Date(event.created_at).toLocaleString()}</p>
                      {event.details && <p className="text-sm text-gray-600 mt-1">{event.details}</p>}
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8 pl-10">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Recovery Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Send Recovery Message</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['email', 'sms', 'whatsapp'].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setSendChannel(ch as any)}
                      className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                        sendChannel === ch ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {getChannelIcon(ch)}
                      <span className="text-xs capitalize">{ch}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="first_reminder">First Reminder</option>
                  <option value="second_reminder">Second Reminder (with discount)</option>
                  <option value="final_reminder">Final Reminder (last chance)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => sendRecoveryMutation.mutate({ channel: sendChannel, email_type: emailType })}
                disabled={sendRecoveryMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sendRecoveryMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Discount Code</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={discountForm.discount_type}
                  onChange={(e) => setDiscountForm({...discountForm, discount_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {discountForm.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={discountForm.discount_value}
                  onChange={(e) => setDiscountForm({...discountForm, discount_value: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={discountForm.discount_type === 'percentage' ? '10' : '100'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Days</label>
                <input
                  type="number"
                  value={discountForm.valid_days}
                  onChange={(e) => setDiscountForm({...discountForm, valid_days: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => generateDiscountMutation.mutate(discountForm)}
                disabled={generateDiscountMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {generateDiscountMutation.isPending ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
                <select
                  value={noteForm.note_type}
                  onChange={(e) => setNoteForm({...noteForm, note_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="internal">Internal</option>
                  <option value="customer_communication">Customer Communication</option>
                  <option value="recovery_attempt">Recovery Attempt</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({...noteForm, notes: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter note..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => addNoteMutation.mutate(noteForm)}
                disabled={addNoteMutation.isPending || !noteForm.notes.trim()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDetailView;
