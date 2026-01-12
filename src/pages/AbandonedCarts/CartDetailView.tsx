/**
 * Cart Detail View
 * Detailed view of a single abandoned cart
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  User,
  ShoppingCart,
  DollarSign,
  Calendar,
  Smartphone,
  Monitor,
  Tag,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  StickyNote,
  Gift,
  History,
  TrendingUp,
  ExternalLink,
  Copy,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types & Hooks
import {
  useCartDetail,
  useRecoveryHistory,
  useCartInsights,
  useSendRecovery,
  useGenerateDiscount,
  useMarkRecovered,
  useAddNote,
} from './hooks';

import {
  RecoveryHistoryResponse,
  SendRecoveryForm,
} from './types';

// Components
import RecoveryModal from './components/RecoveryModal';
import AdminCartManager from '../../components/AdminCartManager/AdminCartManager';
import DiscountModal from './components/DiscountModal';
import NoteModal from './components/NoteModal';
import { STATUS_COLORS, SEGMENT_COLORS } from './types';

const CartDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cartId = parseInt(id || '0');
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'recovery' | 'discounts' | 'notes'>('overview');
  const [modalState, setModalState] = useState<{
    type: 'recovery' | 'discount' | 'note' | null;
  }>({ type: null });

  // Queries
  const { data: cartData, isLoading: cartLoading, refetch: refetchCart } = useCartDetail(cartId);
  const { data: historyData, isLoading: historyLoading } = useRecoveryHistory(cartId);
  const { data: insightsData, isLoading: insightsLoading } = useCartInsights(cartId);

  // Mutations
  const sendRecoveryMutation = useSendRecovery();
  const generateDiscountMutation = useGenerateDiscount();
  const markRecoveredMutation = useMarkRecovered();
  const addNoteMutation = useAddNote();

  const cart = cartData?.data;
  const history = historyData?.data;

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cart Not Found</h2>
        <button
          onClick={() => navigate('/abandoned-carts')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </button>
      </div>
    );
  }

  // Helper functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const closeModal = () => setModalState({ type: null });

  return (
    <div className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/abandoned-carts')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Abandoned Carts
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Cart #{cart.id}
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[cart.status]}`}>
                {cart.status.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEGMENT_COLORS[cart.customer_segment]}`}>
                {cart.customer_segment.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(cart.created_at).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ₹{cart.total.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                {getDeviceIcon(cart.device_type)}
                {cart.device_type || 'Unknown Device'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalState({ type: 'recovery' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Recovery
            </button>
            <button
              onClick={() => setModalState({ type: 'discount' })}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Discount
            </button>
            {cart.status !== 'recovered' && (
              <button
                onClick={() => {
                  if (window.confirm('Mark this cart as recovered?')) {
                    markRecoveredMutation.mutate({ cartId });
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Recovered
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b">
              <nav className="flex -mb-px">
                {['overview', 'items', 'recovery', 'discounts', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-400" />
                        Customer Details
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{cart.user?.name || 'Guest User'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cart.user?.email || 'N/A'}</p>
                            {cart.user?.email && (
                              <button onClick={() => copyToClipboard(cart.user!.email)} className="text-gray-400 hover:text-gray-600">
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{cart.user?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-gray-400" />
                        Recovery Insights
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Probability Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-2 rounded-full ${
                                  cart.recovery_probability >= 70 ? 'bg-green-500' :
                                  cart.recovery_probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${cart.recovery_probability}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{cart.recovery_probability}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time Abandoned</p>
                          <p className="font-medium">
                             {/* Calculated time ago */}
                             {(() => {
                                const diff = new Date().getTime() - new Date(cart.abandoned_at || cart.updated_at).getTime();
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                return `${hours} hours ago`;
                             })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Attempts Made</p>
                          <p className="font-medium">{cart.recovery_email_count} notifications sent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <AdminCartManager 
                    cartId={Number(id)} 
                    initialCartData={cart} 
                    isReadOnly={false}
                    onUpdate={refetchCart} 
                />
              )}

              {activeTab === 'recovery' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Recovery Timeline</h3>
                    <button
                      onClick={() => setModalState({ type: 'recovery' })}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + New Attempt
                    </button>
                  </div>
                  
                  <div className="border-l-2 border-gray-200 ml-3 space-y-6">
                    {history?.contact_history?.map((note, idx) => (
                      <div key={note.id} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-400 border-2 border-white"></div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900">
                              {note.contact_type === 'note' ? 'Internal Note' : `Recovery (${note.contact_type})`}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{note.message_content}</p>
                          <p className="text-xs text-gray-400 mt-2">By: {note.admin_user?.name || 'System'}</p>
                        </div>
                      </div>
                    ))}
                    {(!history?.contact_history || history.contact_history.length === 0) && (
                       <p className="text-gray-500 pl-6">No recovery history yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'discounts' && (
                <div>
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Active Discounts</h3>
                    <button
                      onClick={() => setModalState({ type: 'discount' })}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Generate New
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {history?.active_discounts?.map((discount) => (
                      <div key={discount.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-lg text-purple-600 bg-purple-50 px-2 rounded">
                              {discount.discount_code}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {discount.is_active ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}% OFF` 
                              : `₹${discount.discount_value} OFF`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Expires: {new Date(discount.valid_until).toLocaleDateString()}</p>
                          <p>Used: {discount.times_used} times</p>
                        </div>
                      </div>
                    ))}
                    {(!history?.active_discounts || history.active_discounts.length === 0) && (
                       <p className="text-gray-500">No discounts generated for this cart.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
                    <button
                      onClick={() => setModalState({ type: 'note' })}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Note
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                     {history?.contact_history?.filter(n => n.contact_type === 'note').map((note) => (
                       <div key={note.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                          <p className="text-gray-800">{note.message_content}</p>
                          <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                             <span>Added by {note.admin_user?.name || 'Admin'}</span>
                             <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                       </div>
                     ))}
                     {(!history?.contact_history?.some(n => n.contact_type === 'note')) && (
                        <p className="text-gray-500">No internal notes.</p>
                     )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recovery Action</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send a recovery link to the customer. The link will restore their cart session.
            </p>
            <div className="p-3 bg-gray-50 rounded border break-all text-xs font-mono mb-4 text-gray-600">
              {window.location.origin}/cart/recover/{cart.recovery_token}
            </div>
            <button
               onClick={() => copyToClipboard(`${window.location.origin}/cart/recover/${cart.recovery_token}`)}
               className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 mb-2"
            >
              <Copy className="h-4 w-4" />
              Copy Recovery Link
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalState.type && (
        <>
          <RecoveryModal
            cart={cart}
            isOpen={modalState.type === 'recovery'}
            onClose={closeModal}
            isPending={sendRecoveryMutation.isPending}
            onSend={(data: SendRecoveryForm) => {
              sendRecoveryMutation.mutate(
                { cartId: cart.id, data },
                { onSuccess: closeModal }
              );
            }}
          />
          
          <DiscountModal
            cart={cart}
            isOpen={modalState.type === 'discount'}
            onClose={closeModal}
            isPending={generateDiscountMutation.isPending}
            onGenerate={(data) => {
              generateDiscountMutation.mutate(
                { cartId: cart.id, data },
                { onSuccess: closeModal }
              );
            }}
          />

          <NoteModal
            cart={cart}
            isOpen={modalState.type === 'note'}
            onClose={closeModal}
            isPending={addNoteMutation.isPending}
            onSave={(data) => {
               addNoteMutation.mutate(
                  { cartId: cart.id, data },
                  { onSuccess: closeModal }
               );
            }}
          />
        </>
      )}
    </div>
  );
};

export default CartDetailView;
