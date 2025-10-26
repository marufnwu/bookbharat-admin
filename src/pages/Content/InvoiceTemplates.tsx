import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Save,
  X,
  Plus,
  CheckCircle,
  FileText,
  Trash2,
  Star
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';

const InvoiceTemplates: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Fetch all invoice templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const response = await api.get('/invoice-templates');
      return response.data;
    },
  });

  const templates = templatesData?.data || [];

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/invoice-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/invoice-templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template created successfully');
      setShowAddModal(false);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/invoice-templates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    },
  });

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      header_html: template.header_html,
      footer_html: template.footer_html,
      styles_css: template.styles_css,
      thank_you_message: template.thank_you_message,
      legal_disclaimer: template.legal_disclaimer,
      logo_url: template.logo_url,
      show_company_address: template.show_company_address,
      show_gst_number: template.show_gst_number,
      is_active: template.is_active,
      is_default: template.is_default,
    });
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: formData,
      });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setShowAddModal(false);
    setFormData({});
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setShowAddModal(true);
    setFormData({
      name: '',
      description: '',
      header_html: '',
      footer_html: '',
      styles_css: '',
      thank_you_message: '',
      legal_disclaimer: '',
      logo_url: '',
      show_company_address: true,
      show_gst_number: true,
      is_active: true,
      is_default: false,
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">Invoice Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Customize invoice appearance and content
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template: any) => (
          <div key={template.id} className="bg-white rounded-lg shadow overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.is_default && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!template.is_default && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  {template.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Logo:</span>
                  <span className="text-gray-900">{template.logo_url ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Company Address:</span>
                  <span className="text-gray-900">{template.show_company_address ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">GST Number:</span>
                  <span className="text-gray-900">{template.show_gst_number ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No invoice templates found. Create your first template to get started.
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {(editingTemplate || showAddModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingTemplate ? 'Edit Invoice Template' : 'Add New Invoice Template'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Invoice Template Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo_url || ''}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Template description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header HTML
                  </label>
                  <RichTextEditor
                    value={formData.header_html || ''}
                    onChange={(value) => setFormData({ ...formData, header_html: value })}
                    placeholder="Enter header HTML content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer HTML
                  </label>
                  <RichTextEditor
                    value={formData.footer_html || ''}
                    onChange={(value) => setFormData({ ...formData, footer_html: value })}
                    placeholder="Enter footer HTML content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom CSS Styles
                  </label>
                  <textarea
                    value={formData.styles_css || ''}
                    onChange={(e) => setFormData({ ...formData, styles_css: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="/* Custom CSS styles */"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thank You Message
                  </label>
                  <textarea
                    value={formData.thank_you_message || ''}
                    onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Disclaimer
                  </label>
                  <textarea
                    value={formData.legal_disclaimer || ''}
                    onChange={(e) => setFormData({ ...formData, legal_disclaimer: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Payment is due within 30 days of invoice date."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_company_address !== false}
                      onChange={(e) => setFormData({ ...formData, show_company_address: e.target.checked })}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Show Company Address</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_gst_number !== false}
                      onChange={(e) => setFormData({ ...formData, show_gst_number: e.target.checked })}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Show GST Number</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default || false}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Set as Default</span>
                  </label>
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
                    disabled={updateTemplateMutation.isPending || createTemplateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateTemplateMutation.isPending || createTemplateMutation.isPending
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

export default InvoiceTemplates;
