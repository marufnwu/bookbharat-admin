import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Eye,
  Mail,
  Save,
  X,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';

const EmailTemplates: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [formData, setFormData] = useState<any>({});

  // Fetch all email templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/settings/email-templates');
      return response.data;
    },
  });

  // Flatten the grouped templates (grouped by language) into a single array
  const templates = useMemo(() => {
    if (!templatesData?.templates) return [];
    const grouped = templatesData.templates;
    // If it's an object (grouped by language), flatten it
    if (typeof grouped === 'object' && !Array.isArray(grouped)) {
      return Object.values(grouped).flat();
    }
    return Array.isArray(grouped) ? grouped : [];
  }, [templatesData]);

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/settings/email-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  // Preview template mutation
  const previewTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/settings/email-templates/${id}/preview`);
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.preview);
      setShowTestModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to preview template');
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ id, email }: { id: number; email: string }) => {
      const response = await api.post(`/settings/email-templates/${id}/test`, { email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setShowTestModal(false);
      setTestEmail('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    },
  });

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      subject: template.subject,
      html_content: template.html_content || template.content,
      text_content: template.text_content,
      from_name: template.from_name,
      from_email: template.from_email,
      is_active: template.enabled,
    });
  };

  const handlePreview = async (template: any) => {
    setPreviewingTemplate(template);
    previewTemplateMutation.mutate(template.id);
  };

  const handleSendTest = (template: any) => {
    setPreviewingTemplate(template);
    setShowTestModal(true);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateTemplateMutation.mutate({
      id: editingTemplate.id,
      data: formData,
    });
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setFormData({});
  };

  const handleSendTestEmail = () => {
    if (!testEmail || !previewingTemplate) return;
    if (!/\S+@\S+\.\S+/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    sendTestEmailMutation.mutate({
      id: previewingTemplate.id,
      email: testEmail,
    });
  };

  const handleHtmlContentChange = (content: string) => {
    setFormData({ ...formData, html_content: content });
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
          <h1 className="text-2xl font-semibold text-gray-900">Email Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your email templates and test them
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">Using Variables</h3>
          <p className="text-sm text-blue-800">
            Use placeholders in your email templates: <code className="bg-blue-100 px-1 rounded">{'{{customer_name}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{order_id}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{order_total}}'}</code>, etc.
            These will be automatically replaced with actual values when the email is sent.
          </p>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              {templates.map((template: any) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{template.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{template.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.enabled ? (
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
                        onClick={() => handlePreview(template)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleSendTest(template)}
                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                      >
                        <Mail className="h-4 w-4" />
                        Test
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Email Template</h2>
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
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Email subject with {{variables}}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML Content
                  </label>
                  <RichTextEditor
                    value={formData.html_content || ''}
                    onChange={handleHtmlContentChange}
                    placeholder="Enter email content with {{variables}}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Content (optional)
                  </label>
                  <textarea
                    value={formData.text_content || ''}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Plain text version of the email"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.from_name || ''}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={formData.from_email || ''}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
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
                    disabled={updateTemplateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Email Preview</h2>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <div className="border-b border-gray-200 pb-2 mb-4">
                  <div className="text-sm text-gray-500">Subject:</div>
                  <div className="font-medium">{previewData.subject}</div>
                </div>

                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Send Test Email</h2>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="test@example.com"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestEmail('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendTestEmailMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {sendTestEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
