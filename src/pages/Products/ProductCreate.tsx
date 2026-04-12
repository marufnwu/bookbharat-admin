import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, publishersApi, authorsApi } from '../../api';
import { Upload, X, Plus, Save, ArrowLeft, Sparkles, Loader2, Truck, Star, ChevronLeft, ChevronRight, Trash2, Check, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import BundleVariantManager from '../../components/BundleVariantManager';
import AiFieldGenerator from '../../components/AiFieldGenerator';
import { ShippingConfigInput } from '../../components/products/ShippingConfigInput';
import { toKg, toGrams } from '../../utils/weight';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  PageSkeleton,
} from '../../components';

interface ProductForm {
  name: string;
  sku: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  our_price?: number;
  supplier?: string;
  stock_quantity: number;
  category_id: number;
  author?: string;
  publisher?: string;
  publisher_id?: number;
  isbn?: string;
  language?: string;
  pages?: number;
  weight?: number;
  dimensions?: string;
  length?: number;
  width?: number;
  height?: number;
  publication_date?: string;
  is_featured: boolean;
  is_active: boolean;
  // Unified shipping config
  shipping_config: {
    zones?: Record<string, { shipping: number | null; cod: number | null }>;
  };
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  images: File[];
}

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showPublisherCreate, setShowPublisherCreate] = useState(false);
  const [newPublisherName, setNewPublisherName] = useState('');
  const [publisherSearch, setPublisherSearch] = useState('');
  const [showPublisherDropdown, setShowPublisherDropdown] = useState(false);
  const [aiGeneratedFields, setAiGeneratedFields] = useState<Set<string>>(new Set());

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['basic', 'details', 'pricing', 'images', 'seo'];
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [imageAltTexts, setImageAltTexts] = useState<string[]>([]);

  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    sku: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    our_price: undefined,
    supplier: '',
    stock_quantity: 0,
    category_id: 0,
    author: '',
    publisher: '',
    publisher_id: undefined,
    isbn: '',
    language: 'English',
    is_featured: false,
    is_active: true,
    shipping_config: {
      zones: {
        A: { shipping: 0, cod: 0 },
        B: { shipping: 0, cod: 0 },
        C: { shipping: 0, cod: 0 },
        D: { shipping: 0, cod: 0 },
        E: { shipping: 0, cod: 0 },
      },
    },
    length: undefined,
    width: undefined,
    height: undefined,
    images: []
  });

  // Fetch categories tree for hierarchical selection
  const { data: categoryTree } = useQuery({
    queryKey: ['categoryTree'],
    queryFn: categoriesApi.getCategoryTree,
  });

  const { data: publishersResponse } = useQuery({
    queryKey: ['publishers'],
    queryFn: publishersApi.getAll,
  });

  const publishers = publishersResponse?.data?.data || publishersResponse?.data || [];

  const { data: authors } = useQuery({
    queryKey: ['authors'],
    queryFn: authorsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return productsApi.create(data);
    },
    onSuccess: (response: any) => {
      toast.success('Product created successfully');
      navigate(`/products/${response.product.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validFiles = files.filter(file =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast.error('Some files were not valid images');
    }

    setImages(prev => [...prev, ...validFiles]);

    // Generate previews and initialize alt texts
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Initialize alt text for new images
    const newAltTexts = validFiles.map(() => '');
    setImageAltTexts(prev => [...prev, ...newAltTexts]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setImageAltTexts(prev => prev.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, altText: string) => {
    setImageAltTexts(prev => {
      const newAltTexts = [...prev];
      newAltTexts[index] = altText;
      return newAltTexts;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
    setImagePreview(prev => {
      const newPreviews = [...prev];
      const [moved] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, moved);
      return newPreviews;
    });
    setImageAltTexts(prev => {
      const newAltTexts = [...prev];
      const [moved] = newAltTexts.splice(fromIndex, 1);
      newAltTexts.splice(toIndex, 0, moved);
      return newAltTexts;
    });
  };

  // Helper function to render categories with indentation for hierarchy
  const renderCategoryOptions = (categories: any[], level = 0): React.ReactElement[] => {
    const options: React.ReactElement[] = [];

    categories?.forEach((category) => {
      // Create visual hierarchy with different indicators
      let prefix = '';
      if (level === 0) {
        prefix = '📁 '; // Folder icon for parent categories
      } else if (level === 1) {
        prefix = '  ├── '; // Tree branch for subcategories
      } else {
        prefix = '  ' + '│   '.repeat(level - 1) + '├── '; // Deeper nesting
      }

      options.push(
        <option key={category.id} value={category.id}>
          {prefix}{category.name}
        </option>
      );

      // Recursively add children
      if (category.children && category.children.length > 0) {
        options.push(...renderCategoryOptions(category.children, level + 1));
      }
    });

    return options;
  };

  const buildDimensionsString = (): string => {
    if (formData.length && formData.width && formData.height) {
      return `${formData.length}×${formData.width}×${formData.height}`;
    }
    return formData.dimensions || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.sku || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create FormData for multipart upload
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'images' && key !== 'length' && key !== 'width' && key !== 'height' && key !== 'shipping_config') {
        const value = (formData as any)[key];
        // Handle boolean fields properly
        if (typeof value === 'boolean') {
          data.append(key, value ? '1' : '0');
        } else {
          data.append(key, value?.toString() || '');
        }
      }
    });

    // Handle shipping_config as JSON string
    data.append('shipping_config', JSON.stringify(formData.shipping_config));

    // Add dimensions as a combined string
    const dimensionsString = buildDimensionsString();
    if (dimensionsString) {
      data.append('dimensions', dimensionsString);
    }

    // Append images with alt text
    images.forEach((image, index) => {
      data.append('images[]', image);
      data.append(`alt_text[${index}]`, imageAltTexts[index] || '');
    });

    createMutation.mutate(data);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'details', label: 'Product Details' },
    { id: 'pricing', label: 'Pricing & Inventory' },
    { id: 'shipping', label: 'Shipping Configuration' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' },
  ];

  // Note: Bundle Variants tab is not shown on create page
  // Bundle variants can only be created after the product is saved

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-sm text-gray-500 mt-1 sm:hidden">Add a new product to your catalog</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
            className="sm:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            loading={createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-4 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category & Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {renderCategoryOptions((categoryTree as any)?.categories || [])}
                </select>
              </div>

              {/* AI Assistant Button - Enhanced */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Validation
                      if (!formData.name?.trim()) {
                        toast.error('Please enter the product name first!');
                        return;
                      }
                      if (!formData.category_id) {
                        toast.error('Please select a category first!');
                        return;
                      }
                      setShowAiGenerator(true);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    ✨ AI Assistant - Generate Product Content
                  </button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    AI will generate descriptions, meta tags, keywords, and more in {formData.language || 'Bengali'}
                  </p>
                  {aiGeneratedFields.size > 0 && (
                    <p className="text-xs text-green-600 mt-1 text-center font-medium">
                      ✓ AI content applied to {aiGeneratedFields.size} field(s)
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief product summary (optional)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Enter detailed product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ISBN (optional)"
                />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publisher
                </label>

                {showPublisherCreate ? (
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Create New Publisher</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublisherCreate(false);
                          setNewPublisherName('');
                          setPublisherSearch('');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newPublisherName}
                        onChange={(e) => setNewPublisherName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPublisherName.trim()) {
                            setFormData({
                              ...formData,
                              publisher: newPublisherName.trim(),
                              publisher_id: undefined,
                            });
                            setShowPublisherCreate(false);
                            setNewPublisherName('');
                            setPublisherSearch('');
                          }
                        }}
                        placeholder="Enter publisher name..."
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        autoFocus
                      />
                      <p className="mt-1 text-xs text-gray-500">Press Enter to create and select</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (newPublisherName.trim()) {
                            setFormData({
                              ...formData,
                              publisher: newPublisherName.trim(),
                              publisher_id: undefined,
                            });
                            setShowPublisherCreate(false);
                            setNewPublisherName('');
                            setPublisherSearch('');
                            toast.success('Publisher added');
                          }
                        }}
                        disabled={!newPublisherName.trim()}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        Create & Select
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublisherCreate(false);
                          setNewPublisherName('');
                          setPublisherSearch('');
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Publisher Search Dropdown */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={publisherSearch || formData.publisher || ''}
                        onChange={(e) => {
                          setPublisherSearch(e.target.value);
                          setShowPublisherDropdown(true);
                          // Clear selection if user types
                          if (formData.publisher && e.target.value !== formData.publisher) {
                            setFormData({
                              ...formData,
                              publisher_id: undefined,
                              publisher: e.target.value,
                            });
                          }
                        }}
                        onFocus={() => setShowPublisherDropdown(true)}
                        onBlur={() => {
                          // Delay hiding dropdown to allow click events
                          setTimeout(() => setShowPublisherDropdown(false), 200);
                        }}
                        placeholder="Search or type publisher name..."
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {formData.publisher_id && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPublisherCreate(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Create new publisher"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Dropdown Results */}
                    {showPublisherDropdown && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {(() => {
                          const filtered = Array.isArray(publishers)
                            ? publishers.filter((p: any) =>
                              p.name.toLowerCase().includes(publisherSearch.toLowerCase())
                            )
                            : [];

                          // Check if exact match exists
                          const exactMatch = publisherSearch.trim() && filtered.some((p: any) =>
                            p.name.toLowerCase() === publisherSearch.trim().toLowerCase()
                          );

                          if (filtered.length === 0 && publisherSearch.trim()) {
                            return (
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setNewPublisherName(publisherSearch);
                                  setShowPublisherCreate(true);
                                  setShowPublisherDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Plus className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-700">Create "{publisherSearch}"</p>
                                  <p className="text-xs text-gray-500">Publisher not found, click to create</p>
                                </div>
                              </button>
                            );
                          }

                          return (
                            <>
                              {filtered.slice(0, 10).map((publisher: any) => (
                                <button
                                  key={publisher.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFormData({
                                      ...formData,
                                      publisher_id: publisher.id,
                                      publisher: publisher.name,
                                    });
                                    setPublisherSearch('');
                                    setShowPublisherDropdown(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${formData.publisher_id === publisher.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-gray-600">
                                      {publisher.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{publisher.name}</p>
                                  </div>
                                  {formData.publisher_id === publisher.id && (
                                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                              {filtered.length > 10 && (
                                <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
                                  Showing 10 of {filtered.length} publishers
                                </div>
                              )}
                              {/* Only show Create button if no exact match exists */}
                              {publisherSearch.trim() && !exactMatch && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setNewPublisherName(publisherSearch);
                                    setShowPublisherCreate(true);
                                    setShowPublisherDropdown(false);
                                  }}
                                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors border-t"
                                >
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Plus className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-700">Create "{publisherSearch}"</p>
                                    <p className="text-xs text-gray-500">Add new publisher</p>
                                  </div>
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Selected Publisher Display */}
                    {formData.publisher && !showPublisherDropdown && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {formData.publisher.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-blue-900 truncate flex-1">
                          {formData.publisher}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, publisher_id: undefined, publisher: '' });
                            setPublisherSearch('');
                          }}
                          className="text-blue-400 hover:text-blue-600 p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages
                </label>
                <input
                  type="number"
                  name="pages"
                  value={formData.pages || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Date
                </label>
                <input
                  type="date"
                  name="publication_date"
                  value={formData.publication_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
          )
          }

          {
            activeTab === 'pricing' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    name="compare_price"
                    value={formData.compare_price || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regular Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Our Price (₹)
                  </label>
                  <input
                    type="number"
                    name="our_price"
                    value={formData.our_price || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Internal purchase price"
                  />
                  <p className="text-xs text-gray-500 mt-1">Internal purchase price from supplier (not shown to customers)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supplier/vendor name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name of the supplier or vendor for this product</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {formData.compare_price && formData.compare_price > formData.price && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      Discount: {Math.round(((formData.compare_price - formData.price) / formData.compare_price) * 100)}%
                    </p>
                    <p className="text-sm text-green-800">
                      You save: ₹{(formData.compare_price - formData.price).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )
          }

          {
            activeTab === 'shipping' && (
              <div className="space-y-6">
                {/* Basic Shipping Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={toKg(formData.weight)}
                      onChange={(e) => setFormData({ ...formData, weight: toGrams(parseFloat(e.target.value)) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product weight in kg"
                      step="0.01"
                      min="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for shipping cost calculations
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Package Dimensions (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Length (cm)
                        </label>
                        <input
                          type="number"
                          name="length"
                          value={formData.length || ''}
                          onChange={handleInputChange}
                          placeholder="20"
                          step="0.1"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Width (cm)
                        </label>
                        <input
                          type="number"
                          name="width"
                          value={formData.width || ''}
                          onChange={handleInputChange}
                          placeholder="15"
                          step="0.1"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height || ''}
                          onChange={handleInputChange}
                          placeholder="3"
                          step="0.1"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the package dimensions in centimeters (Length × Width × Height)
                    </p>
                    {formData.length && formData.width && formData.height && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-700">
                          📦 Package size: {formData.length} × {formData.width} × {formData.height} cm
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unified Shipping Configuration */}
                <div className="border-t pt-6">
                  <div className="flex items-center mb-6">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Shipping Configuration</h3>
                      <p className="text-sm text-gray-600">Configure shipping rules and charges for this product</p>
                    </div>
                  </div>

                  <ShippingConfigInput
                    value={formData.shipping_config}
                    onChange={(config) => setFormData(prev => ({ ...prev, shipping_config: config }))}
                  />
                </div>
              </div>
            )
          }

          {
            activeTab === 'images' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload images</span>
                      <span className="text-xs text-gray-500 mt-1">
                        JPG, PNG, WebP up to 5MB. First image will be the primary image.
                      </span>
                    </label>
                  </div>
                </div>

                {imagePreview.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        Uploaded Images ({imagePreview.length})
                      </h4>
                      <p className="text-xs text-gray-500">
                        First image will be the primary product image
                      </p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {imagePreview.map((preview, index) => (
                        <div
                          key={index}
                          className={`relative group bg-white rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${index === 0 ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          {/* Image Container */}
                          <div className="relative aspect-[9/16] bg-gray-50 p-2 flex items-center justify-center">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-contain rounded-lg"
                            />

                            {/* Primary Badge */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1">
                                <Star className="w-3 h-3" fill="currentColor" />
                                Primary
                              </div>
                            )}

                            {/* Image Number */}
                            <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900/70 text-white text-xs font-medium rounded-full flex items-center justify-center">
                              {index + 1}
                            </div>
                          </div>

                          {/* Controls Section */}
                          <div className="p-3 space-y-2 border-t border-gray-100">
                            <input
                              type="text"
                              placeholder="Alt text (optional)"
                              value={imageAltTexts[index] || ''}
                              onChange={(e) => updateAltText(index, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, index - 1)}
                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Move left"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                )}
                                {index < imagePreview.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, index + 1)}
                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Move right"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }

          {
            activeTab === 'seo' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.meta_title?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.meta_description?.length || 0}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords || ''}
                    onChange={handleInputChange}
                    placeholder="Separate keywords with commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">SEO Preview</h4>
                  <div className="space-y-1">
                    <p className="text-blue-800 font-medium">
                      {formData.meta_title || formData.name || 'Product Title'}
                    </p>
                    <p className="text-green-700 text-xs">
                      www.bookbharat.com/products/{formData.slug || 'product-slug'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {formData.meta_description || formData.description?.substring(0, 160) || 'Product description will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
        </form >
      </Card >

      {/* AI Field Generator Modal */}
      {
        showAiGenerator && (
          <AiFieldGenerator
            initialData={{
              book_name: formData.name,
              author: formData.author,
              publisher: formData.publisher,
              language: formData.language,
              category_id: formData.category_id,
              isbn: formData.isbn,
              pages: formData.pages,
              // key_themes: User will enter manually in modal
            }}
            onApply={(fields) => {
              // Apply all generated fields
              setFormData({
                ...formData,
                description: fields.description,
                short_description: fields.short_description,
                meta_title: fields.meta_title,
                meta_description: fields.meta_description,
                meta_keywords: fields.meta_keywords,
              });

              // Track which fields were AI-generated
              setAiGeneratedFields(new Set([
                'description',
                'short_description',
                'meta_title',
                'meta_description',
                'meta_keywords',
              ]));

              toast.success(
                <div>
                  <strong>AI content applied!</strong>
                  <div className="text-sm mt-1">Review and edit the generated fields as needed.</div>
                </div>,
                { duration: 4000 }
              );
            }}
            onClose={() => setShowAiGenerator(false)}
          />
        )
      }
    </div >
  );
};

export default ProductCreate;