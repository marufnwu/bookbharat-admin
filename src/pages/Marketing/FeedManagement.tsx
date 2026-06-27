import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import {
  ShoppingBag,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  Globe,
  FileText,
  Rss,
  Settings,
  X,
  FileCode,
  Layers,
  ChevronDown
} from 'lucide-react';

// API service
import { adminApi } from '../../services/adminApi';
import { api } from '../../api/axios';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

const formatToFile: Record<string, { name: string; ext: string }> = {
  'google_shopping xml': { name: 'google-shopping', ext: 'xml' },
  'google_shopping json': { name: 'google-shopping', ext: 'json' },
  'facebook_catalog xml': { name: 'facebook-catalog', ext: 'xml' },
  'facebook_catalog json': { name: 'facebook-catalog', ext: 'json' },
  'rss products': { name: 'rss', ext: 'xml' },
};

// Types
interface FeedFormat {
  url: string;
  status: 'active' | 'inactive' | 'generating' | 'error' | 'disabled' | 'not_generated';
  lastGenerated: string | null;
  fileSize: string | null;
}

interface FeedInfo {
  type: 'google_shopping' | 'facebook_catalog' | 'rss';
  name: string;
  description: string;
  enabled: boolean;
  productCount: number;
  formats: Record<string, FeedFormat>;
}

interface ProductCollection {
  id: number;
  name: string;
  slug: string;
  type: 'manual' | 'rule_based';
  product_count: number;
}

interface FeedStatusResponse {
  success: boolean;
  data: {
    frontend_url?: string;
    feeds: FeedInfo[];
    lastUpdated: string;
    overall: {
      total_feeds: number;
      enabled_feeds: number;
      active_formats: number;
      total_formats: number;
      last_updated: string | null;
    };
  };
}

interface TestFeedResponse {
  success: boolean;
  data: {
    message: string;
    status: number;
    accessible: boolean;
  };
}

interface FeedSettings {
  feeds: {
    google_shopping: { enabled: boolean };
    facebook_catalog: { enabled: boolean };
    rss: { enabled: boolean };
  };
}

const defaultFeedSettings: FeedSettings = {
  feeds: {
    google_shopping: { enabled: false },
    facebook_catalog: { enabled: false },
    rss: { enabled: false },
  },
};

const formatLabels: Record<string, string> = {
  xml: 'XML',
  json: 'JSON',
  products: 'Products',
  categories: 'Categories',
  deals: 'Deals',
  new: 'New Arrivals',
  sitemap: 'Sitemap',
};

const FeedManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [feedSettings, setFeedSettings] = useState<FeedSettings>(defaultFeedSettings);
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string | undefined>(undefined);

  // Fetch feed settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['marketing-settings'],
    queryFn: async () => {
      const response = await api.get('/marketing/settings');
      return response.data;
    },
    enabled: showSettings,
  });

  // Update settings state when data changes
  React.useEffect(() => {
    if (settingsData?.feeds) {
      setFeedSettings({
        feeds: {
          google_shopping: { enabled: settingsData.feeds?.google_shopping?.enabled ?? false },
          facebook_catalog: { enabled: settingsData.feeds?.facebook_catalog?.enabled ?? false },
          rss: { enabled: settingsData.feeds?.rss?.enabled ?? false },
        },
      });
    } else if (settingsData && !settingsData.feeds) {
      setFeedSettings(defaultFeedSettings);
    }
  }, [settingsData]);

  // Save feed settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: FeedSettings) => {
      const response = await api.post('/marketing/settings', settings);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Feed settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['feed-status'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
      setShowSettings(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  // Fetch feed status
  const { data: feedStatus, isLoading, error, refetch } = useQuery<FeedStatusResponse>({
    queryKey: ['feed-status'],
    queryFn: async () => {
      const response = await adminApi.getFeedStatus();
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch collections
  const { data: collectionsData } = useQuery({
    queryKey: ['product-collections'],
    queryFn: async () => {
      const response = await adminApi.getProductCollections({ is_active: true });
      return response.data;
    },
  });

  const collections: ProductCollection[] = collectionsData?.data || [];

  // Fetch collection product count when a collection is selected
  const { data: collectionDetail } = useQuery({
    queryKey: ['product-collection-detail', selectedCollectionSlug],
    queryFn: async () => {
      if (!selectedCollectionSlug) return null;
      const collection = collections.find(c => c.slug === selectedCollectionSlug);
      if (!collection) return null;
      const response = await adminApi.getProductCollection(collection.id);
      return response.data;
    },
    enabled: !!selectedCollectionSlug && collections.length > 0,
  });

  const collectionProductCount = collectionDetail?.data?.products?.length ?? 0;

  // Test feed URL mutation
  const testFeedMutation = useMutation<TestFeedResponse, any, string>({
    mutationFn: async (url: string) => {
      const response = await adminApi.testFeedUrl(url);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.accessible) {
        toast.success(`Feed is accessible: ${data.data.message}`);
      } else {
        toast.error(`Feed is not accessible: ${data.data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to test feed URL');
    },
  });

  const handleTestFeed = (url: string) => {
    testFeedMutation.mutate(url);
  };

  const handleCopyUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('Feed URL copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(feedSettings);
  };

  const getFeedIcon = (type: string) => {
    switch (type) {
      case 'google_shopping':
        return <Globe className="h-6 w-6 text-blue-600" />;
      case 'facebook_catalog':
        return <ShoppingBag className="h-6 w-6 text-indigo-600" />;
      case 'rss':
        return <Rss className="h-6 w-6 text-orange-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const getFormatIcon = (format: string) => {
    if (format === 'json') {
      return <FileCode className="h-4 w-4 text-green-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'generating':
        return <Badge variant="warning">Generating</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'disabled':
        return <Badge variant="default">Disabled</Badge>;
      case 'not_generated':
        return <Badge variant="default">Not Generated</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const formatFileSize = (size: string | null): string => {
    if (!size) return 'N/A';
    return size;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading feed status</h3>
            <div className="mt-2 text-sm text-red-700">
              Failed to load feed information. Please try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const feeds = feedStatus?.data?.feeds || [];
  const overall = feedStatus?.data?.overall;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Feed Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product feeds for Google Shopping, Facebook, and other platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Feed Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      {overall && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-900">{overall.total_feeds}</div>
            <div className="text-sm text-gray-500">Total Feeds</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-semibold text-green-600">{overall.enabled_feeds}</div>
            <div className="text-sm text-gray-500">Enabled</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-semibold text-blue-600">{overall.active_formats}</div>
            <div className="text-sm text-gray-500">Active Formats</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-900">{overall.total_formats}</div>
            <div className="text-sm text-gray-500">Total Formats</div>
          </div>
        </div>
      )}

      {/* Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {feeds.map((feed) => (
          <div key={feed.type} className="bg-white shadow rounded-lg">
            <div className="p-6">
              {/* Feed Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getFeedIcon(feed.type)}
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{feed.name}</h3>
                    <p className="text-sm text-gray-500">{feed.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${feed.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {feed.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Feed Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Products:</span>
                  <span className="text-sm text-gray-900">
                    {selectedCollectionSlug
                      ? collectionProductCount.toLocaleString()
                      : feed.productCount.toLocaleString()}
                  </span>
                </div>
                {selectedCollectionSlug && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">in collection</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Formats:</span>
                  <span className="text-sm text-gray-900">{Object.keys(feed.formats).length}</span>
                </div>
              </div>

              {/* Formats List */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Available Formats
                </label>
                {Object.entries(feed.formats).map(([format, formatData]) => (
                  <div key={format} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getFormatIcon(format)}
                        <span className="text-sm font-medium text-gray-900">
                          {formatLabels[format] || format.toUpperCase()}
                        </span>
                        {getStatusBadge(formatData.status)}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Size: {formatFileSize(formatData.fileSize)} | Generated: {formatDate(formatData.lastGenerated)}
                    </div>

                    {/* Format URL */}
                    {(() => {
                      const formatKey = `${feed.type} ${format}`;
                      const baseFile = formatToFile[formatKey];
                      const selectedCollection = selectedCollectionSlug
                        ? collections.find(c => c.slug === selectedCollectionSlug)
                        : null;
                      const frontendUrl = feedStatus?.data?.frontend_url
                        || (() => {
                            try {
                              return new URL(formatData.url).origin;
                            } catch {
                              return '';
                            }
                          })();
                      const collectionUrl = selectedCollection && baseFile && frontendUrl
                        ? `${frontendUrl}/feeds/collections/${selectedCollection.slug}/${baseFile.name}.${baseFile.ext}`
                        : formatData.url;
                      const urlKey = `${feed.type}-${format}-${selectedCollectionSlug || 'all'}`;
                      return (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={collectionUrl}
                        readOnly
                        className="flex-1 block w-full text-xs border-gray-300 rounded-md bg-white px-2 py-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyUrl(collectionUrl, urlKey)}
                        className="p-1"
                      >
                        {copiedKey === urlKey ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(collectionUrl, '_blank')}
                        className="p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestFeed(collectionUrl)}
                        disabled={testFeedMutation.isPending}
                        className="p-1"
                      >
                        {testFeedMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </Button>
                    </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <select
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') {
                        setSelectedCollectionSlug(undefined);
                      } else {
                        setSelectedCollectionSlug(value);
                      }
                    }}
                    value={selectedCollectionSlug || 'all'}
                  >
                    <option value="all">All Products</option>
                    {collections.map(collection => (
                      <option key={collection.id} value={collection.slug}>
                        {collection.name} ({collection.product_count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/marketing/collections`, '_blank')}
                    title="Manage Collections"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Manage Collections
                  </Button>
                </div>
                {selectedCollectionSlug && (
                  <p className="text-xs text-indigo-600">
                    Showing feed for collection: {collections.find(c => c.slug === selectedCollectionSlug)?.name}
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {!feed.enabled && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <div className="ml-2">
                      <p className="text-sm text-gray-800">
                        This feed is disabled. Enable it in Feed Settings to serve.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Product Feeds</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Product feeds allow you to syndicate your product catalog to various platforms:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Google Shopping:</strong> XML for Google Merchant Center, JSON for dynamic ads</li>
                <li><strong>Facebook Catalog:</strong> XML/JSON for Facebook/Meta product catalogs</li>
                <li><strong>RSS Feed:</strong> Products, Categories, Deals, New Arrivals, and Sitemap</li>
              </ul>
              <p className="mt-2">
                Feeds are generated on-demand at runtime. Select a collection to filter products for targeted ad campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Product Feed Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-4">
                Enable or disable product feeds for external platforms.
              </p>
              <div className="space-y-4">
                {/* Google Shopping */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Google Shopping</p>
                    <p className="text-xs text-gray-500">Enable Google Shopping product feed</p>
                  </div>
                  <button
                    onClick={() => setFeedSettings(prev => ({
                      ...prev,
                      feeds: { ...prev.feeds, google_shopping: { enabled: !prev.feeds.google_shopping.enabled } }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feedSettings.feeds.google_shopping.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feedSettings.feeds.google_shopping.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Facebook Catalog */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Facebook Catalog</p>
                    <p className="text-xs text-gray-500">Enable Facebook/Meta product catalog feed</p>
                  </div>
                  <button
                    onClick={() => setFeedSettings(prev => ({
                      ...prev,
                      feeds: { ...prev.feeds, facebook_catalog: { enabled: !prev.feeds.facebook_catalog.enabled } }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feedSettings.feeds.facebook_catalog.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feedSettings.feeds.facebook_catalog.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* RSS Feed */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">RSS Feed</p>
                    <p className="text-xs text-gray-500">Enable RSS product feed</p>
                  </div>
                  <button
                    onClick={() => setFeedSettings(prev => ({
                      ...prev,
                      feeds: { ...prev.feeds, rss: { enabled: !prev.feeds.rss.enabled } }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feedSettings.feeds.rss.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feedSettings.feeds.rss.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                loading={saveSettingsMutation.isPending}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
