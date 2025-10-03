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
import { Table, Button, Badge, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Customer, FilterOptions, TableColumn } from '../../types';
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

  const getVerificationBadge = (verified: string | null) => {
    return verified ? (
      <Badge variant="success">Verified</Badge>
    ) : (
      <Badge variant="warning">Unverified</Badge>
    );
  };

  const getCustomerTypeBadge = (totalSpent: number) => {
    if (totalSpent >= 50000) {
      return <Badge variant="success">VIP</Badge>;
    } else if (totalSpent >= 10000) {
      return <Badge variant="info">Premium</Badge>;
    } else if (totalSpent > 0) {
      return <Badge variant="default">Regular</Badge>;
    } else {
      return <Badge variant="warning">New</Badge>;
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      render: (value) => `#${value}`,
    },
    {
      key: 'name',
      title: 'Customer',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (value) => value || 'N/A',
    },
    {
      key: 'email_verified_at',
      title: 'Status',
      render: (value) => getVerificationBadge(value),
    },
    {
      key: 'total_orders',
      title: 'Orders',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'total_spent',
      title: 'Total Spent',
      sortable: true,
      render: (value) => (
        <div>
          <div className="font-medium">{formatCurrency(value)}</div>
          <div className="text-xs">{getCustomerTypeBadge(value)}</div>
        </div>
      ),
    },
    {
      key: 'average_order_value',
      title: 'Avg Order',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'last_order_date',
      title: 'Last Order',
      render: (value) =>
        value ? format(new Date(value), 'MMM dd, yyyy') : 'Never',
    },
    {
      key: 'created_at',
      title: 'Joined',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Link to={`/customers/${record.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/customers/${record.id}/edit`}>
            <Button variant="ghost" size="sm">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCustomer(record.id)}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your customer base
          </p>
        </div>
        <Link to="/customers/create">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {(customersResponse as any)?.users?.total || (customersResponse as any)?.data?.meta?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Verified Customers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {((customersResponse as any)?.users?.data || (customersResponse as any)?.data?.data || []).filter((c: any) => c.email_verified_at).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">VIP Customers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {((customersResponse as any)?.users?.data || (customersResponse as any)?.data?.data || []).filter((c: any) => c.total_spent >= 50000).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">New Customers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {((customersResponse as any)?.users?.data || (customersResponse as any)?.data?.data || []).filter((c: any) => c.total_spent === 0).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={(customersResponse as any)?.users?.data || (customersResponse as any)?.data?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: filters.page || 1,
            total: (customersResponse as any)?.users?.total || (customersResponse as any)?.data?.meta?.total || 0,
            pageSize: filters.per_page || 10,
            onChange: handlePageChange,
          }}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};

export default UserList;