import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

// API service
import { adminApi } from '../../services/adminApi';

// Types
interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: number;
  posts_count: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  children?: BlogCategory[];
  parent?: BlogCategory;
}

const BlogCategories: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);

  // Fetch categories
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['blog-categories', searchTerm],
    queryFn: () => adminApi.getBlogCategories({ search: searchTerm }),
    refetchOnWindowFocus: false,
  });
  const categories = response?.data;

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => adminApi.deleteBlogCategory(categoryId),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ categoryId, isActive }: { categoryId: number; isActive: boolean }) =>
      adminApi.updateBlogCategory(categoryId, { is_active: isActive }),
    onSuccess: () => {
      toast.success('Category status updated');
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDelete = (category: BlogCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  const handleStatusToggle = (categoryId: number, isActive: boolean) => {
    updateStatusMutation.mutate({ categoryId, isActive });
  };

  const renderCategory = (category: BlogCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="mr-2 p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              )}
              <div
                className="w-8 h-8 rounded flex items-center justify-center mr-3"
                style={{ backgroundColor: category.color }}
              >
                {category.icon ? (
                  <span className="text-white text-sm">{category.icon}</span>
                ) : (
                  <FolderOpen className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {category.name}
                </div>
                <div className="text-sm text-gray-500">{category.slug}</div>
                {category.description && (
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {category.description}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {category.posts_count} posts
            </span>
          </td>
          <td className="px-6 py-4">
            <button
              onClick={() => handleStatusToggle(category.id, !category.is_active)}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                category.is_active ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  category.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {new Date(category.created_at).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 text-right text-sm font-medium">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-5 w-5" />
              </Menu.Button>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href={`/blog/categories/${category.id}/edit`}
                          className={`${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } flex items-center px-4 py-2 text-sm`}
                        >
                          <Edit className="mr-3 h-4 w-4" />
                          Edit
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleDelete(category)}
                          className={`${
                            active ? 'bg-gray-100 text-red-900' : 'text-red-700'
                          } flex items-center w-full px-4 py-2 text-sm`}
                          disabled={(category.posts_count ?? 0) > 0}
                        >
                          <Trash2 className="mr-3 h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </td>
        </tr>
        {hasChildren && isExpanded && category.children?.map((child) => renderCategory(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Blog Categories</h1>
            <p className="mt-1 text-sm text-gray-500">
              Organize your blog posts with categories
            </p>
          </div>
          <a
            href="/blog/categories/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            Failed to load categories. Please try again.
          </div>
        ) : categories?.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new blog category.
            </p>
            <div className="mt-6">
              <a
                href="/blog/categories/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories?.map((category: BlogCategory) => renderCategory(category))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{selectedCategory?.name}"?
                        {selectedCategory && (selectedCategory.posts_count ?? 0) > 0 && (
                          <span className="text-red-600 font-medium">
                            {' '}This category contains {selectedCategory.posts_count} posts. You must move or delete these posts first.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  disabled={deleteCategoryMutation.isPending ? true : (selectedCategory ? (selectedCategory.posts_count ?? 0) > 0 : false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteCategoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCategories;