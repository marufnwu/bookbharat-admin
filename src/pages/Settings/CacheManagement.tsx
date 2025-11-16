import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface CacheTag {
  tag: string;
  description: string;
}

interface CacheInfo {
  available_tags: Record<string, string>;
  cache_driver: string;
  frontend_url: string;
}

const CacheManagement: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState('');

  useEffect(() => {
    fetchCacheInfo();
  }, []);

  const fetchCacheInfo = async () => {
    try {
      const response = await api.get('/cache');
      setCacheInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching cache info:', error);
      toast.error('Failed to load cache information');
    }
  };

  const handleInvalidateTag = async (tag: string) => {
    setLoading(true);
    try {
      const response = await api.post('/cache/invalidate-tag', { tag });
      if (response.data.success) {
        toast.success(`Cache cleared successfully for: ${tag}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL cache? This may temporarily slow down the website.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cache/invalidate-all');
      if (response.data.success) {
        toast.success('All cache cleared successfully!');
        setSelectedTags([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear all cache');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateMultiple = async () => {
    if (selectedTags.length === 0) {
      toast.error('Please select at least one cache tag');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cache/invalidate-multiple', { tags: selectedTags });
      if (response.data.success) {
        toast.success(`Cleared cache for ${selectedTags.length} tags`);
        setSelectedTags([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear selected caches');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidatePath = async () => {
    if (!customPath) {
      toast.error('Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cache/invalidate-path', { path: customPath });
      if (response.data.success) {
        toast.success(`Cache cleared for path: ${customPath}`);
        setCustomPath('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear path cache');
    } finally {
      setLoading(false);
    }
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!cacheInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cache Management</h1>
        <p className="text-gray-600">Manage frontend and backend cache invalidation</p>
      </div>

      {/* Cache Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Cache Information</h3>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Cache Driver:</span> {cacheInfo.cache_driver}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Frontend URL:</span> {cacheInfo.frontend_url || 'Not configured'}
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Cache Button */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Clear All Cache</h2>
            <p className="text-sm text-gray-600">Clear both backend and frontend cache completely</p>
          </div>
          <button
            onClick={handleInvalidateAll}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Clearing...' : 'Clear All Cache'}
          </button>
        </div>
      </div>

      {/* Cache Tags */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cache Tags</h2>
          {selectedTags.length > 0 && (
            <button
              onClick={handleInvalidateMultiple}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Clear Selected ({selectedTags.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(cacheInfo.available_tags).map(([tag, description]) => (
            <div
              key={tag}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedTags.includes(tag)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTagSelection(tag)}
                      className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <h3 className="font-semibold text-gray-900">{tag}</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-7">{description}</p>
                </div>
                <button
                  onClick={() => handleInvalidateTag(tag)}
                  disabled={loading}
                  className="ml-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Path Invalidation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clear Specific Path</h2>
        <p className="text-sm text-gray-600 mb-4">
          Clear cache for a specific frontend path (e.g., /products/book-name)
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="/products/example"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleInvalidatePath}
            disabled={loading || !customPath}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Clear Path
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheManagement;
