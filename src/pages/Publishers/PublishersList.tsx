import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { publishersApi } from '../../api';
import { toast } from '../../utils/toast';

interface Publisher {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  is_active: boolean;
  products_count: number;
  created_at: string;
}

export default function PublishersList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    country: 'India',
    is_active: true,
  });

  // Fetch publishers
  const { data, isLoading } = useQuery({
    queryKey: ['publishers', page, search],
    queryFn: () => publishersApi.getAll({ page, per_page: 20, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPublisher) {
        return publishersApi.update(editingPublisher.id, data);
      }
      return publishersApi.create(data);
    },
    onSuccess: () => {
      toast.success(editingPublisher ? 'Publisher updated' : 'Publisher created');
      setShowModal(false);
      setEditingPublisher(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => publishersApi.delete(id),
    onSuccess: () => {
      toast.success('Publisher deleted');
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete publisher');
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => publishersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      website_url: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      country: 'India',
      is_active: true,
    });
  };

  const openEdit = (publisher: Publisher) => {
    setEditingPublisher(publisher);
    setFormData({
      name: publisher.name,
      slug: publisher.slug,
      description: publisher.description || '',
      website_url: publisher.website_url || '',
      contact_email: publisher.contact_email || '',
      contact_phone: '',
      address: '',
      country: 'India',
      is_active: publisher.is_active,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingPublisher(null);
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const publishers = data?.data?.data || data?.data || [];
  const pagination = data?.data?.pagination || data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Publishers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage book publishers</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Publisher
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search publishers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publisher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {publishers.length > 0 ? (
                    publishers.map((publisher: Publisher) => (
                      <tr key={publisher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {publisher.name}
                            </div>
                            <div className="text-sm text-gray-500">{publisher.slug}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {publisher.website_url || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {publisher.products_count || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${publisher.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {publisher.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleMutation.mutate(publisher.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title={publisher.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {publisher.is_active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(publisher)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${publisher.name}"?`)) {
                                  deleteMutation.mutate(publisher.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No publishers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Page {pagination.current_page || page} of {pagination.last_page}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (pagination.last_page || 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingPublisher ? 'Edit Publisher' : 'Add Publisher'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publisher Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editingPublisher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
