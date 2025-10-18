import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api';
import { X, Search, Package, DollarSign, Check } from 'lucide-react';
import { LoadingSpinner } from './';
import { getFullImageUrl } from '../utils/imageUrl';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images?: Array<{ image_url: string }>;
  category?: { name: string };
}

interface ProductPickerProps {
  selected: number[];
  onChange: (productIds: number[]) => void;
  max?: number;
  label?: string;
}

const ProductPicker: React.FC<ProductPickerProps> = ({
  selected = [],
  onChange,
  max = 20,
  label = 'Featured Products',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tempSelected, setTempSelected] = useState<number[]>(selected);

  // Fetch products
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', searchTerm, categoryFilter],
    queryFn: () =>
      productsApi.getProducts({
        search: searchTerm || undefined,
        category_id: categoryFilter || undefined,
        per_page: 50,
      }),
    enabled: showModal,
  });

  // Fetch selected products for display
  const { data: selectedProductsResponse } = useQuery({
    queryKey: ['selected-products', selected],
    queryFn: async () => {
      if (selected.length === 0) return { data: { data: [] } };
      const products = await Promise.all(
        selected.map(id => productsApi.getProduct(id).catch(() => null))
      );
      return {
        data: {
          data: products.filter(p => p !== null).map((p: any) => p.product),
        },
      };
    },
    enabled: selected.length > 0,
  });

  const products: Product[] = productsResponse?.products?.data || productsResponse?.data?.data || [];
  const selectedProducts: Product[] = selectedProductsResponse?.data?.data || [];

  const handleToggleProduct = (productId: number) => {
    setTempSelected(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= max) {
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleSave = () => {
    onChange(tempSelected);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempSelected(selected);
    setShowModal(false);
  };

  const handleOpen = () => {
    setTempSelected(selected);
    setShowModal(true);
  };

  const handleRemoveSelected = (productId: number) => {
    onChange(selected.filter(id => id !== productId));
  };

  return (
    <div className={`space-y-2`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Selected Products Display */}
      {selectedProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {selectedProducts.map((product) => (
            <div key={product.id} className="relative group border rounded-lg p-2 bg-white">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                {product.images?.[0] ? (
                  <img
                    src={getFullImageUrl(product.images[0].image_url) || ''}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </div>
              <div className="text-xs text-gray-500">${product.price}</div>
              <button
                type="button"
                onClick={() => handleRemoveSelected(product.id)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Products Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Package className="h-4 w-4" />
        {selected.length > 0
          ? `${selected.length} product${selected.length > 1 ? 's' : ''} selected (click to change)`
          : 'Select Featured Products'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Products ({tempSelected.length}/{max})
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => {
                    const isSelected = tempSelected.includes(product.id);
                    const isDisabled = !isSelected && tempSelected.length >= max;

                    return (
                      <div
                        key={product.id}
                        onClick={() => !isDisabled && handleToggleProduct(product.id)}
                        className={`
                          flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={getFullImageUrl(product.images[0].image_url) || ''}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span>${product.price}</span>
                            {product.stock_quantity > 0 ? (
                              <span className="text-green-600">In Stock</span>
                            ) : (
                              <span className="text-red-600">Out of Stock</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <div
                            className={`
                              w-5 h-5 rounded border-2 flex items-center justify-center
                              ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                            `}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {tempSelected.length} of {max} products selected
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Select {tempSelected.length} Product{tempSelected.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPicker;

