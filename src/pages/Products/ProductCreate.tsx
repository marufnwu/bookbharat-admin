import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, publishersApi, authorsApi } from '../../api';
import { Upload, X, Plus, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import BundleVariantManager from '../../components/BundleVariantManager';

interface ProductForm {
  name: string;
  sku: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  stock_quantity: number;
  category_id: number;
  author?: string;
  publisher?: string;
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
  free_shipping_enabled: boolean;
  free_shipping_type: 'none' | 'all_zones' | 'specific_zones';
  free_shipping_zones: string[];
  free_shipping_min_quantity: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  images: File[];
}

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');

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
    stock_quantity: 0,
    category_id: 0,
    author: '',
    publisher: '',
    isbn: '',
    language: 'English',
    is_featured: false,
    is_active: true,
    free_shipping_enabled: false,
    free_shipping_type: 'none',
    free_shipping_zones: [],
    free_shipping_min_quantity: 1,
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

  const { data: publishers } = useQuery({
    queryKey: ['publishers'],
    queryFn: publishersApi.getAll,
  });

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
      if (key !== 'images' && key !== 'length' && key !== 'width' && key !== 'height') {
        const value = (formData as any)[key];
        // Handle boolean fields properly
        if (typeof value === 'boolean') {
          data.append(key, value ? '1' : '0');
        } else {
          data.append(key, value?.toString() || '');
        }
      }
    });

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold">Create New Product</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {createMutation.isPending ? 'Creating...' : 'Create Product'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter publisher name"
                />
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
          )}

          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Compare Price (₹)
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
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* Basic Shipping Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product weight in grams"
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

              {/* Free Shipping Configuration */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-6">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Free Shipping Configuration</h3>
                    <p className="text-sm text-gray-600">Configure free shipping rules for this product</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Free Shipping Toggle */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="free_shipping_enabled"
                          checked={formData.free_shipping_enabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">
                            Enable Free Shipping for this Product
                          </span>
                          <p className="text-xs text-gray-500">
                            Customers will get free shipping when this product meets the criteria
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Free Shipping Options */}
                  {formData.free_shipping_enabled && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                      {/* Free Shipping Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Free Shipping Applicability
                        </label>
                        <select
                          name="free_shipping_type"
                          value={formData.free_shipping_type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="none">No Free Shipping</option>
                          <option value="all_zones">All Shipping Zones</option>
                          <option value="specific_zones">Specific Zones Only</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose where free shipping applies for this product
                        </p>
                      </div>

                      {/* Zone Selection */}
                      {formData.free_shipping_type === 'specific_zones' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Zones for Free Shipping
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {['A', 'B', 'C', 'D', 'E'].map((zone) => (
                              <div key={zone} className="relative">
                                <input
                                  type="checkbox"
                                  id={`zone-${zone}`}
                                  value={zone}
                                  checked={Array.isArray(formData.free_shipping_zones) && formData.free_shipping_zones.includes(zone)}
                                  onChange={(e) => {
                                    const currentZones = Array.isArray(formData.free_shipping_zones) ? formData.free_shipping_zones : [];
                                    const zones = e.target.checked
                                      ? [...currentZones, zone]
                                      : currentZones.filter(z => z !== zone);
                                    setFormData({ ...formData, free_shipping_zones: zones });
                                  }}
                                  className="sr-only peer"
                                />
                                <label
                                  htmlFor={`zone-${zone}`}
                                  className="flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all
                                    peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700
                                    border-gray-200 hover:border-gray-300 text-gray-600"
                                >
                                  <span className="text-lg font-semibold">Zone {zone}</span>
                                  <span className="text-xs text-center mt-1">
                                    {zone === 'A' && 'Same City'}
                                    {zone === 'B' && 'Same State'}
                                    {zone === 'C' && 'Metro-Metro'}
                                    {zone === 'D' && 'Rest of India'}
                                    {zone === 'E' && 'Northeast/J&K'}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              <strong>Zone Guide:</strong> A: Same City (1-2 days), B: Same State (2-3 days),
                              C: Metro to Metro (3-4 days), D: Rest of India (4-6 days), E: Northeast & J&K (6-10 days)
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Minimum Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Minimum Quantity Requirement
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            name="free_shipping_min_quantity"
                            value={formData.free_shipping_min_quantity}
                            onChange={handleInputChange}
                            min="1"
                            step="0.01"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-sm text-gray-600">units</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum quantity customers must purchase to qualify for free shipping
                        </p>
                        {formData.free_shipping_min_quantity > 1 && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-700">
                              💡 Customers need to buy at least {formData.free_shipping_min_quantity} units
                              to get free shipping
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Preview Section */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Configuration Summary</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Free Shipping Status:</span>
                            <span className={`font-medium ${
                              formData.free_shipping_enabled && formData.free_shipping_type !== 'none'
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}>
                              {formData.free_shipping_enabled && formData.free_shipping_type !== 'none'
                                ? '✓ Enabled'
                                : '✗ Disabled'
                              }
                            </span>
                          </div>
                          {formData.free_shipping_enabled && formData.free_shipping_type !== 'none' && (
                            <>
                              <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600">Applicable Zones:</span>
                                <span className="font-medium text-gray-900">
                                  {formData.free_shipping_type === 'all_zones'
                                    ? 'All Zones (A-E)'
                                    : Array.isArray(formData.free_shipping_zones) && formData.free_shipping_zones.length > 0
                                      ? `Zones ${formData.free_shipping_zones.join(', ')}`
                                      : 'None selected'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600">Min Quantity:</span>
                                <span className="font-medium text-gray-900">
                                  {formData.free_shipping_min_quantity} units
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group border rounded-lg p-3">
                        <div className="flex gap-3">
                          <div className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            {index === 0 && (
                              <span className="absolute -top-1 -right-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder="Alt text for image (optional)"
                              value={imageAltTexts[index] || ''}
                              onChange={(e) => updateAltText(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <div className="flex gap-2">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index - 1)}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  Move Up
                                </button>
                              )}
                              {index < imagePreview.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index + 1)}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  Move Down
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
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
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductCreate;