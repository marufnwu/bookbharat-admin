import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Eye,
  Save,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

const ContentPages: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Fetch all content pages
  const { data: pages, isLoading } = useQuery({
    queryKey: ['content-pages'],
    queryFn: async () => {
      const response = await api.get('/content');
      return response.data.data || [];
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: any }) => {
      const response = await api.put(`/content/pages/${slug}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-pages'] });
      toast.success('Page updated successfully');
      setEditingPage(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update page');
    },
  });

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      content: page.content,
      excerpt: page.excerpt,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
    });
  };

  const handleCancel = () => {
    setEditingPage(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!editingPage) return;
    updatePageMutation.mutate({
      slug: editingPage.slug,
      data: formData,
    });
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">Content Pages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your static website pages
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">Dynamic Content</h3>
          <p className="text-sm text-blue-800">
            Use placeholders in your content: <code className="bg-blue-100 px-1 rounded">{'{{support_email}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{contact_phone}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{free_shipping_threshold}}'}</code>, etc.
            These will be automatically replaced with actual values when the page is displayed.
          </p>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {pages?.map((page: any) => (
            <div key={page.slug} className="p-6 hover:bg-gray-50 transition-colors">
              {editingPage?.slug === page.slug ? (
                <EditForm
                  formData={formData}
                  setFormData={setFormData}
                  onContentChange={handleContentChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={updatePageMutation.isPending}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">{page.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{page.excerpt || 'No description'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Slug: <code className="bg-gray-100 px-2 py-1 rounded">{page.slug}</code></span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(page)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit page"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EditFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const EditForm: React.FC<EditFormProps> = ({
  formData,
  setFormData,
  onContentChange,
  onSave,
  onCancel,
  isSaving,
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Excerpt / Description
        </label>
        <textarea
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={formData.excerpt || ''}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content (HTML) - Use placeholders like {'{{support_email}}'}
        </label>
        <textarea
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          value={formData.content || ''}
          onChange={(e) => onContentChange(e.target.value)}
        />
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={formData.meta_title || ''}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={formData.meta_description || ''}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ContentPages;
