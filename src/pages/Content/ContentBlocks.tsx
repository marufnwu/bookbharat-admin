import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Save,
  X,
  Plus,
  Globe,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

const ContentBlocks: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Fetch all content blocks
  const { data: blocksData, isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: async () => {
      const response = await api.get('/content-blocks');
      return response.data;
    },
  });

  const blocks = blocksData?.blocks || [];

  // Update block mutation
  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/content-blocks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      toast.success('Content block updated successfully');
      setEditingBlock(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update content block');
    },
  });

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/content-blocks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      toast.success('Content block created successfully');
      setShowAddModal(false);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create content block');
    },
  });

  // Delete block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/content-blocks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      toast.success('Content block deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete content block');
    },
  });

  const handleEdit = (block: any) => {
    setEditingBlock(block);
    setFormData({
      key: block.key,
      content: block.content,
      language: block.language,
      category: block.category,
      description: block.description,
      is_active: block.is_active,
      order: block.order,
    });
  };

  const handleSave = () => {
    if (editingBlock) {
      updateBlockMutation.mutate({
        id: editingBlock.id,
        data: formData,
      });
    } else {
      createBlockMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingBlock(null);
    setShowAddModal(false);
    setFormData({});
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this content block?')) {
      deleteBlockMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setShowAddModal(true);
    setFormData({
      key: '',
      content: '',
      language: 'en',
      category: '',
      description: '',
      is_active: true,
      order: 0,
    });
  };

  // Filter blocks
  const filteredBlocks = blocks.filter((block: any) => {
    if (filterCategory !== 'all' && block.category !== filterCategory) return false;
    if (filterLanguage !== 'all' && block.language !== filterLanguage) return false;
    return true;
  });

  // Get unique categories
  const categories = Array.from(new Set(blocks.map((block: any) => block.category))) as string[];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Blocks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage error messages, empty states, and other UI content
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
      </div>

      {/* Content Blocks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
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
              {filteredBlocks.map((block: any) => (
                <tr key={block.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-900">{block.key}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {block.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      {block.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-sm text-gray-900">
                      <Globe className="h-4 w-4" />
                      {block.language.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {block.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(block)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBlocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No content blocks found
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editingBlock || showAddModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingBlock ? 'Edit Content Block' : 'Add New Content Block'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key || ''}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="error.404.title"
                    disabled={!!editingBlock}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Unique identifier for this content block
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter content text"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select category</option>
                      <option value="error">Error Messages</option>
                      <option value="empty">Empty States</option>
                      <option value="success">Success Messages</option>
                      <option value="loading">Loading Messages</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.language || 'en'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Short description"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order || 0}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex-1 flex items-end">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateBlockMutation.isPending || createBlockMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateBlockMutation.isPending || createBlockMutation.isPending
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentBlocks;
