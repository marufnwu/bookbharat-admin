import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Package, TrendingUp, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '../../components';
import { productsApi } from '../../api';

const PreordersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: preordersData, isLoading } = useQuery({
    queryKey: ['preorders', filterStatus],
    queryFn: async () => {
      const params: any = {};
      if (filterStatus === 'active') {
        params.is_preorder = true;
        params.release_dategte = new Date().toISOString().split('T')[0];
      } else if (filterStatus === 'upcoming') {
        params.is_preorder = true;
      }
      return productsApi.getProducts(params);
    },
  });

  const preorders = preordersData?.data?.data || preordersData?.data || [];
  const filteredPreorders = preorders.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (product: any) => {
    if (!product.is_preorder) return null;

    if (!product.release_date) {
      return <Badge variant="warning">No Release Date</Badge>;
    }

    const releaseDate = new Date(product.release_date);
    const today = new Date();

    if (releaseDate < today) {
      return <Badge variant="success">Released</Badge>;
    }

    return <Badge variant="info">Upcoming</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preorders</h1>
          <p className="text-gray-500">Manage preorder products and reservations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Preorders</p>
                <p className="text-2xl font-bold">{preorders.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold">
                  {preorders.filter((p: any) => {
                    if (!p.is_preorder || !p.release_date) return false;
                    return new Date(p.release_date) > new Date();
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Stock</p>
                <p className="text-2xl font-bold">
                  {preorders.reduce((sum: number, p: any) => sum + (p.stock_quantity || 0), 0)}
                </p>
              </div>
              <Package className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold">
                  {preorders.filter((p: any) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 10)).length}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Preorder Products</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Preorders</option>
                <option value="active">Active (Not Released)</option>
                <option value="upcoming">Upcoming (Next 30 Days)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredPreorders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No preorder products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Release Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reserved</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreorders.map((product: any) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]?.image_url ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{product.sku || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(product.release_date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">₹{product.price}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={product.stock_quantity <= (product.low_stock_threshold || 10) ? 'text-amber-600' : ''}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-purple-600">
                        {product.reserved_quantity || 0}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(product)}
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            View <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreordersList;
