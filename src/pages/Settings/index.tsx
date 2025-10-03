import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  IndianRupee,
  Mail,
  Truck,
  Shield,
  Users,
  FileText,
  Bell,
  Globe,
  Server,
  Save,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import PaymentSettings from './PaymentSettings';
import SiteSettings from './SiteSettings';
import SystemSettings from './SystemSettings';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determine which settings page to show from URL
  const getSettingsType = () => {
    const path = location.pathname.split('/').pop();
    return path || 'general';
  };

  const settingsType = getSettingsType();

  // Redirect /settings to /settings/general
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/general', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Fetch settings from backend
  const { data: generalSettings, isLoading: generalLoading } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.data;
    },
    enabled: settingsType === 'general',
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data.data;
    },
    enabled: settingsType === 'roles',
  });

  const { data: shippingSettings, isLoading: shippingLoading } = useQuery({
    queryKey: ['settings', 'shipping'],
    queryFn: async () => {
      const response = await api.get('/shipping-zones');
      return response.data.data;
    },
    enabled: settingsType === 'shipping',
  });

  const { data: emailTemplates, isLoading: emailLoading } = useQuery({
    queryKey: ['settings', 'email'],
    queryFn: async () => {
      const response = await api.get('/email-templates');
      return response.data.data;
    },
    enabled: settingsType === 'email',
  });

  // Update general settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const renderGeneralSettings = () => {
    if (generalLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const settings = generalSettings || {};

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={settings.gst_number || ''}
                placeholder="29XXXXXXXXXX1Z5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={settings.timezone || 'Asia/Kolkata'}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={settings.min_order_amount || 100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Order Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={settings.max_order_amount || 100000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Above (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={settings.free_shipping_threshold || 500}
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded"
                defaultChecked={settings.allow_guest_checkout !== false}
              />
              <span className="text-sm">Allow Guest Checkout</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded"
                defaultChecked={settings.enable_wishlist !== false}
              />
              <span className="text-sm">Enable Wishlist</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded"
                defaultChecked={settings.enable_coupons !== false}
              />
              <span className="text-sm">Enable Coupons</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded"
                defaultChecked={settings.enable_reviews !== false}
              />
              <span className="text-sm">Enable Product Reviews</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => updateSettingsMutation.mutate({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    );
  };

  const renderRolesSettings = () => {
    if (rolesLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const roles = rolesData?.roles || [];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {roles.map((role: any) => (
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{role.display_name || role.name}</h4>
                      <p className="text-sm text-gray-500">Internal name: {role.name}</p>
                      <p className="text-sm text-gray-500">{role.users_count || 0} users</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 5).map((permission: any) => (
                          <span key={permission.id || permission} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {permission.name || permission}
                          </span>
                        ))}
                        {(role.permissions || []).length > 5 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{role.permissions.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      {!['super-admin', 'admin', 'customer'].includes(role.name) && (
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderShippingSettings = () => {
    if (shippingLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const zones = shippingSettings || [];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Shipping Zones</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {zones.map((zone: any) => (
                <div key={zone.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{zone.name}</h4>
                      <p className="text-sm text-gray-500">
                        Zone {zone.zone_code} | States: {zone.states_count || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Base: ₹{zone.base_shipping_cost} | Per kg: ₹{zone.per_kg_cost || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Delivery: {zone.estimated_delivery_days} days
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        zone.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailTemplates = () => {
    if (emailLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { key: 'order_confirmation', name: 'Order Confirmation', desc: 'Sent when order is placed' },
                { key: 'order_shipped', name: 'Order Shipped', desc: 'Sent when order is shipped' },
                { key: 'order_delivered', name: 'Order Delivered', desc: 'Sent when order is delivered' },
                { key: 'welcome_email', name: 'Welcome Email', desc: 'Sent to new customers' },
                { key: 'password_reset', name: 'Password Reset', desc: 'Sent for password reset requests' },
                { key: 'abandoned_cart', name: 'Abandoned Cart', desc: 'Sent for abandoned cart recovery' },
              ].map((template) => (
                <div key={template.key} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                        Preview
                      </button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            {[
              { key: 'new_order', label: 'New Order Notifications', desc: 'Receive alerts for new orders', enabled: true },
              { key: 'low_stock', label: 'Low Stock Alerts', desc: 'Get notified when products are low in stock', enabled: true },
              { key: 'reviews', label: 'Customer Reviews', desc: 'Notifications for new customer reviews', enabled: false },
              { key: 'returns', label: 'Return Requests', desc: 'Alerts for new return requests', enabled: true },
              { key: 'payments', label: 'Payment Issues', desc: 'Notifications for failed payments', enabled: true },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <h4 className="font-medium">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button className="p-2">
                  {item.enabled ? (
                    <ToggleRight className="h-6 w-6 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Page titles mapping
  const getPageTitle = () => {
    switch (settingsType) {
      case 'general': return 'General Settings';
      case 'site': return 'Site Settings';
      case 'payment': return 'Payment Gateways';
      case 'shipping': return 'Shipping Zones';
      case 'email': return 'Email Templates';
      case 'roles': return 'Roles & Permissions';
      case 'system': return 'System Management';
      case 'notifications': return 'Notification Settings';
      default: return 'Settings';
    }
  };

  const getPageDescription = () => {
    switch (settingsType) {
      case 'general': return 'Configure general site information and business settings';
      case 'site': return 'Manage site branding, SEO, and appearance settings';
      case 'payment': return 'Configure payment gateways and payment methods';
      case 'shipping': return 'Manage shipping zones and delivery settings';
      case 'email': return 'Customize email templates and notifications';
      case 'roles': return 'Manage user roles and permissions';
      case 'system': return 'System configuration and maintenance settings';
      case 'notifications': return 'Configure notification preferences and alerts';
      default: return 'Manage your application settings';
    }
  };

  const renderContent = () => {
    switch (settingsType) {
      case 'general':
        return renderGeneralSettings();
      case 'site':
        return <SiteSettings />;
      case 'roles':
        return renderRolesSettings();
      case 'payment':
        return <PaymentSettings />;
      case 'shipping':
        return renderShippingSettings();
      case 'email':
        return renderEmailTemplates();
      case 'system':
        return <SystemSettings />;
      case 'notifications':
        return renderNotificationSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {getPageDescription()}
          </p>
        </div>
      </div>

      {/* Page Content - No tabs anymore */}
      {renderContent()}
    </div>
  );
};

export default Settings;