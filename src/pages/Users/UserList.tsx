import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { customersApi } from '../../api';
import { Button, Card, CardContent, Badge, StatusBadge, PageSkeleton } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Customer, FilterOptions } from '../../types';
import { format } from 'date-fns';

const UserList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    per_page: 10,
    search: '',
    sort_by: 'created_at',
    sort_direction: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customersApi.getCustomers(filters),
  });

  // Mutations
  const deleteCustomerMutation = useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showSuccess('Customer deleted successfully');
    },
    onError: (error: any) => {
      showError('Failed to delete customer', error.response?.data?.message);
    },
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: key,
      sort_direction: direction,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteCustomer = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getVerificationBadgeVariant = (verified: string | null): 'success' | 'warning' => {
    return verified ? 'success' : 'warning';
  };

  const getCustomerTypeBadgeVariant = (totalSpent: number): 'success' | 'info' | 'default' | 'warning' => {
    if (totalSpent >= 50000) return 'success';
    if (totalSpent >= 10000) return 'info';
    if (totalSpent > 0) return 'default';
    return 'warning';
  };

  const getCustomerTypeLabel = (totalSpent: number): string => {
    if (totalSpent >= 50000) return 'VIP';
    if (totalSpent >= 10000) return 'Premium';
    if (totalSpent > 0) return 'Regular';
    return 'New';
  };

  const customers = (customersResponse as any)?.users?.data || (customersResponse as any)?.data?.data || [];
  const totalCustomers = (customersResponse as any)?.users?.total || (customersResponse as any)?.data?.meta?.total || 0;
  const verifiedCount = customers.filter((c: any) => c.email_verified_at).length;
  const vipCount = customers.filter((c: any) => c.total_spent >= 50000).length;
  const newCount = customers.filter((c: any) => c.total_spent === 0).length;

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your customer base
          </p>
        </div>
        <Link to="/customers/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Verified</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">VIP</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{vipCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">New</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{newCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1 w-full sm:w-auto">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                >
                  <option value="created_at">Join Date</option>
                  <option value="name">Name</option>
                  <option value="total_spent">Total Spent</option>
                  <option value="total_orders">Total Orders</option>
                  <option value="last_order_date">Last Order</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Direction
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.sort_direction}
                  onChange={(e) => handleFilterChange('sort_direction', e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Page
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.per_page}
                  onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer: Customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{customer.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getVerificationBadgeVariant(customer.email_verified_at)}>
                        {customer.email_verified_at ? 'Verified' : 'Unverified'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
                      <Badge variant={getCustomerTypeBadgeVariant(customer.total_spent)} className="mt-1">
                        {getCustomerTypeLabel(customer.total_spent)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCustomers > (filters.per_page || 10) && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Showing page {filters.page} of {Math.ceil(totalCustomers / (filters.per_page || 10))}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= Math.ceil(totalCustomers / (filters.per_page || 10))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer: Customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </div>
                  <Badge variant={getVerificationBadgeVariant(customer.email_verified_at)}>
                    {customer.email_verified_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{customer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-medium">{customer.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-medium">{formatCurrency(customer.total_spent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <Badge variant={getCustomerTypeBadgeVariant(customer.total_spent)}>
                      {getCustomerTypeLabel(customer.total_spent)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Joined {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                  </span>
                  <div className="flex space-x-2">
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/customers/${customer.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;