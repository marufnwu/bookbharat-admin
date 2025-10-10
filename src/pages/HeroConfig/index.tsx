import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Layout,
  Image as ImageIcon,
  Video,
  Star,
  Award,
  TrendingUp,
  X,
  Upload
} from 'lucide-react';

interface HeroConfig {
  id: number;
  variant: string;
  title: string;
  subtitle: string | null;
  primaryCta: { text: string; href: string } | null;
  secondaryCta: { text: string; href: string } | null;
  discountBadge: { text: string; color: string } | null;
  trustBadges: string[] | null;
  backgroundImage: string | null;
  testimonials: Array<{ text: string; author: string; rating: number }> | null;
  campaignData: { title: string; offer: string; countdown: string } | null;
  categories: Array<{ id: string; name: string; image: string; href: string }> | null;
  features: Array<{ title: string; description: string; icon: string }> | null;
  stats: Array<{ label: string; value: string; icon: string }> | null;
  featuredProducts: any[] | null;
  videoUrl: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const HeroConfig: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<HeroConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<HeroConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'advanced'>('basic');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    variant: '',
    title: '',
    subtitle: '',
    primaryCta_text: '',
    primaryCta_href: '',
    secondaryCta_text: '',
    secondaryCta_href: '',
    backgroundImage: '',
    videoUrl: '',
    is_active: false,
    stats: [] as Array<{ label: string; value: string; icon: string }>,
    features: [] as Array<{ title: string; description: string; icon: string }>,
    testimonials: [] as Array<{ text: string; author: string; rating: number }>,
  });

  const queryClient = useQueryClient();

  // Fetch all configs
  const { data: configsResponse, isLoading } = useQuery({
    queryKey: ['hero-configs'],
    queryFn: async () => {
      const response = await api.get('/hero-config');
      return response.data;
    },
  });

  const configs: HeroConfig[] = configsResponse?.data || [];
  const activeConfig = configs.find(c => c.is_active);

  // Set active mutation
  const setActiveMutation = useMutation({
    mutationFn: async (variant: string) => {
      const response = await api.post('/hero-config/set-active', { variant });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-configs'] });
      toast.success('Active variant updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set active variant');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (variant: string) => {
      const response = await api.delete(`/hero-config/${variant}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-configs'] });
      toast.success('Hero configuration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete configuration');
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingConfig) {
        const response = await api.put(`/hero-config/${editingConfig.variant}`, data);
        return response.data;
      } else {
        const response = await api.post('/hero-config', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-configs'] });
      toast.success(editingConfig ? 'Configuration updated successfully' : 'Configuration created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: any = {
      variant: formData.variant,
      title: formData.title,
      subtitle: formData.subtitle || null,
      backgroundImage: formData.backgroundImage || null,
      videoUrl: formData.videoUrl || null,
      is_active: formData.is_active,
      stats: formData.stats.length > 0 ? formData.stats : null,
      features: formData.features.length > 0 ? formData.features : null,
      testimonials: formData.testimonials.length > 0 ? formData.testimonials : null,
    };

    if (formData.primaryCta_text && formData.primaryCta_href) {
      submitData.primaryCta = {
        text: formData.primaryCta_text,
        href: formData.primaryCta_href,
      };
    }

    if (formData.secondaryCta_text && formData.secondaryCta_href) {
      submitData.secondaryCta = {
        text: formData.secondaryCta_text,
        href: formData.secondaryCta_href,
      };
    }

    saveMutation.mutate(submitData);
  };

  const handleEdit = (config: HeroConfig) => {
    setEditingConfig(config);
    setFormData({
      variant: config.variant,
      title: config.title,
      subtitle: config.subtitle || '',
      primaryCta_text: config.primaryCta?.text || '',
      primaryCta_href: config.primaryCta?.href || '',
      secondaryCta_text: config.secondaryCta?.text || '',
      secondaryCta_href: config.secondaryCta?.href || '',
      backgroundImage: config.backgroundImage || '',
      videoUrl: config.videoUrl || '',
      is_active: config.is_active,
      stats: config.stats || [],
      features: config.features || [],
      testimonials: config.testimonials || [],
    });
    setShowModal(true);
  };

  const handleDelete = (config: HeroConfig) => {
    if (config.is_active) {
      toast.error('Cannot delete active configuration. Please set another variant as active first.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${config.variant}"?`)) {
      deleteMutation.mutate(config.variant);
    }
  };

  const handlePreview = (config: HeroConfig) => {
    setSelectedConfig(config);
    setShowPreviewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setActiveTab('basic');
    setFormData({
      variant: '',
      title: '',
      subtitle: '',
      primaryCta_text: '',
      primaryCta_href: '',
      secondaryCta_text: '',
      secondaryCta_href: '',
      backgroundImage: '',
      videoUrl: '',
      is_active: false,
      stats: [],
      features: [],
      testimonials: [],
    });
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Details' },
    { id: 'content' as const, label: 'Content & CTAs' },
    { id: 'advanced' as const, label: 'Media & Settings' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hero Configuration</h1>
          <p className="text-gray-600 mt-1">Manage hero variants for your homepage</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Hero Config
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900">{configs.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layout className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Variant</p>
              <p className="text-lg font-semibold text-gray-900 truncate">
                {activeConfig ? activeConfig.variant : 'None'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {activeConfig ? new Date(activeConfig.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Configs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : configs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-mono font-semibold text-gray-900">{config.variant}</p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(config.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{config.title}</p>
                        {config.subtitle && (
                          <p className="text-sm text-gray-500 truncate">{config.subtitle}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {config.backgroundImage && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <ImageIcon className="h-3 w-3" />
                            Image
                          </span>
                        )}
                        {config.videoUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <Video className="h-3 w-3" />
                            Video
                          </span>
                        )}
                        {config.features && config.features.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <Star className="h-3 w-3" />
                            {config.features.length} Features
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          config.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePreview(config)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setActiveMutation.mutate(config.variant)}
                          className={`p-1 ${
                            config.is_active
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-green-600 hover:bg-green-50'
                          } rounded`}
                          title={config.is_active ? 'Already Active' : 'Set as Active'}
                          disabled={config.is_active}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config)}
                          className={`p-1 ${
                            config.is_active
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          } rounded`}
                          title="Delete"
                          disabled={config.is_active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Layout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hero configurations found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingConfig ? 'Edit Hero Configuration' : 'Create Hero Configuration'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'basic' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="variant"
                        value={formData.variant}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., minimal-product"
                        required
                        disabled={!!editingConfig}
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Set as Active</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Premium Books at Unbeatable Prices"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                    <textarea
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Discover our curated collection..."
                    />
                  </div>
                </>
              )}

              {activeTab === 'content' && (
                <>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Primary Call-to-Action</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          name="primaryCta_text"
                          value={formData.primaryCta_text}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Shop Now"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                        <input
                          type="text"
                          name="primaryCta_href"
                          value={formData.primaryCta_href}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="/products"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Secondary Call-to-Action</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          name="secondaryCta_text"
                          value={formData.secondaryCta_text}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Learn More"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                        <input
                          type="text"
                          name="secondaryCta_href"
                          value={formData.secondaryCta_href}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="/about"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'advanced' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Image URL
                    </label>
                    <input
                      type="text"
                      name="backgroundImage"
                      value={formData.backgroundImage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/images/hero-bg.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                    <input
                      type="text"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/videos/hero.mp4"
                    />
                  </div>

                  {/* Stats Editor */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Statistics</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            stats: [...prev.stats, { label: '', value: '', icon: 'trending-up' }]
                          }));
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Stat
                      </button>
                    </div>
                    {formData.stats.map((stat, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Stat #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                stats: prev.stats.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const newStats = [...formData.stats];
                              newStats[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, stats: newStats }));
                            }}
                            placeholder="100+"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => {
                              const newStats = [...formData.stats];
                              newStats[index].label = e.target.value;
                              setFormData(prev => ({ ...prev, stats: newStats }));
                            }}
                            placeholder="Books Sold"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={stat.icon}
                            onChange={(e) => {
                              const newStats = [...formData.stats];
                              newStats[index].icon = e.target.value;
                              setFormData(prev => ({ ...prev, stats: newStats }));
                            }}
                            placeholder="trending-up"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Features Editor */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Features</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            features: [...prev.features, { title: '', description: '', icon: 'star' }]
                          }));
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Feature
                      </button>
                    </div>
                    {formData.features.map((feature, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Feature #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                features: prev.features.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index].title = e.target.value;
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          }}
                          placeholder="Free Shipping"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <textarea
                          value={feature.description}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index].description = e.target.value;
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          }}
                          placeholder="On orders over $50"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={feature.icon}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index].icon = e.target.value;
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          }}
                          placeholder="star"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Testimonials Editor */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Testimonials</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            testimonials: [...prev.testimonials, { text: '', author: '', rating: 5 }]
                          }));
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Testimonial
                      </button>
                    </div>
                    {formData.testimonials.map((testimonial, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Testimonial #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                testimonials: prev.testimonials.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          value={testimonial.text}
                          onChange={(e) => {
                            const newTestimonials = [...formData.testimonials];
                            newTestimonials[index].text = e.target.value;
                            setFormData(prev => ({ ...prev, testimonials: newTestimonials }));
                          }}
                          placeholder="Great selection of books! Fast delivery and excellent prices."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={testimonial.author}
                            onChange={(e) => {
                              const newTestimonials = [...formData.testimonials];
                              newTestimonials[index].author = e.target.value;
                              setFormData(prev => ({ ...prev, testimonials: newTestimonials }));
                            }}
                            placeholder="John Doe"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={testimonial.rating}
                            onChange={(e) => {
                              const newTestimonials = [...formData.testimonials];
                              newTestimonials[index].rating = parseInt(e.target.value) || 5;
                              setFormData(prev => ({ ...prev, testimonials: newTestimonials }));
                            }}
                            placeholder="5"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview: {selectedConfig.variant}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Variant:</span> {selectedConfig.variant}
                  </div>
                  <div>
                    <span className="font-medium">Title:</span> {selectedConfig.title}
                  </div>
                  {selectedConfig.subtitle && (
                    <div>
                      <span className="font-medium">Subtitle:</span> {selectedConfig.subtitle}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        selectedConfig.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedConfig.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              {(selectedConfig.primaryCta || selectedConfig.secondaryCta) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Call-to-Actions</h4>
                  <div className="space-y-2 text-sm">
                    {selectedConfig.primaryCta && (
                      <div>
                        <span className="font-medium">Primary:</span> {selectedConfig.primaryCta.text} →{' '}
                        {selectedConfig.primaryCta.href}
                      </div>
                    )}
                    {selectedConfig.secondaryCta && (
                      <div>
                        <span className="font-medium">Secondary:</span>{' '}
                        {selectedConfig.secondaryCta.text} → {selectedConfig.secondaryCta.href}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Media */}
              {(selectedConfig.backgroundImage || selectedConfig.videoUrl) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Media</h4>
                  <div className="space-y-2 text-sm">
                    {selectedConfig.backgroundImage && (
                      <div>
                        <span className="font-medium">Background Image:</span>{' '}
                        {selectedConfig.backgroundImage}
                      </div>
                    )}
                    {selectedConfig.videoUrl && (
                      <div>
                        <span className="font-medium">Video:</span> {selectedConfig.videoUrl}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {selectedConfig.features && selectedConfig.features.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedConfig.features.map((feature, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <div className="flex items-start gap-2">
                          <Award className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{feature.title}</p>
                            <p className="text-xs text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {selectedConfig.stats && selectedConfig.stats.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedConfig.stats.map((stat, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              {selectedConfig.trustBadges && selectedConfig.trustBadges.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Trust Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedConfig.trustBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        <Award className="h-3 w-3" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonials */}
              {selectedConfig.testimonials && selectedConfig.testimonials.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Testimonials</h4>
                  <div className="space-y-3">
                    {selectedConfig.testimonials.map((testimonial, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <p className="text-sm text-gray-700 italic">"{testimonial.text}"</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-600">— {testimonial.author}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroConfig;
