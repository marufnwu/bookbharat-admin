import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GlobeAltIcon,
  PaintBrushIcon,
  CogIcon,
  PhotoIcon,
  LinkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button, LoadingSpinner, Badge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { settingsApi } from '../../api';

interface SiteConfig {
  site: {
    name: string;
    description: string;
    logo: string;
    favicon: string;
    contact_email: string;
    contact_phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
  };
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    success_color: string;
    warning_color: string;
    error_color: string;
    font_family: string;
    header_style: string;
    footer_style: string;
    layout: string;
    banner_style: string;
  };
  features: {
    wishlist_enabled: boolean;
    reviews_enabled: boolean;
    chat_support_enabled: boolean;
    notifications_enabled: boolean;
    newsletter_enabled: boolean;
    social_login_enabled: boolean;
    guest_checkout_enabled: boolean;
    multi_currency_enabled: boolean;
    inventory_tracking_enabled: boolean;
    promotional_banners_enabled: boolean;
  };
  social: {
    facebook_url: string;
    twitter_url: string;
    instagram_url: string;
    youtube_url: string;
    linkedin_url: string;
  };
  seo: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string[];
    og_image: string;
    twitter_card: string;
  };
}

const SiteSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch site configuration from API
  const { data: siteConfigData, isLoading: siteConfigLoading } = useQuery({
    queryKey: ['configuration', 'site-config'],
    queryFn: settingsApi.getSiteConfig,
  });

  const updateSiteConfigMutation = useMutation({
    mutationFn: async (updates: any) => {
      return settingsApi.updateSiteConfig(updates);
    },
    onSuccess: (data) => {
      showSuccess(data.message || 'Site configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['configuration', 'site-config'] });
    },
    onError: (error: any) => {
      showError('Failed to update site configuration', error.message);
    },
  });

  if (siteConfigLoading) return <LoadingSpinner />;

  const siteConfig: SiteConfig = siteConfigData?.data || {};

  // Function to collect form data
  const collectFormData = () => {
    if (!formRef.current) return {};

    const formData = new FormData(formRef.current);
    const data: any = {
      site: {},
      theme: {},
      features: {},
      social: {},
      seo: {}
    };

    // Process form data
    Array.from(formData.entries()).forEach(([key, value]) => {
      const [section, field] = key.split('.');

      if (section === 'site' && field === 'address') {
        // Handle nested address object
        const addressField = key.split('.')[2];
        if (!data.site.address) data.site.address = {};
        data.site.address[addressField] = value;
      } else if (section === 'features') {
        // Handle boolean features - checkbox values
        data[section][field] = value === 'on';
      } else if (section === 'seo' && field === 'meta_keywords') {
        // Handle array of keywords
        data[section][field] = String(value).split(',').map(k => k.trim()).filter(k => k);
      } else if (section && field) {
        data[section][field] = value;
      }
    });

    // Handle unchecked checkboxes for features (they don't appear in FormData)
    if (siteConfig.features) {
      Object.keys(siteConfig.features).forEach(key => {
        if (data.features[key] === undefined) {
          data.features[key] = false;
        }
      });
    }

    return data;
  };

  const sections = [
    { id: 'general', name: 'General', icon: GlobeAltIcon },
    { id: 'theme', name: 'Theme', icon: PaintBrushIcon },
    { id: 'features', name: 'Features', icon: CogIcon },
    { id: 'social', name: 'Social Media', icon: LinkIcon },
    { id: 'seo', name: 'SEO', icon: MagnifyingGlassIcon },
  ];

  const renderGeneralSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Site Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input
              type="text"
              name="site.name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.name}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              name="site.contact_email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.contact_email}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              name="site.contact_phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.contact_phone}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              name="site.logo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.logo}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
          <textarea
            rows={3}
            name="site.description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            defaultValue={siteConfig.site?.description}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              name="site.address.line1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.line1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              type="text"
              name="site.address.line2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.line2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="site.address.city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.city}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              name="site.address.state"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.state}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              name="site.address.pincode"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.pincode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="site.address.country"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={siteConfig.site?.address?.country}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Color Scheme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="theme.primary_color"
                className="h-10 w-16 border border-gray-300 rounded-md"
                defaultValue={siteConfig.theme?.primary_color}
                onChange={(e) => {
                  const textInput = e.target.nextElementSibling as HTMLInputElement;
                  if (textInput) textInput.value = e.target.value;
                }}
              />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={siteConfig.theme?.primary_color}
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="theme.secondary_color"
                className="h-10 w-16 border border-gray-300 rounded-md"
                defaultValue={siteConfig.theme?.secondary_color}
                onChange={(e) => {
                  const textInput = e.target.nextElementSibling as HTMLInputElement;
                  if (textInput) textInput.value = e.target.value;
                }}
              />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={siteConfig.theme?.secondary_color}
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="theme.accent_color"
                className="h-10 w-16 border border-gray-300 rounded-md"
                defaultValue={siteConfig.theme?.accent_color}
                onChange={(e) => {
                  const textInput = e.target.nextElementSibling as HTMLInputElement;
                  if (textInput) textInput.value = e.target.value;
                }}
              />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue={siteConfig.theme?.accent_color}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Typography & Layout</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
            <select name="theme.font_family" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" defaultValue={siteConfig.theme?.font_family}>
              <option value="Inter, sans-serif">Inter</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Open Sans, sans-serif">Open Sans</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
            <select name="theme.layout" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" defaultValue={siteConfig.theme?.layout}>
              <option value="standard">Standard</option>
              <option value="wide">Wide</option>
              <option value="boxed">Boxed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Toggles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(siteConfig.features || {}).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-medium text-gray-900 capitalize">
                {key.replace(/_/g, ' ').replace(' enabled', '')}
              </h4>
              <p className="text-sm text-gray-500">
                {key.includes('wishlist') && 'Allow users to save products for later'}
                {key.includes('reviews') && 'Enable product reviews and ratings'}
                {key.includes('chat') && 'Live chat support for customers'}
                {key.includes('notifications') && 'Push notifications for users'}
                {key.includes('newsletter') && 'Email newsletter subscriptions'}
                {key.includes('social_login') && 'Login with social media accounts'}
                {key.includes('guest_checkout') && 'Checkout without creating account'}
                {key.includes('multi_currency') && 'Support multiple currencies'}
                {key.includes('inventory') && 'Track product stock levels'}
                {key.includes('promotional') && 'Display promotional banners'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name={`features.${key}`} className="sr-only peer" defaultChecked={Boolean(value)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialSection = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
      <div className="space-y-4">
        {Object.entries(siteConfig.social || {}).map(([platform, url]) => (
          <div key={platform}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {platform.replace('_url', '')} URL
            </label>
            <input
              type="url"
              name={`social.${platform}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              defaultValue={String(url)}
              placeholder={`https://${platform.replace('_url', '')}.com/your-page`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderSEOSection = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
          <input
            type="text"
            name="seo.meta_title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            defaultValue={siteConfig.seo?.meta_title}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
          <textarea
            rows={3}
            name="seo.meta_description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            defaultValue={siteConfig.seo?.meta_description}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
          <input
            type="text"
            name="seo.meta_keywords"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            defaultValue={siteConfig.seo?.meta_keywords?.join(', ')}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image</label>
          <input
            type="url"
            name="seo.og_image"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            defaultValue={siteConfig.seo?.og_image}
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSection();
      case 'theme':
        return renderThemeSection();
      case 'features':
        return renderFeaturesSection();
      case 'social':
        return renderSocialSection();
      case 'seo':
        return renderSEOSection();
      default:
        return renderGeneralSection();
    }
  };

  return (
    <form ref={formRef} className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {section.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Section Content */}
      {renderContent()}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            const formData = collectFormData();
            console.log('Collected form data:', formData);
            updateSiteConfigMutation.mutate(formData);
          }}
          disabled={updateSiteConfigMutation.isPending}
        >
          {updateSiteConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default SiteSettings;