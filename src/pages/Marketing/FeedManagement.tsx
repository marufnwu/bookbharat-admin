import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  Globe,
  FileText,
  Rss
} from 'lucide-react';

// API service
import { adminApi } from '../../services/adminApi';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

// Types
interface FeedInfo {
  type: 'google_shopping' | 'facebook_catalog' | 'rss';
  name: string;
  description: string;
  url: string;
  status: 'active' | 'inactive' | 'generating' | 'error';
  lastGenerated: string | null;
  productCount: number;
  fileSize: string | null;
  enabled: boolean;
}

interface FeedStatusResponse {
  success: boolean;
  data: {
    feeds: FeedInfo[];
    lastUpdated: string;
  };
}

interface GenerateFeedResponse {
  success: boolean;
  data: {
    message: string;
    feed: FeedInfo;
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

const FeedManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Fetch feed status
  const { data: feedStatus, isLoading, error, refetch } = useQuery<FeedStatusResponse>({
    queryKey: ['feed-status'],
    queryFn: async () => {
      const response = await adminApi.getFeedStatus();
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Generate feed mutation
  const generateFeedMutation = useMutation<GenerateFeedResponse, Error, string>({
    mutationFn: async (feedType: string) => {
      const response = await adminApi.generateFeed(feedType);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ['feed-status'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate feed');
    },
  });

  // Test feed URL mutation
  const testFeedMutation = useMutation<TestFeedResponse, Error, string>({
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
      toast.error(error.message || 'Failed to test feed URL');
    },
  });

  const handleGenerateFeed = (feedType: string) => {
    generateFeedMutation.mutate(feedType);
  };

  const handleTestFeed = (url: string) => {
    testFeedMutation.mutate(url);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('Feed URL copied to clipboard');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const getFeedIcon = (type: string) => {
    switch (type) {
      case 'google_shopping':
        return <Globe className="h-6 w-6 text-blue-600" />;
      case 'facebook_catalog':
        return <ShoppingBag className="h-6 w-6 text-blue-600" />;
      case 'rss':
        return <Rss className="h-6 w-6 text-orange-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
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
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

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
                {getStatusBadge(feed.status)}
              </div>

              {/* Feed Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className="text-sm text-gray-900">{feed.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Products:</span>
                  <span className="text-sm text-gray-900">{feed.productCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">File Size:</span>
                  <span className="text-sm text-gray-900">{formatFileSize(feed.fileSize ? parseInt(feed.fileSize) : null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Last Generated:</span>
                  <span className="text-sm text-gray-900">{formatDate(feed.lastGenerated)}</span>
                </div>
              </div>

              {/* Feed URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feed URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feed.url}
                    readOnly
                    className="flex-1 block w-full text-sm border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUrl(feed.url)}
                    className="relative"
                  >
                    {copiedUrl === feed.url ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(feed.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestFeed(feed.url)}
                    disabled={testFeedMutation.isPending}
                  >
                    {testFeedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => handleGenerateFeed(feed.type)}
                  disabled={generateFeedMutation.isPending || !feed.enabled}
                  loading={generateFeedMutation.isPending}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Feed
                </Button>
              </div>

              {/* Status Message */}
              {feed.status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-2">
                      <p className="text-sm text-red-800">
                        Feed generation failed. Please check your configuration and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {feed.status === 'generating' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                    <div className="ml-2">
                      <p className="text-sm text-yellow-800">
                        Feed is currently being generated. This may take a few minutes...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {feeds.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No feeds configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by configuring your product feeds in the marketing settings.
          </p>
          <div className="mt-6">
            <Button onClick={() => window.location.href = '/marketing/settings'}>
              Configure Feed Settings
            </Button>
          </div>
        </div>
      )}

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
                <li><strong>Google Shopping:</strong> Display your products on Google Shopping search results</li>
                <li><strong>Facebook Catalog:</strong> Create product catalogs for Facebook and Instagram ads</li>
                <li><strong>RSS Feed:</strong> Provide product data to RSS readers and comparison sites</li>
              </ul>
              <p className="mt-2">
                Feeds are automatically updated every 6 hours, but you can manually generate them anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedManagement;