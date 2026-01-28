import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProvidersApi } from '../../api/aiProviders';
import { aiTasksApi } from '../../api/aiTasks';
import toast from 'react-hot-toast';
import {
  Plus,
  Loader2,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  Star,
} from 'lucide-react';
import type { AiProvider } from '../../types/ai';

const AiProvidersPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const queryClient = useQueryClient();

  // Fetch providers
  const { data: providersData, isLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.getAll,
  });

  // Fetch usage stats
  const { data: statsData } = useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: aiTasksApi.getUsageStats,
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: aiProvidersApi.test,
    onSuccess: () => {
      toast.success('Connection test successful!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Connection test failed');
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: aiProvidersApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('Provider status updated');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: aiProvidersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('Provider deleted successfully');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: aiProvidersApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('Default provider updated');
    },
  });

  const handleEdit = (provider: AiProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const providers = providersData?.data || [];
  const stats = statsData?.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            AI Providers
          </h1>
          <p className="text-gray-600 mt-1">Configure AI providers for content generation</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Provider
        </button>
      </div>

      {/* Usage Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={stats.total_tasks}
            icon={<Sparkles className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${((stats.successful_tasks / stats.total_tasks) * 100).toFixed(1)}%`}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Total Tokens"
            value={stats.total_tokens.toLocaleString()}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Total Cost"
            value={`$${stats.total_cost.toFixed(4)}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="orange"
          />
        </div>
      )}

      {/* Providers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No AI providers configured. Click "Add Provider" to get started.
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {provider.is_default && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {provider.display_name}
                          </div>
                          <div className="text-sm text-gray-500">{provider.provider_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{provider.model}</td>
                    <td className="px-6 py-4">
                      {provider.is_enabled ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{provider.priority}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {provider.usage_stats.total_requests} requests
                      <br />
                      {provider.usage_stats.total_tokens.toLocaleString()} tokens
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => testMutation.mutate(provider.id)}
                          disabled={testMutation.isPending}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Test Connection"
                        >
                          {testMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(provider.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          title={provider.is_enabled ? 'Disable' : 'Enable'}
                        >
                          {provider.is_enabled ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        {!provider.is_default && (
                          <button
                            onClick={() => setDefaultMutation.mutate(provider.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Set as Default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(provider)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // eslint-disable-next-line no-restricted-globals
                            if (confirm('Are you sure you want to delete this provider?')) {
                              deleteMutation.mutate(provider.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ProviderFormModal
          provider={editingProvider}
          supportedProviders={providersData?.supported_providers || []}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>{icon}</div>
      </div>
    </div>
  );
};

// Provider Form Modal Component
const ProviderFormModal: React.FC<{
  provider: AiProvider | null;
  supportedProviders: string[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ provider, supportedProviders, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    provider_name: provider?.provider_name || 'openai',
    display_name: provider?.display_name || '',
    api_key: '',
    api_endpoint: provider?.api_endpoint || '',
    model: provider?.model || '',
    temperature: provider?.configuration?.temperature || 0.7,
    max_tokens: provider?.configuration?.max_tokens || 2000,
    priority: provider?.priority || 1,
    is_enabled: provider?.is_enabled ?? true,
  });

  const mutation = useMutation({
    mutationFn: provider
      ? (data: any) => aiProvidersApi.update(provider.id, data)
      : aiProvidersApi.create,
    onSuccess: () => {
      toast.success(provider ? 'Provider updated!' : 'Provider created!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save provider');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      configuration: {
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {provider ? 'Edit Provider' : 'Add New Provider'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider Type
              </label>
              <select
                value={formData.provider_name}
                onChange={(e) =>
                  setFormData({ ...formData, provider_name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!!provider}
              >
                {supportedProviders.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key {!provider && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder={provider ? 'Leave blank to keep existing' : ''}
              required={!provider}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., gpt-4, gemini-pro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint (Optional)
              </label>
              <input
                type="text"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) =>
                  setFormData({ ...formData, max_tokens: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_enabled}
              onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable this provider</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {provider ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiProvidersPage;
