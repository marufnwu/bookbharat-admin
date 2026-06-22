import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customersApi } from '../../api';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Shield, Bell, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../utils/toast';
import { Button, Card, CardContent, PageSkeleton } from '../../components';

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: string;
  accepts_marketing: boolean;
  accepts_sms: boolean;
  is_vip: boolean;
  email_verified: boolean;
  is_blocked: boolean;
  new_password?: string;
  new_password_confirmation?: string;
}

const CustomerEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    email: '',
    phone: '',
    accepts_marketing: false,
    accepts_sms: false,
    is_vip: false,
    email_verified: false,
    is_blocked: false,
  });

  // Fetch customer details
  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(Number(id)),
    enabled: !!id,
  });

  const customer = customerResponse?.customer || customerResponse?.user;

  // Load customer data when available
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        birthday: customer.birthday || '',
        gender: customer.gender || '',
        accepts_marketing: customer.accepts_marketing || false,
        accepts_sms: customer.accepts_sms || false,
        is_vip: customer.is_vip || false,
        email_verified: customer.email_verified || false,
        is_blocked: customer.is_blocked || false,
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerForm) => {
      // Only send password if it's being changed
      const payload = { ...data };
      if (!changePassword) {
        delete payload.new_password;
        delete payload.new_password_confirmation;
      }
      return customersApi.update(Number(id), payload);
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
      navigate(`/customers/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password if changing
    if (changePassword) {
      if (!formData.new_password) {
        toast.error('Please enter a new password');
        return;
      }
      if (formData.new_password !== formData.new_password_confirmation) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.new_password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
    }

    // Validate phone number if provided
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    updateMutation.mutate(formData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (isLoading) {
    return <PageSkeleton />;
  }

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
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Edit Customer</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Update customer information</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          loading={updateMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Updating...' : 'Update Customer'}
        </Button>
      </div>

      <Card>
        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_vip"
                      checked={formData.is_vip}
                      onChange={handleInputChange}
                      className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">VIP Customer</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="email_verified"
                      checked={formData.email_verified}
                      onChange={handleInputChange}
                      className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Email Verified</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_blocked"
                      checked={formData.is_blocked}
                      onChange={handleInputChange}
                      className="rounded text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Block Customer</span>
                  </label>
                </div>

                {/* Customer Stats */}
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{customer?.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Spent</p>
                      <p className="text-lg font-semibold text-gray-900">₹{customer?.total_spent || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Order</p>
                      <p className="text-sm font-medium text-gray-900">
                        {customer?.last_order_date
                          ? new Date(customer.last_order_date).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(customer?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Preferences</h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="accepts_marketing"
                        checked={formData.accepts_marketing}
                        onChange={handleInputChange}
                        className="rounded text-primary-600 focus:ring-primary-500 mt-1 border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Marketing Emails</p>
                        <p className="text-xs text-gray-500">
                          Receive emails about new products, offers, and promotions
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="accepts_sms"
                        checked={formData.accepts_sms}
                        onChange={handleInputChange}
                        className="rounded text-primary-600 focus:ring-primary-500 mt-1 border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
                        <p className="text-xs text-gray-500">
                          Receive SMS updates about orders and exclusive offers
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <h4 className="text-sm font-medium text-primary-900 mb-2">Preference History</h4>
                  <div className="space-y-1 text-sm text-primary-700">
                    <p>Marketing emails: {formData.accepts_marketing ? 'Opted in' : 'Opted out'}</p>
                    <p>SMS notifications: {formData.accepts_sms ? 'Opted in' : 'Opted out'}</p>
                    <p className="text-xs text-primary-600 mt-2">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Change Customer Password</span>
                  </label>

                  {changePassword && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="new_password"
                            value={formData.new_password || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="new_password_confirmation"
                          value={formData.new_password_confirmation || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                        {formData.new_password && formData.new_password_confirmation && (
                          <p className={`text-xs mt-1 ${
                            formData.new_password === formData.new_password_confirmation
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formData.new_password === formData.new_password_confirmation
                              ? '✓ Passwords match'
                              : '✗ Passwords do not match'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Account Security</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>• Last login: {customer?.last_login_at ? new Date(customer.last_login_at).toLocaleString() : 'Never'}</li>
                    <li>• Failed login attempts: {customer?.failed_login_attempts || 0}</li>
                    <li>• Account status: {formData.is_blocked ? 'Blocked' : 'Active'}</li>
                    <li>• Email verified: {formData.email_verified ? 'Yes' : 'No'}</li>
                  </ul>
                </div>

                {changePassword && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-sm text-orange-800">
                      Warning: Changing the password will log the customer out of all devices.
                      They will receive an email notification about this change.
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerEdit;