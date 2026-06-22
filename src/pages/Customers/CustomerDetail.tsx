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
import { toast } from '../../utils/toast';
import { Button, Card, CardContent, StatusBadge, Modal, PageSkeleton } from '../../components';

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
    return <PageSkeleton />;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customers')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                <span>Customer #{customer.id}</span>
                <span className="hidden sm:inline">•</span>
                <span>Joined {formatDate(customer.created_at)}</span>
                {customer.is_blocked && (
                  <StatusBadge status="error" size="sm">Blocked</StatusBadge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {customer.is_blocked ? (
            <Button
              variant="success"
              onClick={handleUnblock}
              loading={toggleBlockMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Unblock
            </Button>
          ) : (
            <Button
              variant="warning"
              onClick={() => setShowBlockModal(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block
            </Button>
          )}
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="sm:hidden flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {customer.is_blocked ? (
            <Button
              variant="success"
              size="sm"
              onClick={handleUnblock}
              loading={toggleBlockMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="warning"
              size="sm"
              onClick={() => setShowBlockModal(true)}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Spent</p>
                <p className="text-lg sm:text-2xl font-semibold mt-1 text-gray-900">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
                <p className="text-lg sm:text-2xl font-semibold mt-1 text-gray-900">{orders.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Avg Order Value</p>
                <p className="text-lg sm:text-2xl font-semibold mt-1 text-gray-900">{formatCurrency(avgOrderValue)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Last Order</p>
                <p className="text-base sm:text-lg font-semibold mt-1 text-gray-900">
                  {lastOrderDate ? formatDate(lastOrderDate) : 'Never'}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <CardContent className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${customer.email}`} className="text-primary-600 hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${customer.phone}`} className="text-primary-600 hover:underline">
                        {customer.phone || 'Not provided'}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Birthday</p>
                      <p className="text-gray-900">{customer.birthday ? formatDate(customer.birthday) : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Default Address</h3>
                {customer.default_address ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{customer.default_address.name}</p>
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
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Customer Tags</h3>
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
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Marketing Preferences</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customer.accepts_marketing}
                      disabled
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Accepts marketing emails</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customer.accepts_sms}
                      disabled
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Accepts SMS notifications</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order: any) => (
                  <Card key={order.id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                          <StatusBadge status={order.status as any} size="sm" />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {order.items_count || order.items?.length || 0} items
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View Details →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={address.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-gray-900">{address.name}</p>
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
                        </div>
                        {address.is_default && (
                          <StatusBadge status="info" size="sm">Default</StatusBadge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {item.product?.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{item.product?.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.product?.price || 0)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Added {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={review.id}>
                    <CardContent className="p-4">
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
                            <span className="text-sm font-medium text-gray-900">{review.product?.title}</span>
                          </div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(review.created_at)}</p>
                        </div>
                        {review.is_verified && (
                          <StatusBadge status="success" size="sm">Verified Purchase</StatusBadge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
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
        </CardContent>
      </Card>

      {/* Block Modal */}
      <Modal
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Block Customer"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Blocking this customer will prevent them from logging in and placing orders.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for blocking
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter reason for blocking this customer..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowBlockModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleBlock}
              loading={toggleBlockMutation.isPending}
            >
              Block Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetail;