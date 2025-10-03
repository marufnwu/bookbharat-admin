import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customersApi, ordersApi } from '../../api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Heart,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Star,
  Clock,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Fetch customer details
  const { data: customerResponse, isLoading, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(Number(id)),
    enabled: !!id,
  });

  // Fetch customer orders
  const { data: ordersResponse } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => ordersApi.getAll({ user_id: Number(id) }),
    enabled: !!id,
  });

  const customer = customerResponse?.customer || customerResponse?.user;
  const orders = ordersResponse?.orders?.data || [];

  // Block/Unblock customer mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ blocked, reason }: { blocked: boolean; reason?: string }) => {
      return customersApi.updateStatus(Number(id), blocked ? 'blocked' : 'active', reason);
    },
    onSuccess: () => {
      toast.success(customer?.is_blocked ? 'Customer unblocked' : 'Customer blocked');
      setShowBlockModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update customer status');
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return customersApi.delete(Number(id));
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      navigate('/customers');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    },
  });

  const handleBlock = () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    toggleBlockMutation.mutate({ blocked: true, reason: blockReason });
  };

  const handleUnblock = () => {
    toggleBlockMutation.mutate({ blocked: false });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'addresses', label: 'Addresses', count: customer?.addresses?.length },
    { id: 'wishlist', label: 'Wishlist', count: customer?.wishlist?.length },
    { id: 'reviews', label: 'Reviews', count: customer?.reviews?.length },
    { id: 'activity', label: 'Activity' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  // Calculate customer stats
  const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const lastOrderDate = orders.length > 0 ? orders[0].created_at : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{customer.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Customer #{customer.id}</span>
                <span>•</span>
                <span>Joined {formatDate(customer.created_at)}</span>
                {customer.is_blocked && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 flex items-center gap-1">
                      <Ban className="h-3 w-3" />
                      Blocked
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/customers/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          {customer.is_blocked ? (
            <button
              onClick={handleUnblock}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Unblock
            </button>
          ) : (
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <Ban className="h-4 w-4" />
              Block
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(totalSpent)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold mt-1">{orders.length}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(avgOrderValue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Order</p>
              <p className="text-lg font-semibold mt-1">
                {lastOrderDate ? formatDate(lastOrderDate) : 'Never'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                        {customer.phone || 'Not provided'}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Birthday</p>
                      <p>{customer.birthday ? formatDate(customer.birthday) : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Address</h3>
                {customer.default_address ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">{customer.default_address.name}</p>
                      <p className="text-sm text-gray-600">
                        {customer.default_address.address_line_1}
                        {customer.default_address.address_line_2 && (
                          <>, {customer.default_address.address_line_2}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {customer.default_address.city}, {customer.default_address.state} {customer.default_address.pincode}
                      </p>
                      <p className="text-sm text-gray-600">{customer.default_address.country}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No default address set</p>
                )}
              </div>

              {/* Customer Tags */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {customer.email_verified && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Email Verified
                    </span>
                  )}
                  {customer.is_vip && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      VIP Customer
                    </span>
                  )}
                  {orders.length > 10 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Loyal Customer
                    </span>
                  )}
                  {totalSpent > 50000 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      High Value
                    </span>
                  )}
                </div>
              </div>

              {/* Marketing Preferences */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Marketing Preferences</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customer.accepts_marketing}
                      disabled
                      className="rounded"
                    />
                    <span className="text-sm">Accepts marketing emails</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customer.accepts_sms}
                      disabled
                      className="rounded"
                    />
                    <span className="text-sm">Accepts SMS notifications</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order: any) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.total)}</p>
                        <span className={`
                          inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {order.items_count || order.items?.length || 0} items
                      </p>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.addresses?.length > 0 ? (
                customer.addresses.map((address: any) => (
                  <div key={address.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1 ml-3">
                        <p className="font-medium">{address.name}</p>
                        <p className="text-sm text-gray-600">
                          {address.address_line_1}
                          {address.address_line_2 && <>, {address.address_line_2}</>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                        <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                      </div>
                      {address.is_default && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 md:col-span-2">No addresses added</p>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.wishlist?.length > 0 ? (
                customer.wishlist.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product?.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.product?.price || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 lg:col-span-3">Wishlist is empty</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {customer.reviews?.length > 0 ? (
                customer.reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.product?.title}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(review.created_at)}</p>
                      </div>
                      {review.is_verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No reviews yet</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {customer.activities?.length > 0 ? (
                customer.activities.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No activity recorded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Block Customer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Blocking this customer will prevent them from logging in and placing orders.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for blocking
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reason for blocking this customer..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={toggleBlockMutation.isPending}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {toggleBlockMutation.isPending ? 'Blocking...' : 'Block Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;