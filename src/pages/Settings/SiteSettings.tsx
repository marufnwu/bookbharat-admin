import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PhotoIcon,
  PhoneIcon,
  ClockIcon,
  PaintBrushIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  CogIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardContent, PageSkeleton } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { settingsApi } from '../../api';
import { api } from '../../api/axios';
import type { ApiResponse } from '../../types';
import ImageUploader from '../../components/ImageUploader';
import DynamicSettings from '../../components/settings/DynamicSettings';
import {
  buildSettingsGroupsParams,
  filterGroupsByWhitelist,
  readRuntimeOverrides,
  applyRuntimeOverride,
  SITE_SETTINGS_PAGE_CONTEXT,
  SETTINGS_GROUPS,
} from '../../constants/settings';

interface SiteConfig {
  site: {
    name: string;
    description: string;
    logo: string;
    favicon: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    google_maps_embed: string;
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
  business_hours: {
    weekday_hours: string;
    saturday_hours: string;
    sunday_closed: boolean;
    sunday_hours: string;
    timezone: string;
  };
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';
const selectClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';

const SiteSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('brand');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  // Hardcoded sections with custom UI (logo uploader, color picker, etc.).
  // Anything added to /config/settings/{group}.php on the backend is appended
  // below automatically via the dynamic sections — no admin code change needed.
  const HARDCODED_SECTION_IDS = ['brand', 'contact', 'hours', 'theme', 'social', 'seo', 'features'];

  // Read runtime overrides from the URL — useful for debugging the filter
  // without editing the constants file. e.g. /settings/site?groups=android_app
  const runtimeOverrides = useMemo(() => readRuntimeOverrides(), []);
  const effectiveContext = runtimeOverrides.noFilter
    ? ([] as readonly string[])
    : applyRuntimeOverride(SITE_SETTINGS_PAGE_CONTEXT, runtimeOverrides.context);
  const effectiveGroups = runtimeOverrides.noFilter
    ? ([] as readonly string[])
    : applyRuntimeOverride(SETTINGS_GROUPS, runtimeOverrides.groups);

  const requestUrl = useMemo(() => {
    const params = buildSettingsGroupsParams({
      context: effectiveContext,
      groups: effectiveGroups,
    });
    const qs = new URLSearchParams(params).toString();
    return qs ? `/settings/groups?${qs}` : '/settings/groups (no filters)';
  }, [effectiveContext, effectiveGroups]);

  // Fetch every dynamic settings group from the backend. New groups registered
  // in config/settings/*.php appear here without touching this file.
  // The context and whitelist come from `constants/settings.ts` — edit those
  // values to control which groups this page shows. Runtime overrides via
  // ?context=...&groups=...&nofilter=1 are also supported.
  const { data: groupsData, isFetching } = useQuery({
    queryKey: ['settings', 'groups', 'site', effectiveContext.join(','), effectiveGroups.join(',')],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      // eslint-disable-next-line no-console
      console.log('[SiteSettings] requesting', requestUrl);
      const res = await api.get('/settings/groups', {
        params: buildSettingsGroupsParams({
          context: effectiveContext,
          groups: effectiveGroups,
        }),
      });
      const raw = (res.data?.data ?? {}) as Record<string, { label: string; description: string; icon: string; sort_order: number; field_count: number }>;
      // eslint-disable-next-line no-console
      console.log('[SiteSettings] backend returned', Object.keys(raw).length, 'groups:', Object.keys(raw));
      const filtered = filterGroupsByWhitelist(raw, effectiveGroups);
      // eslint-disable-next-line no-console
      console.log('[SiteSettings] after whitelist:', Object.keys(filtered).length, 'groups:', Object.keys(filtered));
      return filtered;
    },
  });

  const dynamicSections = groupsData
    ? Object.entries(groupsData)
        .filter(([key]) => !HARDCODED_SECTION_IDS.includes(key))
        .sort(([, a], [, b]) => a.sort_order - b.sort_order)
        .map(([key, group]) => ({
          id: key,
          name: group.label,
          icon: Squares2X2Icon,
          description: group.description,
        }))
    : [];

  const sections = [
    { id: 'brand', name: 'Brand Identity', icon: PhotoIcon, description: 'Name, logo & description' },
    { id: 'contact', name: 'Contact Info', icon: PhoneIcon, description: 'Phone, email & address' },
    { id: 'hours', name: 'Business Hours', icon: ClockIcon, description: 'Opening hours & timezone' },
    { id: 'theme', name: 'Theme', icon: PaintBrushIcon, description: 'Colors & typography' },
    { id: 'social', name: 'Social Media', icon: LinkIcon, description: 'Platform URLs' },
    { id: 'seo', name: 'SEO', icon: MagnifyingGlassIcon, description: 'Meta tags & search' },
    { id: 'features', name: 'Features', icon: CogIcon, description: 'Toggle features on/off' },
    ...dynamicSections,
  ];

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    // Recompute the valid sections list whenever dynamic sections load so
    // /settings/site#android_app (or any future group) can deep-link directly.
    const validSections = sections.map((s) => s.id);
    if (hash && validSections.includes(hash)) {
      setActiveSection(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsData]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
  };

  const { data: siteConfigData, isLoading: siteConfigLoading } = useQuery<ApiResponse<SiteConfig>>({
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

  useEffect(() => {
    const siteData = siteConfigData?.data?.site;
    if (siteData) {
      setLogoUrl(siteData.logo || null);
      setFaviconUrl(siteData.favicon || null);
    }
  }, [siteConfigData]);

  if (siteConfigLoading) return <PageSkeleton />;

  const siteConfig = siteConfigData?.data ?? ({} as SiteConfig);

  const collectFormData = () => {
    if (!formRef.current) return {};

    const formData = new FormData(formRef.current);
    const data: any = {
      site: {
        logo: logoUrl || '',
        favicon: faviconUrl || '',
      },
      theme: {},
      features: {},
      social: {},
      seo: {},
      business_hours: {},
    };

    Array.from(formData.entries()).forEach(([key, value]) => {
      const [section, field] = key.split('.');

      if (section === 'site' && field === 'address') {
        const addressField = key.split('.')[2];
        if (!data.site.address) data.site.address = {};
        data.site.address[addressField] = value;
      } else if (section === 'features') {
        data[section][field] = value === 'on';
      } else if (section === 'seo' && field === 'meta_keywords') {
        data[section][field] = String(value).split(',').map(k => k.trim()).filter(k => k);
      } else if (section && field) {
        data[section][field] = value;
      }
    });

    if (data.business_hours && data.business_hours.sunday_closed === undefined) {
      data.business_hours.sunday_closed = false;
    }
    if (siteConfig.features) {
      Object.keys(siteConfig.features).forEach(key => {
        if (data.features[key] === undefined) {
          data.features[key] = false;
        }
      });
    }

    return data;
  };

  const handleSave = () => {
    const formData = collectFormData();
    updateSiteConfigMutation.mutate(formData);
  };

  // ── Section Renderers ──────────────────────────────────────────

  const renderBrandSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PhotoIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Site Identity</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">How your store appears to customers</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input type="text" name="site.name" className={inputClass} defaultValue={siteConfig.site?.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
              <textarea
                rows={3}
                name="site.description"
                className={inputClass}
                defaultValue={siteConfig.site?.description}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PhotoIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Logo & Favicon</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Used in header, browser tab, and search results</p>
          <div className="space-y-4">
            <div>
              <ImageUploader
                label="Site Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                maxSizeMB={2}
                folder="site"
              />
              <p className="text-xs text-gray-500 mt-1">PNG or SVG, max 2MB. Best: 200x50px</p>
            </div>
            <div>
              <ImageUploader
                label="Favicon"
                value={faviconUrl}
                onChange={setFaviconUrl}
                accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg"
                maxSizeMB={1}
                folder="site"
              />
              <p className="text-xs text-gray-500 mt-1">ICO or PNG, max 1MB. Best: 32x32px</p>
            </div>
          </div>
          {(logoUrl || faviconUrl) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                  </div>
                )}
                {faviconUrl && (
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={faviconUrl} alt="Favicon" className="h-5 w-5 object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContactSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PhoneIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Contact Details</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Shown on contact page, footer, and support emails</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" name="site.contact_email" className={inputClass} defaultValue={siteConfig.site?.email} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="tel" name="site.contact_phone" className={inputClass} defaultValue={siteConfig.site?.phone} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PhoneIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Business Address</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Used in contact page, invoices, and search engine listings</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input type="text" name="site.address.line1" className={inputClass} defaultValue={siteConfig.site?.address} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
              <input type="text" name="site.address.line2" className={inputClass} defaultValue="" placeholder="Apartment, suite, unit, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" name="site.city" className={inputClass} defaultValue={siteConfig.site?.city} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" name="site.state" className={inputClass} defaultValue={siteConfig.site?.state} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input type="text" name="site.pincode" className={inputClass} defaultValue={siteConfig.site?.pincode} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" name="site.country" className={inputClass} defaultValue={siteConfig.site?.country} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed Code</label>
              <textarea
                name="site.google_maps_embed"
                rows={4}
                className={inputClass}
                defaultValue={siteConfig.site?.google_maps_embed}
                placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              />
              <p className="text-xs text-gray-500 mt-1">Paste your Google Maps embed iframe code here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHoursSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Business Hours</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Displayed on contact page, help center, and search engine listings</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekday Hours (Mon–Fri)</label>
              <input
                type="text"
                name="business_hours.weekday_hours"
                className={inputClass}
                defaultValue={siteConfig.business_hours?.weekday_hours || '9:00 AM - 6:00 PM'}
                placeholder="e.g. 9:00 AM - 6:00 PM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saturday Hours</label>
                <input
                  type="text"
                  name="business_hours.saturday_hours"
                  className={inputClass}
                  defaultValue={siteConfig.business_hours?.saturday_hours || '9:00 AM - 6:00 PM'}
                  placeholder="e.g. 9:00 AM - 6:00 PM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sunday Hours</label>
                <input
                  type="text"
                  name="business_hours.sunday_hours"
                  className={inputClass}
                  defaultValue={siteConfig.business_hours?.sunday_hours || 'Closed'}
                  placeholder="e.g. Closed or 10:00 AM - 2:00 PM"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                name="business_hours.timezone"
                className={selectClass}
                defaultValue={siteConfig.business_hours?.timezone || 'Asia/Kolkata'}
              >
                <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <label className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                name="business_hours.sunday_closed"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                defaultChecked={siteConfig.business_hours?.sunday_closed !== false}
              />
              <span className="text-sm text-gray-700">Closed on Sunday</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <h3 className="text-base font-semibold text-gray-900">Hours Preview</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Monday – Friday</span>
              <span className="font-medium text-gray-900">{siteConfig.business_hours?.weekday_hours || '9:00 AM - 6:00 PM'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Saturday</span>
              <span className="font-medium text-gray-900">{siteConfig.business_hours?.saturday_hours || '9:00 AM - 6:00 PM'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Sunday</span>
              <span className="font-medium text-gray-400">
                {siteConfig.business_hours?.sunday_closed !== false ? 'Closed' : (siteConfig.business_hours?.sunday_hours || 'Closed')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderThemeSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PaintBrushIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Color Scheme</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Brand colors used across the storefront</p>
          <div className="space-y-4">
            {[
              { name: 'theme.primary_color', label: 'Primary', value: siteConfig.theme?.primary_color },
              { name: 'theme.secondary_color', label: 'Secondary', value: siteConfig.theme?.secondary_color },
              { name: 'theme.accent_color', label: 'Accent', value: siteConfig.theme?.accent_color },
            ].map((color) => (
              <div key={color.name} className="flex items-center gap-4">
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700">{color.label}</label>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="color"
                    name={color.name}
                    className="h-9 w-12 border border-gray-300 rounded-md cursor-pointer"
                    defaultValue={color.value}
                    onChange={(e) => {
                      const textInput = e.target.nextElementSibling as HTMLInputElement;
                      if (textInput) textInput.value = e.target.value;
                    }}
                  />
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                    defaultValue={color.value}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <PaintBrushIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Typography & Layout</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Font and overall page layout</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select name="theme.font_family" className={selectClass} defaultValue={siteConfig.theme?.font_family}>
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
              <select name="theme.layout" className={selectClass} defaultValue={siteConfig.theme?.layout}>
                <option value="standard">Standard</option>
                <option value="wide">Wide</option>
                <option value="boxed">Boxed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSocialSection = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">Social Media Links</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">Displayed in footer and search engine listings</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(siteConfig.social || {}).map(([platform, url]) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {platform.replace('_url', '')}
              </label>
              <input
                type="url"
                name={`social.${platform}`}
                className={inputClass}
                defaultValue={String(url)}
                placeholder={`https://${platform.replace('_url', '')}.com/your-page`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderSEOSection = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <MagnifyingGlassIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">SEO Settings</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">Controls how your store appears in search engines</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input type="text" name="seo.meta_title" className={inputClass} defaultValue={siteConfig.seo?.meta_title} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea rows={2} name="seo.meta_description" className={inputClass} defaultValue={siteConfig.seo?.meta_description} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
            <input
              type="text"
              name="seo.meta_keywords"
              className={inputClass}
              defaultValue={siteConfig.seo?.meta_keywords?.join(', ')}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image</label>
            <input type="url" name="seo.og_image" className={inputClass} defaultValue={siteConfig.seo?.og_image} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFeaturesSection = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <CogIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">Feature Toggles</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">Enable or disable storefront features</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(siteConfig.features || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm capitalize truncate">
                  {key.replace(/_/g, ' ').replace(' enabled', '')}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {key.includes('wishlist') && 'Save products for later'}
                  {key.includes('reviews') && 'Product reviews and ratings'}
                  {key.includes('chat') && 'Live chat support'}
                  {key.includes('notifications') && 'Push notifications'}
                  {key.includes('newsletter') && 'Email newsletter'}
                  {key.includes('social_login') && 'Login with social media'}
                  {key.includes('guest_checkout') && 'Checkout without account'}
                  {key.includes('multi_currency') && 'Multiple currencies'}
                  {key.includes('inventory') && 'Stock level tracking'}
                  {key.includes('promotional') && 'Promotional banners'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
                <input type="checkbox" name={`features.${key}`} className="sr-only peer" defaultChecked={Boolean(value)} />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'brand': return renderBrandSection();
      case 'contact': return renderContactSection();
      case 'hours': return renderHoursSection();
      case 'theme': return renderThemeSection();
      case 'social': return renderSocialSection();
      case 'seo': return renderSEOSection();
      case 'features': return renderFeaturesSection();
      default:
        // Anything not in the hardcoded list is a backend-managed settings
        // group (e.g. android_app, modules). Render it with the generic
        // DynamicSettings renderer using the metadata fetched from the API.
        if (dynamicSections.some((s) => s.id === activeSection)) {
          const group = groupsData?.[activeSection];
          return (
            <Card>
              <CardContent className="p-6">
                <DynamicSettings
                  group={activeSection}
                  title={group?.label ?? activeSection}
                  description={group?.description}
                />
              </CardContent>
            </Card>
          );
        }
        return renderBrandSection();
    }
  };

  return (
    <div className="space-y-4">
      {/* Debug indicator — remove once filter behavior is verified */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-900 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1 font-semibold">
          Filter debug
        </span>
        <span>
          Request: <code className="bg-white px-1 rounded">{requestUrl}</code>
        </span>
        <span>
          Whitelist ({effectiveGroups.length}):{' '}
          <code className="bg-white px-1 rounded">
            {effectiveGroups.length === 0 ? '∅ (show all)' : effectiveGroups.join(', ')}
          </code>
        </span>
        <span>
          Context ({effectiveContext.length}):{' '}
          <code className="bg-white px-1 rounded">
            {effectiveContext.length === 0 ? '∅ (all)' : effectiveContext.join(', ')}
          </code>
        </span>
        <span>
          Rendering: <code className="bg-white px-1 rounded">{sections.length} sections ({dynamicSections.length} dynamic)</code>
          {isFetching && <span className="ml-1 text-blue-600">(refetching…)</span>}
        </span>
      </div>

    <div className="flex gap-6">
      {/* Compact Left Sidebar Navigation */}
      <div className="w-52 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
          <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h2>
          </div>
          <nav className="p-1.5">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionChange(section.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all text-sm
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`flex-1 font-medium truncate ${isActive ? 'text-blue-700' : ''}`}>
                    {section.name}
                  </span>
                  <ChevronRightIcon className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <form ref={formRef} className="flex-1 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => {
                const SectionIcon = sections.find(s => s.id === activeSection)?.icon;
                return SectionIcon ? <SectionIcon className="h-5 w-5 text-blue-500" /> : null;
              })()}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {sections.find(s => s.id === activeSection)?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            {renderContent()}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateSiteConfigMutation.isPending}
            >
              {updateSiteConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
};

export default SiteSettings;
