import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { migrationApi } from '../../api/migration';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import { toast } from 'react-hot-toast';

interface LegacyProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: string;
  category?: string;
  brand?: string;
  thumbnail?: string;
  already_imported: boolean;
  v2_product_id?: number;
}

interface ProductBrowserProps {
  onImportComplete?: (results: any) => void;
}

export const ProductBrowser: React.FC<ProductBrowserProps> = ({ onImportComplete }) => {
  const [products, setProducts] = useState<LegacyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    total_found: 0,
    already_imported: 0,
    available_to_import: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    category_id: '' as string | number,
    per_page: 20,
  });

  // Auto-load products on component mount
  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        page,
        ...filters,
        category_id: filters.category_id ? Number(filters.category_id) : undefined,
      };

      const response = await migrationApi.searchLegacyProducts(params);

      if (response.success) {
        setProducts(response.data.data);
        setSummary(response.data.summary);
        setTotalPages(response.data.meta.last_page || 1);
        setCurrentPage(page);
      } else {
        toast.error('Failed to fetch products');
      }
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleProductSelect = (productId: number, checked: boolean) => {
    setSelectedProducts(prev =>
      checked
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableProducts = products
        .filter(p => !p.already_imported)
        .map(p => p.id);
      setSelectedProducts(availableProducts);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleImport = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to import');
      return;
    }

    setLoading(true);
    try {
      const response = await migrationApi.importSelectedProducts({
        product_ids: selectedProducts,
        overwrite_existing: false,
        import_images: true,
      });

      if (response.success) {
        toast.success(
          `Imported ${response.data.imported} products successfully. ` +
          `${response.data.skipped} skipped. ` +
          (response.data.failed > 0 ? `${response.data.failed} failed.` : '')
        );

        if (onImportComplete) {
          onImportComplete(response.data);
        }

        // Refresh the product list
        fetchProducts(currentPage);
        setSelectedProducts([]);
      } else {
        toast.error('Import failed');
      }
    } catch (error) {
      toast.error('Error importing products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'success' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const availableProducts = products.filter(p => !p.already_imported);
  const allAvailableSelected = availableProducts.length > 0 &&
    selectedProducts.length === availableProducts.length;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Browse Legacy Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search products by name, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-4 flex-wrap">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>

              <select
                value={filters.per_page}
                onChange={(e) => setFilters(prev => ({ ...prev, per_page: Number(e.target.value) }))}
                className="px-3 py-2 border rounded-md"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{summary.total_found}</div>
              <div className="text-sm text-gray-500">Total Found</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.available_to_import}</div>
              <div className="text-sm text-gray-500">Available to Import</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.already_imported}</div>
              <div className="text-sm text-gray-500">Already Imported</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {availableProducts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={allAvailableSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span>Select all available ({availableProducts.length})</span>
                <span className="text-sm text-gray-500">
                  {selectedProducts.length} selected
                </span>
              </div>
              <Button
                onClick={handleImport}
                disabled={selectedProducts.length === 0 || loading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import Selected ({selectedProducts.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found. Try adjusting your search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 ${
                    product.already_imported ? 'bg-gray-50 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      disabled={product.already_imported}
                      onCheckedChange={(checked) => handleProductSelect(product.id, checked)}
                      className="mt-1"
                    />

                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            SKU: {product.sku} • ID: {product.id}
                          </p>
                          {product.category && (
                            <p className="text-sm text-gray-500">
                              Category: {product.category}
                            </p>
                          )}
                          {product.brand && (
                            <p className="text-sm text-gray-500">
                              Brand: {product.brand}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-lg font-bold">
                            ₹{product.price}
                          </div>
                          {getStatusBadge(product.status)}
                          {product.already_imported && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Imported
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};