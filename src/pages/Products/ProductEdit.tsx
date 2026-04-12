import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, publishersApi, authorsApi } from '../../api';
import { productsApiExtended } from '../../api/extended';
import { Upload, X, Save, ArrowLeft, Loader2, Truck, GripVertical, Star, Plus, Search, Check } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import BundleVariantManager from '../../components/BundleVariantManager';
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
  existing_images?: string[];
}

function normalizeShippingConfig(config: any): { zones: Record<string, { shipping: number | null; cod: number | null }> } {
  const defaultZones = {
    A: { shipping: 0, cod: 0 }, B: { shipping: 0, cod: 0 }, C: { shipping: 0, cod: 0 },
    D: { shipping: 0, cod: 0 }, E: { shipping: 0, cod: 0 },
  };
  if (!config || !config.zones) return { zones: defaultZones };
  return { zones: config.zones };
}

function SortableImage({ img, index, isPrimary, onRemove, onSetPrimary }: {
  img: { id: string; url: string };
  index: number;
  isPrimary: boolean;
  onRemove: () => void;
  onSetPrimary: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white rounded-xl overflow-hidden border-2 transition-all duration-200 flex flex-col ${isPrimary
        ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } ${isDragging ? 'shadow-lg scale-105' : ''}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[9/16] bg-gray-50 p-2 flex items-center justify-center">
        <img
          src={img.url}
          alt={`Image ${index + 1}`}
          className="w-full h-full object-contain rounded-lg"
        />

        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm"
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>

        {/* Star Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all backdrop-blur-sm ${isPrimary
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-blue-500 shadow-sm'
            }`}
          title={isPrimary ? 'Primary image' : 'Set as primary'}
        >
          <Star className="h-4 w-4" fill={isPrimary ? 'currentColor' : 'none'} />
        </button>

        {/* Image Number Badge */}
        <div className="absolute bottom-2 left-2 w-6 h-6 bg-gray-900/70 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center justify-center">
          {index + 1}
        </div>
      </div>

      {/* Controls Section */}
      <div className="p-2 border-t border-gray-100 bg-white">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-full p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
        >
          <X className="h-3.5 w-3.5" />
          <span>Remove</span>
        </button>
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md shadow-md flex items-center gap-1">
          <Star className="w-3 h-3" fill="currentColor" />
          Primary
        </div>
      )}
    </div>
  );
}

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string, url: string }[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publisherSearch, setPublisherSearch] = useState('');
  const [showPublisherDropdown, setShowPublisherDropdown] = useState(false);
  const [showPublisherCreate, setShowPublisherCreate] = useState(false);
  const [newPublisherName, setNewPublisherName] = useState('');
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(Number(id)),
    enabled: !!id,
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

  // Load product data when available
  useEffect(() => {
    if (product?.product) {
      const p = product.product;
      setFormData({
        name: p.name || p.title || '',
        sku: p.sku || p.isbn || '',
        slug: p.slug || '',
        description: p.description || '',
        short_description: p.short_description || '',
        price: parseFloat(String(p.price)) || 0,
        compare_price: p.compare_price ? parseFloat(String(p.compare_price)) : undefined,
        our_price: p.our_price ? parseFloat(String(p.our_price)) : undefined,
        supplier: p.supplier || '',
        stock_quantity: p.stock_quantity || 0,
        category_id: p.category_id || 0,
        author: p.author || (p.authors && p.authors.length > 0 ? p.authors[0].name : ''),
        publisher: p.publisher || '',
        isbn: p.isbn || '',
        language: p.language || 'English',
        pages: p.pages || undefined,
        weight: p.weight || undefined,
        dimensions: p.dimensions || '',
        length: undefined,
        width: undefined,
        height: undefined,
        publication_date: p.publication_date || '',
        is_featured: p.is_featured || false,
        is_active: p.is_active !== false,
        shipping_config: normalizeShippingConfig(p.shipping_config),
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        meta_keywords: p.meta_keywords || '',
        images: []
      });

      // Parse dimensions string into separate fields
      if (p.dimensions) {
        const dimensionParts = p.dimensions.split('×');
        if (dimensionParts.length === 3) {
          setFormData(prev => ({
            ...prev,
            length: dimensionParts[0]?.trim(),
            width: dimensionParts[1]?.trim(),
            height: dimensionParts[2]?.trim()
          }));
        }
      }

      // Set existing images
      if (p.images && Array.isArray(p.images)) {
        const sortedImages = [...p.images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setExistingImages(sortedImages.map((img: any) => ({
          id: String(img.id),
          url: img.image_url || img.url || img,
        })));
        const primary = sortedImages.find((img: any) => img.is_primary);
        if (primary) {
          setPrimaryImageId(String(primary.id));
        } else if (sortedImages.length > 0) {
          setPrimaryImageId(String(sortedImages[0].id));
        }
      }
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return productsApi.update(Number(id), data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
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

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (primaryImageId === removed.id) {
        setPrimaryImageId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const setPrimaryImage = (imageId: string) => {
    setPrimaryImageId(imageId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setExistingImages(prev => {
      const oldIndex = prev.findIndex(img => img.id === active.id);
      const newIndex = prev.findIndex(img => img.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const buildDimensionsString = (): string => {
    if (formData.length && formData.width && formData.height) {
      return `${formData.length}×${formData.width}×${formData.height}`;
    }
    return formData.dimensions || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'images' && key !== 'existing_images' && key !== 'length' && key !== 'width' && key !== 'height' && key !== 'tags' && key !== 'shipping_config') {
        const value = (formData as any)[key];
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            data.append(key, value ? '1' : '0');
          } else {
            data.append(key, value.toString());
          }
        }
      }
    });

    if (formData.shipping_config) {
      data.append('shipping_config', JSON.stringify(formData.shipping_config));
    }

    const dimensionsString = buildDimensionsString();
    if (dimensionsString) {
      data.append('dimensions', dimensionsString);
    }

    images.forEach(image => {
      data.append('images[]', image);
    });

    existingImages.forEach(img => {
      data.append('existing_images[]', img.id);
    });

    try {
      await updateMutation.mutateAsync(data);

      if (existingImages.length > 0) {
        const imageOrders = existingImages.map((img, index) => ({
          id: parseInt(img.id),
          sort_order: index,
        }));
        const primaryId = primaryImageId ? parseInt(primaryImageId) : undefined;
        await productsApiExtended.reorderImages(Number(id), { image_orders: imageOrders, primary_image_id: primaryId });
      }

      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(`/products/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'details', label: 'Product Details' },
    { id: 'pricing', label: 'Pricing & Inventory' },
    { id: 'shipping', label: 'Shipping Configuration' },
    { id: 'bundle-variants', label: 'Bundle Variants' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' },
  ];

  if (productLoading) {
    return <PageSkeleton type="form" />;
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-sm text-gray-500 mt-1">{formData.name || 'Loading...'}</p>
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
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        <CardContent>
          {activeTab === 'bundle-variants' ? (
            <BundleVariantManager
              productId={Number(id)}
              productPrice={formData.price}
              productStock={formData.stock_quantity}
            />
          ) : (
            <form onSubmit={handleSubmit}>
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
                      {renderCategoryOptions((categoryTree as any)?.data || [])}
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
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={publisherSearch || formData.publisher || ''}
                            onChange={(e) => {
                              setPublisherSearch(e.target.value);
                              setShowPublisherDropdown(true);
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

                        {showPublisherDropdown && (
                          <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {(() => {
                              const filtered = Array.isArray(publishers)
                                ? publishers.filter((p: any) =>
                                  p.name.toLowerCase().includes(publisherSearch.toLowerCase())
                                )
                                : [];

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
              )}

              {activeTab === 'pricing' && (

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
                      Price (₹) <span className="text-red-500">*</span>
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
              )}

              {activeTab === 'shipping' && (
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
                        <p className="text-sm text-gray-600">Configure shipping and COD charges for this product</p>
                      </div>
                    </div>

                    <ShippingConfigInput
                      value={formData.shipping_config}
                      onChange={(config) => setFormData(prev => ({ ...prev, shipping_config: config }))}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-6">
                  {existingImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Current Images ({existingImages.length})
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Drag to reorder • Click star to set primary • Hover for controls
                          </p>
                        </div>
                      </div>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={existingImages.map(img => img.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {existingImages.map((img, index) => (
                              <SortableImage
                                key={img.id}
                                img={img}
                                index={index}
                                isPrimary={primaryImageId === img.id}
                                onRemove={() => removeExistingImage(index)}
                                onSetPrimary={() => setPrimaryImage(img.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Add New Images
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload additional product images
                      </p>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer">
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
                          JPG, PNG, WebP up to 5MB
                        </span>
                      </label>
                    </div>
                  </div>

                  {imagePreview.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          New Images to Upload ({imagePreview.length})
                        </label>
                        <p className="text-xs text-gray-500">
                          Images will be added after existing images
                        </p>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {imagePreview.map((preview, index) => (
                          <div
                            key={index}
                            className="relative group bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                          >
                            {/* Image Container */}
                            <div className="relative aspect-[9/16] bg-gray-50 p-2 flex items-center justify-center">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-contain rounded-lg"
                              />

                              {/* Image Number Badge */}
                              <div className="absolute top-2 left-2 w-6 h-6 bg-gray-900/70 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              >
                                <X className="h-4 w-4" />
                              </button>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductEdit;