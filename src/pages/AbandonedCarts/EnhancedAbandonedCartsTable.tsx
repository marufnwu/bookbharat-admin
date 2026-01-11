import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import { calculateDiscount, formatDiscount } from '../../utils/discountCalculator';
import {
  Mail,
  Eye,
  Gift,
  Zap,
  Target,
  User,
  Smartphone,
  Monitor,
  CheckCircle,
  RefreshCw,
  Bell,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import ErrorDisplay from './ErrorDisplay';
import {
  RECOVERY_RATE_THRESHOLDS,
  URGENCY_THRESHOLDS,
  CUSTOMER_SEGMENTS,
  DEVICE_TYPES,
  RECOVERY_STATUS,
} from '../../constants/abandonedCarts';

interface Cart {
  id: number;
  user?: {
    email: string;
    name?: string;
  };
  session_id: string;
  cart_data: any;
  total: number;
  total_items: number;
  currency: string;
  is_abandoned: boolean;
  status: string;
  customer_segment: string;
  device_type?: string;
  source?: string;
  recovery_probability: number;
  abandoned_at?: string;
  recovery_email_count: number;
  last_recovery_email_sent?: string;
  recovery_token?: string;
  insights?: {
    priority_score: number;
    urgency_level: string;
    best_contact_method: string;
    optimal_contact_time: string;
    recommended_action: string;
  };
  active_discount?: any;
  scheduled_reminders?: any[];
  contact_history?: any[];
}

interface EnhancedAbandonedCartsTableProps {
  carts: Cart[];
  onRefresh: () => void;
  onRowSelect: (cartId: number, selected: boolean) => void;
  selectedCarts: number[];
  onSelectAll: () => void;
  selectAll: boolean;
}

const EnhancedAbandonedCartsTable: React.FC<EnhancedAbandonedCartsTableProps> = ({
  carts,
  onRefresh,
  onRowSelect,
  selectedCarts,
  onSelectAll,
  selectAll,
}) => {
  const [generatingDiscount, setGeneratingDiscount] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<number | null>(null);
  const [actionError, setActionError] = useState<any>(null);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [markingRecovered, setMarkingRecovered] = useState<number | null>(null);

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case DEVICE_TYPES.MOBILE: return <Smartphone className="h-4 w-4" />;
      case DEVICE_TYPES.DESKTOP: return <Monitor className="h-4 w-4" />;
      case DEVICE_TYPES.TABLET: return <Monitor className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case CUSTOMER_SEGMENTS.VIP: return 'text-purple-600 bg-purple-100';
      case CUSTOMER_SEGMENTS.HIGH_VALUE: return 'text-blue-600 bg-blue-100';
      case CUSTOMER_SEGMENTS.REPEAT: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= URGENCY_THRESHOLDS.CRITICAL) return 'text-green-600 bg-green-100';
    if (score >= URGENCY_THRESHOLDS.HIGH) return 'text-blue-600 bg-blue-100';
    if (score >= URGENCY_THRESHOLDS.MEDIUM) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleViewDetails = (cart: Cart) => {
    // Navigate to dedicated cart detail page
    window.location.href = `/abandoned-carts/${cart.id}`;
  };

  const handleMarkRecovered = async (cartId: number) => {
    setMarkingRecovered(cartId);
    try {
      const response = await api.post(`/abandoned-carts/${cartId}/mark-as-recovered`, {
        notes: 'Manually marked as recovered from admin panel'
      });
      if (response.data.success) {
        toast.success('Cart marked as recovered');
        onRefresh();
      } else {
        toast.error(response.data.message || 'Failed to mark as recovered');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as recovered');
    } finally {
      setMarkingRecovered(null);
    }
  };

  const handleQuickDiscount = async (cartId: number) => {
    setGeneratingDiscount(cartId);
    setActionError(null);
    try {
      const cart = carts.find(c => c.id === cartId);

      // Calculate optimal discount using centralized logic
      const discount = calculateDiscount({
        cartValue: cart?.total || 0,
        customerSegment: cart?.customer_segment || 'regular',
        isVip: cart?.customer_segment === 'vip',
        urgency: (cart?.insights?.urgency_level as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      });

      const response = await api.post(`/abandoned-carts/${cartId}/generate-discount`, {
        discount_type: discount.type,
        discount_value: discount.value,
        valid_days: 7,
      });
      const result = response.data;

      if (result.success) {
        toast.success(`Discount generated: ${formatDiscount(discount.type, discount.value)} - ${discount.reasoning}`);
        onRefresh();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setGeneratingDiscount(null);
    }
  };

  const handleQuickEmail = async (cartId: number) => {
    setSendingEmail(cartId);
    setActionError(null);
    try {
      const response = await api.post(`/abandoned-carts/${cartId}/send-recovery-email`);
      const result = response.data;

      if (result.success) {
        onRefresh();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleQuickTemplate = async (cartId: number) => {
    try {
      const cart = carts.find(c => c.id === cartId);
      const response = await api.post(`/abandoned-carts/${cartId}/apply-template`, {
        template_name: cart?.customer_segment === CUSTOMER_SEGMENTS.VIP ? 'vip' : 'high_value',
        send_immediately: true,
      });
      const result = response.data;

      if (result.success) {
        toast.success('Template applied successfully');
        onRefresh();
      } else {
        toast.error(result.message || 'Failed to apply template');
      }
    } catch (error) {
      toast.error('Failed to apply template');
    }
  };

  const loadInsights = async (cartId: number) => {
    setLoadingInsights(cartId);
    try {
      const response = await api.get(`/abandoned-carts/${cartId}/insights`);
      const result = response.data;

      if (result.success) {
        // Force re-render to get updated data
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast.error('Failed to load cart insights');
    } finally {
      setLoadingInsights(null);
    }
  };

  return (
    <>
      {/* Error Display */}
      {actionError && (
        <div className="mb-4">
          <ErrorDisplay
            error={actionError}
            title="Quick Action Failed"
            onDismiss={() => setActionError(null)}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={onSelectAll}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {selectAll ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 border border-gray-300 rounded" />
                  )}
                  <span>Select</span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
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
                Urgency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recovery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {carts.map((cart) => (
              <tr
                key={cart.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Checkbox */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onRowSelect(cart.id, !selectedCarts.includes(cart.id))}
                    className="flex items-center"
                  >
                    {selectedCarts.includes(cart.id) ? (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    ) : (
                      <div className="h-4 w-4 border border-gray-300 rounded" />
                    )}
                  </button>
                </td>

                {/* Customer Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cart.user?.email || 'Guest'}
                      </div>
                      {cart.user?.name && (
                        <div className="text-xs text-gray-500">{cart.user.name}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {cart.session_id ? `${cart.session_id.substring(0, 12)}...` : 'No session'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Priority Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {cart.insights ? (
                    <div className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(cart.insights.priority_score)}`}>
                      {cart.insights.priority_score}
                    </div>
                  ) : (
                    <button
                      onClick={() => loadInsights(cart.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Load Insights"
                    >
                      {loadingInsights === cart.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </td>

                {/* Items Count */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{cart.total_items}</div>
                </td>

                {/* Cart Value */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{cart.total.toLocaleString()}</div>
                  {cart.active_discount && (
                    <div className="text-xs text-green-600">
                      -₹{cart.active_discount.calculateDiscount(cart.total).toLocaleString()}
                    </div>
                  )}
                </td>

                {/* Customer Segment */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSegmentColor(cart.customer_segment)}`}>
                    {cart.customer_segment?.replace('_', ' ') || 'unknown'}
                  </span>
                </td>

                {/* Urgency Level */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {cart.insights ? (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getUrgencyColor(cart.insights.urgency_level)}`}>
                      {cart.insights.urgency_level}
                    </span>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>

                {/* Recovery Probability */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          cart.recovery_probability >= RECOVERY_RATE_THRESHOLDS.EXCELLENT ? 'bg-green-500' :
                          cart.recovery_probability >= RECOVERY_RATE_THRESHOLDS.GOOD ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${cart.recovery_probability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {cart.recovery_probability}%
                    </span>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(cart.device_type)}
                    {cart.scheduled_reminders && cart.scheduled_reminders.length > 0 && (
                      <span className="text-orange-500" title={`${cart.scheduled_reminders.length} scheduled reminders`}>
                        <Bell className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    cart.status === RECOVERY_STATUS.RECOVERED ? 'text-green-600 bg-green-100' :
                    cart.status === RECOVERY_STATUS.EXPIRED ? 'text-red-600 bg-red-100' :
                    'text-blue-600 bg-blue-100'
                  }`}>
                    {cart.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1">
                    {/* View Details */}
                    <button
                      onClick={() => handleViewDetails(cart)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details & Actions"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Quick Discount */}
                    <button
                      onClick={() => handleQuickDiscount(cart.id)}
                      disabled={generatingDiscount === cart.id}
                      className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                      title="Generate Quick Discount"
                    >
                      {generatingDiscount === cart.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                    </button>

                    {/* Quick Email */}
                    <button
                      onClick={() => handleQuickEmail(cart.id)}
                      disabled={sendingEmail === cart.id}
                      className="text-purple-600 hover:text-purple-900 p-1 disabled:opacity-50"
                      title="Send Recovery Email"
                    >
                      {sendingEmail === cart.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </button>

                    {/* Mark as Recovered */}
                    {cart.status !== 'recovered' && (
                      <button
                        onClick={() => handleMarkRecovered(cart.id)}
                        disabled={markingRecovered === cart.id}
                        className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                        title="Mark as Recovered"
                      >
                        {markingRecovered === cart.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Quick Template */}
                    <button
                      onClick={() => handleQuickTemplate(cart.id)}
                      className="text-orange-600 hover:text-orange-900 p-1"
                      title="Apply Recovery Template"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cart Details Modal */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cart #{selectedCart.id} Details</h3>
                <button
                  onClick={() => setSelectedCart(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedCart.user?.email || 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{selectedCart.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="font-medium text-lg">₹{selectedCart.total?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{selectedCart.total_items} items</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Segment</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(selectedCart.customer_segment)}`}>
                      {selectedCart.customer_segment}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recovery Emails Sent</p>
                    <p className="font-medium">{selectedCart.recovery_email_count || 0}</p>
                  </div>
                </div>

                {selectedCart.recovery_token && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Recovery Link</p>
                    <a
                      href={`${window.location.origin.replace(':3003', ':3000')}/cart/recover/${selectedCart.recovery_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      Open Recovery Link <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => { handleQuickEmail(selectedCart.id); setSelectedCart(null); }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" /> Send Email
                  </button>
                  <button
                    onClick={() => { handleQuickDiscount(selectedCart.id); setSelectedCart(null); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <Gift className="h-4 w-4" /> Generate Discount
                  </button>
                  {selectedCart.status !== 'recovered' && (
                    <button
                      onClick={() => { handleMarkRecovered(selectedCart.id); setSelectedCart(null); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Recovered
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </>
  );
};

export default EnhancedAbandonedCartsTable;