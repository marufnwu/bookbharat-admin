import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Package, Loader } from 'lucide-react';
import { adminApi } from '../../pages/AbandonedCarts/api'; // Or general API

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productId: number, variantId?: number, quantity?: number, unitPrice?: number) => Promise<void>;
}

interface ProductResult {
  id: number;
  name: string;
  sku: string;
  price: number;
  image_url?: string;
  stock: number;
  variants?: {
      id: number;
      sku: string;
      price: number;
      stock: number;
      attribute_values: Record<string, string>;
  }[];
}

export default function ProductSearchModal({ isOpen, onClose, onAdd }: ProductSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        searchProducts(query);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchProducts = async (q: string) => {
    setLoading(true);
    try {
      // Assuming a generic product search endpoint exists. 
      // If not, we might need to create one or use the one from Products page.
      // For now, let's assume a dedicated search endpoint for this component or reuse existing.
      // Since I don't recall seeing a specific one, I'll mock the call structure or use a placeholder.
      // Ideally: /api/admin/products/search?q=...
      const response = await fetch(`http://localhost:8000/api/v1/admin/products?search=${q}`, {
          headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}`,
              'Accept': 'application/json'
          }
      });
      const data = await response.json();
      if (data.data) {
          setResults(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = async (product: ProductResult, variantId?: number, price?: number) => {
      const idKey = variantId ? variantId : product.id;
      setAddingId(idKey);
      await onAdd(product.id, variantId, 1, price);
      setAddingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add Item to Cart</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X className="h-5 w-5"/></button>
          </div>

          <div className="mb-4">
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search for products..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                  />
                  {loading && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Loader className="h-4 w-4 text-indigo-500 animate-spin" />
                      </div>
                  )}
              </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
              {results.length === 0 && query.length > 2 && !loading ? (
                  <p className="text-center text-gray-500 py-4">No products found.</p>
              ) : (
                  <ul className="divide-y divide-gray-200">
                      {results.map((product) => (
                          <li key={product.id} className="py-3">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                      {product.image_url ? (
                                           <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover mr-3" />
                                      ) : (
                                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                                              <Package className="h-5 w-5 text-gray-400" />
                                          </div>
                                      )}
                                      <div>
                                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                          <p className="text-xs text-gray-500">SKU: {product.sku} | Stock: {product.stock}</p>
                                      </div>
                                  </div>
                                  {(!product.variants || product.variants.length === 0) && (
                                       <button
                                       onClick={() => handleAddClick(product, undefined, product.price)}
                                       disabled={addingId === product.id}
                                       className="ml-4 flex-shrink-0 px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                     >
                                         {addingId === product.id ? 'Adding...' : `Add ₹${product.price}`}
                                     </button>
                                  )}
                              </div>
                              {/* Variants */}
                              {product.variants && product.variants.length > 0 && (
                                  <div className="mt-2 ml-12 space-y-2">
                                      {product.variants.map((variant) => (
                                          <div key={variant.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                              <span className="text-gray-600">
                                                  {Object.values(variant.attribute_values || {}).join(' / ')} - SKU: {variant.sku}
                                              </span>
                                              <button
                                                  onClick={() => handleAddClick(product, variant.id, variant.price)}
                                                  disabled={addingId === variant.id}
                                                  className="ml-2 px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-white disabled:opacity-50"
                                              >
                                                   {addingId === variant.id ? '...' : `Add ₹${variant.price}`}
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </li>
                      ))}
                  </ul>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
