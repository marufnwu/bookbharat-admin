import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  TagIcon,
  CubeIcon,
  ChartBarIcon,
  StarIcon,
  PhotoIcon,
  Squares2X2Icon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { productsApi, bundleVariantsApi } from '../../api';
import { formatWeight } from '../../utils/weight';
import { Button, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { format } from 'date-fns';
import { Product, ProductBundleVariant } from '../../types';
import { getFullImageUrl } from '../../utils/imageUrl';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('details');

  const { data: productResponse, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(Number(id)),
    enabled: !!id,
  });

  const { data: bundleVariantsData } = useQuery({
    queryKey: ['bundleVariants', id],
    queryFn: () => bundleVariantsApi.getAll(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteProduct(Number(id)),
    onSuccess: () => {
      showSuccess('Product deleted successfully');
      navigate('/products');
    },
    onError: (error: any) => {
      showError('Failed to delete product', error.response?.data?.message);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const product = productResponse?.product;
  const analytics = productResponse?.analytics;
  const bundleVariants = bundleVariantsData?.bundle_variants || [];

  const getShippingConfig = (config: any): { zones?: Record<string, { shipping: number | null; cod: number | null }> } | null => {
    if (!config || typeof config !== 'object') return null;
    if (config.zones) return config;
    return null;
  };

  const shippingConfig = getShippingConfig(product?.shipping_config);

  const isAllFree = (zones?: Record<string, { shipping: number | null; cod: number | null }>): boolean => {
    if (!zones) return true;
    return ['A', 'B', 'C', 'D', 'E'].every(z => (zones[z]?.shipping ?? 0) === 0);
  };

  const ZONE_NAMES: Record<string, string> = {
    A: 'Same City',
    B: 'Same State',
    C: 'Metro Cities',
    D: 'Rest of India',
    E: 'Remote Areas',
  };

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/products" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const parseDimensions = (product: Product) => {
    if (product.dimensions) {
      const parts = product.dimensions.includes('×') ? product.dimensions.split('×') : product.dimensions.split('x');
      if (parts.length === 3) {
        return { length: parts[0]?.trim(), width: parts[1]?.trim(), height: parts[2]?.trim(), display: product.dimensions };
      }
    }
    return null;
  };

  const tabs = [
    { id: 'details', name: 'Details', icon: TagIcon },
    { id: 'inventory', name: 'Inventory', icon: CubeIcon },
    { id: 'bundle-variants', name: 'Bundles', icon: Squares2X2Icon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'reviews', name: 'Reviews', icon: StarIcon },
    { id: 'images', name: 'Images', icon: PhotoIcon },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      active: { color: 'text-green-600 bg-green-50', icon: CheckCircleIcon, label: 'Active' },
      inactive: { color: 'text-red-600 bg-red-50', icon: XCircleIcon, label: 'Inactive' },
      draft: { color: 'text-gray-600 bg-gray-50', icon: DocumentTextIcon, label: 'Draft' },
    };
    const { color, icon: Icon, label } = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${color}`}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
    );
  };

  const StockBadge = () => {
    if (!product.manage_stock) return <Badge variant="info" size="sm">Not Managed</Badge>;
    if (product.stock_quantity === 0) return <Badge variant="error" size="sm">Out of Stock</Badge>;
    if (product.stock_quantity < 10) return <Badge variant="warning" size="sm">Low Stock ({product.stock_quantity})</Badge>;
    return <Badge variant="success" size="sm">In Stock ({product.stock_quantity})</Badge>;
  };

  const Card = ({ title, icon: Icon, children, className = '' }: { title?: string; icon?: React.ElementType; children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-blue-500" />}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );

  const StatCard = ({ label, value, subtext, icon: Icon, color }: { label: string; value: React.ReactNode; subtext?: string; icon: React.ElementType; color: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <StatusBadge status={product.status} />
                {product.is_featured && (
                  <Badge variant="warning" size="sm" icon={<StarIcon className="h-3 w-3" />}>
                    Featured
                  </Badge>
                )}
                {product.is_preorder && (
                  <Badge variant="purple" size="sm" icon={<CalendarIcon className="h-3 w-3" />}>
                    Preorder
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span>SKU: {product.sku}</span>
                {product.category?.name && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{product.category.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/products/${id}/edit`}>
              <Button size="sm">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Price" value={formatCurrency(product.price)} subtext={product.compare_price ? `MRP: ${formatCurrency(Number(product.compare_price))}` : undefined} icon={CurrencyRupeeIcon} color="bg-green-50 text-green-600" />
        <StatCard label="Stock" value={<StockBadge />} icon={CubeIcon} color="bg-blue-50 text-blue-600" />
        <StatCard label="Sales" value={product.sales_count || 0} subtext="units sold" icon={ShoppingBagIcon} color="bg-purple-50 text-purple-600" />
        <StatCard label="Rating" value={product.rating ? `${product.rating}/5` : 'No rating'} subtext={product.review_count ? `${product.review_count} reviews` : undefined} icon={StarIcon} color="bg-yellow-50 text-yellow-600" />
      </div>

      {/* Tabs + Content in single card */}
      <Card className="p-0">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Product Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-5">
                  <Card title="Product Information" icon={TagIcon}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Product Name</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{product.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</label>
                        <div className="mt-1"><StatusBadge status={product.status} /></div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Category</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{product.category?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">SKU</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{product.sku}</p>
                      </div>
                      {product.author && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Author</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{product.author}</p>
                        </div>
                      )}
                      {product.publisher && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Publisher</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{product.publisher}</p>
                        </div>
                      )}
                      {product.supplier && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{product.supplier}</p>
                        </div>
                      )}
                      {product.isbn && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">ISBN</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{product.isbn}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Description" icon={DocumentTextIcon}>
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description || '<p class="text-gray-400 italic">No description</p>' }}
                    />
                    {product.video_url && (() => {
                      const videoId = product.video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1];
                      return videoId ? (
                        <div className="mt-4">
                          <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden border border-gray-200">
                            <iframe src={`https://www.youtube.com/embed/${videoId}`} title="Product video" frameBorder="0" allowFullScreen className="w-full h-full" />
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-5">
                  <Card title="Pricing" icon={CurrencyRupeeIcon}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Selling Price</span>
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      </div>
                      {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">MRP</span>
                            <span className="text-sm text-gray-400 line-through">{formatCurrency(Number(product.compare_price))}</span>
                          </div>
                          <Badge variant="success" className="w-full justify-center">
                            {Math.round(((1 - Number(product.price) / Number(product.compare_price)) * 100))}% off
                          </Badge>
                        </>
                      )}
                      {product.our_price && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Our Price</span>
                            <span className="text-sm font-medium text-teal-600">{formatCurrency(product.our_price)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Quick Info" icon={ClockIcon}>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-900 font-medium">{format(new Date(product.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Updated</span>
                        <span className="text-gray-900 font-medium">{format(new Date(product.updated_at), 'MMM dd, yyyy')}</span>
                      </div>
                      {product.pages && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Pages</span>
                          <span className="text-gray-900 font-medium">{product.pages}</span>
                        </div>
                      )}
                      {product.format && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Format</span>
                          <span className="text-gray-900 font-medium">{product.format}</span>
                        </div>
                      )}
                      {product.language && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Language</span>
                          <span className="text-gray-900 font-medium">{product.language}</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Features" icon={CheckCircleIcon}>
                    <div className="space-y-2">
                      {[
                        { label: 'Featured', value: product.is_featured },
                        { label: 'Bestseller', value: product.is_bestseller },
                        { label: 'Digital', value: product.is_digital },
                      ].map((feature) => (
                        <div key={feature.label} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{feature.label}</span>
                          {feature.value ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Stock & Shipping Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card title="Stock Management" icon={CubeIcon}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">In Stock</p>
                        <p className="text-2xl font-bold text-gray-900">{product.stock_quantity}</p>
                      </div>
                      {product.manage_stock ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Available</p>
                          <p className="text-2xl font-bold text-green-600">{product.stock_quantity - (product.reserved_quantity || 0)}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                          <p className="text-sm font-medium text-gray-500 mt-1">Not Managed</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Manage Stock</span>
                      <span className={`font-medium ${product.manage_stock ? 'text-green-600' : 'text-gray-400'}`}>
                        {product.manage_stock ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Min Stock Level</span>
                      <span className="font-medium text-gray-900">{product.min_stock_level || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card title="Shipping" icon={TruckIcon}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Shipping Type</span>
                      <Badge variant={isAllFree(shippingConfig?.zones) ? 'success' : 'info'} size="sm">
                        {isAllFree(shippingConfig?.zones) ? 'Free Shipping' : 'Custom Charges'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Weight</span>
                      <span className="font-medium text-gray-900">{formatWeight(product.weight)}</span>
                    </div>
                    {product.dimensions && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Dimensions</span>
                        <span className="font-medium text-gray-900">{product.dimensions}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Preorder Section */}
              {product.is_preorder && (
                <Card title="Preorder Information" icon={CalendarIcon}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-xs text-purple-600 uppercase tracking-wider font-medium">Status</p>
                        <p className="text-sm font-bold text-purple-900 mt-1">Available for Preorder</p>
                      </div>
                      {product.release_date && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-purple-600 uppercase tracking-wider font-medium">Release Date</p>
                          <p className="text-sm font-bold text-purple-900 mt-1">{format(new Date(product.release_date), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                      {product.preorder_quantity_limit && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-purple-600 uppercase tracking-wider font-medium">Max Preorders</p>
                          <p className="text-sm font-bold text-purple-900 mt-1">{product.preorder_quantity_limit} units</p>
                        </div>
                      )}
                      {product.reserved_quantity > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-purple-600 uppercase tracking-wider font-medium">Reserved</p>
                          <p className="text-sm font-bold text-purple-900 mt-1">{product.reserved_quantity} units</p>
                        </div>
                      )}
                    </div>
                    {product.preorder_requires_deposit && (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Requires deposit to confirm preorder</span>
                        </div>
                        {product.preorder_deposit_amount && (
                          <span className="text-sm font-bold text-amber-900">Deposit: {formatCurrency(product.preorder_deposit_amount)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Shipping Zones */}
              {shippingConfig?.zones && (
                <Card title="Shipping Zones" icon={TruckIcon}>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['A', 'B', 'C', 'D', 'E'].map((zone) => {
                      const zoneConfig = shippingConfig.zones?.[zone];
                      if (!zoneConfig) return null;
                      return (
                        <div key={zone} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Zone {zone}</p>
                          <p className="text-xs text-gray-500 mb-1">{ZONE_NAMES[zone]}</p>
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Shipping</span>
                              <span className={`font-medium ${zoneConfig.shipping === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                {zoneConfig.shipping === 0 ? 'Free' : `₹${zoneConfig.shipping}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">COD</span>
                              <span className="font-medium text-gray-700">₹{zoneConfig.cod ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <Card title="Product Variants" icon={Squares2X2Icon}>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 font-medium">Variant</th>
                        <th className="pb-3 font-medium">SKU</th>
                        <th className="pb-3 font-medium">Price</th>
                        <th className="pb-3 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant: any) => (
                        <tr key={variant.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 text-sm text-gray-900">{variant.name}</td>
                          <td className="py-3 text-sm text-gray-500">{variant.sku}</td>
                          <td className="py-3 text-sm font-medium text-gray-900">{formatCurrency(variant.price)}</td>
                          <td className="py-3 text-sm text-gray-900">{variant.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}

          {/* BUNDLE VARIANTS TAB */}
          {activeTab === 'bundle-variants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bundle Variants</h3>
                  <p className="text-sm text-gray-500 mt-1">Quantity-based pricing bundles</p>
                </div>
                <Link to={`/products/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Manage Bundles
                  </Button>
                </Link>
              </div>

              {bundleVariants.length > 0 ? (
                <Card className="p-0" title="">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3 font-medium">Bundle</th>
                        <th className="px-5 py-3 font-medium">Qty</th>
                        <th className="px-5 py-3 font-medium">Pricing</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium">Savings</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bundleVariants.map((variant: ProductBundleVariant) => {
                        const originalPrice = parseFloat(product.price) * variant.quantity;
                        const bundlePrice = variant.calculated_price || 0;
                        const savings = originalPrice - bundlePrice;
                        const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

                        return (
                          <tr key={variant.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                              <div className="text-xs text-gray-400">{variant.sku}</div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">{variant.quantity} items</td>
                            <td className="px-5 py-4">
                              <Badge variant="info" size="sm">
                                {variant.pricing_type === 'percentage_discount' && `${variant.discount_percentage}% off`}
                                {variant.pricing_type === 'fixed_price' && 'Fixed'}
                                {variant.pricing_type === 'fixed_discount' && `₹${variant.fixed_discount} off`}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-bold text-gray-900">{formatCurrency(bundlePrice)}</div>
                              <div className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant="success" size="sm">{savingsPercent}% off</Badge>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant={variant.is_active ? 'success' : 'default'} size="sm">
                                {variant.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Squares2X2Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No bundle variants</p>
                  <p className="text-sm text-gray-400 mt-1">Create quantity-based bundles for special pricing</p>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency(analytics.sales_data?.total_revenue || 0), icon: CurrencyRupeeIcon, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Units Sold', value: analytics.sales_data?.total_sold || 0, icon: ShoppingBagIcon, color: 'bg-green-50 text-green-600' },
                  { label: 'Avg Rating', value: analytics.performance_metrics?.average_rating?.toFixed(1) || '0', icon: StarIcon, color: 'bg-yellow-50 text-yellow-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card title="Performance Metrics" icon={ChartBarIcon}>
                  <div className="space-y-3">
                    {[
                      { label: 'Views', value: analytics.performance_metrics?.view_count || 0 },
                      { label: 'Conversion', value: `${analytics.performance_metrics?.conversion_rate || 0}%` },
                      { label: 'Wishlist', value: analytics.performance_metrics?.wishlist_count || 0 },
                      { label: 'Return Rate', value: `${analytics.performance_metrics?.return_rate || 0}%` },
                    ].map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{metric.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Inventory Levels" icon={CubeIcon}>
                  <div className="space-y-3">
                    {[
                      { label: 'Current Stock', value: analytics.inventory_levels?.current_stock || 0 },
                      { label: 'Reserved', value: analytics.inventory_levels?.reserved_stock || 0 },
                      { label: 'Available', value: analytics.inventory_levels?.available_stock || 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && !analytics && (
            <div className="text-center py-16 text-gray-500">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No analytics data available</p>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`h-5 w-5 ${i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900">{product.rating || 0}/5</span>
                </div>
                <span className="text-gray-500">({product.reviews_count || 0} reviews)</span>
              </div>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review: any) => (
                    <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                          <p className="text-xs text-gray-400 mt-2">{format(new Date(review.created_at), 'MMM dd, yyyy')}</p>
                        </div>
                        <Badge variant={review.status === 'approved' ? 'success' : 'warning'} size="sm">
                          {review.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No reviews yet</p>
                </div>
              )}
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {product.images.map((image: any, index: number) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                        image.is_primary ? 'border-blue-400 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <div className="aspect-square bg-gray-50 p-2">
                        <img
                          src={getFullImageUrl(image.image_url) || '/placeholder-image.png'}
                          alt={image.alt_text || product.name}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }}
                        />
                      </div>
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
                          <StarIcon className="h-3 w-3" />
                          Primary
                        </div>
                      )}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900/70 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No images uploaded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductDetail;
