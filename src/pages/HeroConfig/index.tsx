import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { heroConfigApi } from '../../api';
import toast from 'react-hot-toast';
import { HeroConfig, HeroFormData, HeroFormTab } from '../../types/hero';
import { validateField, validateForm } from './validation';
import HeroConfigTable from './HeroConfigTable';
import ImageUploader from '../../components/ImageUploader';
import ProductPicker from '../../components/ProductPicker';
import IconPicker from '../../components/IconPicker';
import CategoryPicker from '../../components/CategoryPicker';
import HeroPreview from '../../components/HeroPreview';
import {
  Plus,
  Trash2,
  Eye,
  X,
  Layout,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

const HeroConfigPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<HeroConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<HeroConfig | null>(null);
  const [activeTab, setActiveTab] = useState<HeroFormTab>('basic');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<HeroFormData>({
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
    featuredProducts: [],
    categories: [],
  });

  const queryClient = useQueryClient();

  // Fetch all configs
  const { data: configsResponse, isLoading } = useQuery({
    queryKey: ['hero-configs'],
    queryFn: heroConfigApi.getAll,
  });

  const configs: HeroConfig[] = configsResponse?.data || [];
  const activeConfig = configs.find(c => c.is_active);

  // Set active mutation
  const setActiveMutation = useMutation({
    mutationFn: heroConfigApi.setActive,
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
    mutationFn: heroConfigApi.delete,
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
        return heroConfigApi.update(editingConfig.variant, data);
      } else {
        return heroConfigApi.create(data);
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
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before submitting');
      return;
    }

    // Check for duplicate variant
    const exists = configs.find(c => c.variant === formData.variant && c.id !== editingConfig?.id);
    if (exists) {
      toast.error('Variant name already exists. Please choose a different name.');
      return;
    }

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
      featuredProducts: formData.featuredProducts.length > 0 ? formData.featuredProducts : null,
      categories: formData.categories.length > 0 ? formData.categories : null,
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
      featuredProducts: config.featuredProducts || [],
      categories: config.categories || [],
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
    setImagePreview(null);
    setImageFile(null);
    setValidationErrors({});
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
      featuredProducts: [],
      categories: [],
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
        <HeroConfigTable
          configs={configs}
          isLoading={isLoading}
          activeConfig={activeConfig}
          setActiveMutation={setActiveMutation}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
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
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 ${
                          validationErrors.variant
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="e.g., minimal-product"
                        required
                        disabled={!!editingConfig}
                      />
                      {validationErrors.variant && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.variant}</p>
                      )}
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
                      {formData.title && (
                        <span className="ml-2 text-xs text-gray-500">
                          {formData.title.length}/255
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 ${
                        validationErrors.title
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="Premium Books at Unbeatable Prices"
                      required
                    />
                    {validationErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                    )}
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
                  <ImageUploader
                    label="Background Image"
                    value={formData.backgroundImage || null}
                    onChange={(url) => setFormData(prev => ({ ...prev, backgroundImage: url || '' }))}
                    maxSizeMB={5}
                  />

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

                  <ProductPicker
                    label="Featured Products"
                    selected={formData.featuredProducts}
                    onChange={(productIds) => setFormData(prev => ({ ...prev, featuredProducts: productIds }))}
                    max={20}
                  />

                  <CategoryPicker
                    label="Categories (for category-grid variant)"
                    selected={formData.categories}
                    onChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
                    max={8}
                  />

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
                          <div className="col-span-1">
                            <IconPicker
                              value={stat.icon}
                              onChange={(iconName) => {
                                const newStats = [...formData.stats];
                                newStats[index].icon = iconName;
                                setFormData(prev => ({ ...prev, stats: newStats }));
                              }}
                              label=""
                            />
                          </div>
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
                        <IconPicker
                          value={feature.icon}
                          onChange={(iconName) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index].icon = iconName;
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          }}
                          label="Icon"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Preview: {selectedConfig.variant}</h3>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      previewMode === 'desktop'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      previewMode === 'mobile'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
              <div className="mb-4 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  <Eye className="h-4 w-4" />
                  Live Preview - {previewMode === 'desktop' ? 'Desktop View' : 'Mobile View (375px)'}
                </span>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <HeroPreview config={selectedConfig} viewMode={previewMode} />
              </div>

              {/* Configuration Details */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Configuration Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Variant:</span>
                    <span className="ml-2 font-medium">{selectedConfig.variant}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      selectedConfig.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedConfig.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedConfig.backgroundImage && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Background Image:</span>
                      <span className="ml-2 text-xs text-gray-500 truncate block">{selectedConfig.backgroundImage}</span>
                    </div>
                  )}
                  {selectedConfig.primaryCta && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Primary CTA:</span>
                      <span className="ml-2 font-medium">{selectedConfig.primaryCta.text}</span>
                      <span className="text-gray-500 text-xs ml-2">→ {selectedConfig.primaryCta.href}</span>
                    </div>
                  )}
                </div>
              </div>
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

export default HeroConfigPage;
