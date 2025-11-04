import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Send,
  Clock,
  Globe,
  MessageSquare,
  Zap,
  Eye,
  Settings,
  X,
} from 'lucide-react';
import { api } from '../../api/axios';
import { showToast } from '../../utils/toast';

// API functions
const whatsappTemplateApi = {
  getDashboard: () => api.get('/notifications/whatsapp/templates/dashboard'),
  getStructures: () => api.get('/notifications/whatsapp/templates/structures'),
  createTemplate: (data: any) => api.post('/notifications/whatsapp/templates/create', data),
  testTemplate: (data: any) => api.post('/notifications/whatsapp/templates/test', data),
};

const WhatsAppTemplateManager: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [testNumber, setTestNumber] = useState<string>('');

  // Fetch real-time template data from Meta
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: whatsappTemplateApi.getDashboard,
    refetchInterval: 30000,
  });

  // Fetch available template structures
  const { data: structuresData } = useQuery({
    queryKey: ['template-structures'],
    queryFn: whatsappTemplateApi.getStructures,
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: whatsappTemplateApi.createTemplate,
    onSuccess: (response) => {
      console.log('✅ Template creation success:', response);
      showToast.success('Template created successfully!');
      setShowCreateModal(false);
      setSelectedTemplate('');
      refetch();
    },
    onError: (error: any) => {
      console.error('❌ Template creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to create template';
      showToast.error(errorMsg);
    },
  });

  // Test template mutation
  const testMutation = useMutation({
    mutationFn: whatsappTemplateApi.testTemplate,
    onSuccess: () => {
      showToast.success('Test message sent successfully!');
      setShowTestModal(false);
      setTestNumber('');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Failed to send test message';
      showToast.error(errorMsg);
    },
  });

  const handleCreateTemplate = (templateName: string) => {
    const template = systemTemplates.find((t: any) => t.name === templateName);
    if (!template) return;

    const payload = {
      type: template.name,
      language: 'en', // Default to English, can be made configurable
      category: template.category,
      parameters: Object.values(template.required_parameters || {}),
    };

    console.log('🚀 Sending template creation payload:', payload);

    createMutation.mutate(payload);
  };

  const handleTestTemplate = () => {
    if (!selectedTemplate || !testNumber) return;

    // Get template structure to provide sample parameters
    const template = systemTemplates.find((t: any) => t.name === selectedTemplate);
    const sampleParameters: any = {};

    if (template && template.required_parameters) {
      Object.keys(template.required_parameters).forEach((paramKey) => {
        const param = template.required_parameters[paramKey];
        if (param.type === 'text') {
          sampleParameters[paramKey] = param.example || 'Sample Value';
        } else if (param.type === 'url') {
          sampleParameters[paramKey] = param.example || 'https://example.com';
        }
      });
    }

    console.log('🚀 Sending test template payload:', {
      type: selectedTemplate,
      test_number: testNumber,
      parameters: sampleParameters,
      language: 'en',
    });

    testMutation.mutate({
      type: selectedTemplate,
      test_number: testNumber,
      parameters: sampleParameters,
      language: 'en',
    });
  };

  // Helper functions for status display
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'disabled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Extract template data from API response
  const metaTemplates = dashboardData?.data?.data?.meta_templates || [];
  const systemTemplates = dashboardData?.data?.data?.static_templates || [];
  const connectionStatus = dashboardData?.data?.data?.connection_status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage WhatsApp Business message templates
            {dashboardData?.data?.data?.last_synced && (
              <span className="ml-2 text-sm text-green-600">
                • Synced {new Date(dashboardData.data.data.last_synced).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`p-4 rounded-lg border ${
          connectionStatus === 'connected'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Connected to WhatsApp Business API' : 'API Configuration Required'}
            </span>
          </div>
        </div>
      )}

      {/* System Templates */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            All Template Structures ({systemTemplates.length})
          </h2>
        </div>

        <div className="p-6">
          {systemTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemTemplates.map((template: any) => {
                const metaTemplate = metaTemplates.find((t: any) => t.name === template.name);
                const isCreated = !!metaTemplate;

                return (
                  <div key={template.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Template Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{template.display_name}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-mono">
                        {template.name}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {template.category}
                      </span>
                    </div>

                    {/* Meta Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {isCreated ? (
                          <>
                            {getStatusIcon(metaTemplate.status)}
                            <span className="text-xs text-gray-600">
                              {metaTemplate.status?.toUpperCase()}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Not Created</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe className="w-3 h-3" />
                        {template.supported_languages?.length || 0} languages
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="text-xs text-gray-600 mb-3">
                      {Object.keys(template.required_parameters || {}).length} parameters •
                      {template.example_text?.length || 0} chars
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template.name);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                      {isCreated ? (
                        <button
                          onClick={() => {
                            setSelectedTemplate(template.name);
                            setShowTestModal(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                        >
                          <Send className="w-3 h-3" />
                          Test
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTemplate(template.name);
                            setShowCreateModal(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          Create
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600">No template structures available</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Detail Modal */}
      {showDetailModal && selectedTemplate && (() => {
        const template = systemTemplates.find((t: any) => t.name === selectedTemplate);
        const metaTemplate = metaTemplates.find((t: any) => t.name === selectedTemplate);

        if (!template) return null;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{template.display_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTemplate('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Status and Meta Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Template Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Template Name</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {template.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Category</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {template.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Supported Languages</span>
                        <div className="flex flex-wrap gap-1">
                          {template.supported_languages?.map((lang: string) => (
                            <span key={lang} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Parameters</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Object.keys(template.required_parameters || {}).length} required
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Meta Platform Status</h3>
                    {metaTemplate ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(metaTemplate.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(metaTemplate.status)}
                              {metaTemplate.status?.toUpperCase()}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Template ID</span>
                          <span className="text-sm font-mono text-gray-900">{metaTemplate.id}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Quality Rating</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            metaTemplate.quality_rating === 'GREEN' ? 'bg-green-100 text-green-800' :
                            metaTemplate.quality_rating === 'YELLOW' ? 'bg-amber-100 text-amber-800' :
                            metaTemplate.quality_rating === 'RED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {metaTemplate.quality_rating || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Last Updated</span>
                          <span className="text-sm text-gray-900">
                            {new Date(metaTemplate.last_updated_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-amber-50 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm text-amber-800">Not created on Meta yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Structure */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Message Structure</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="p-4 bg-white rounded border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{template.example_text}</p>
                    </div>
                  </div>
                </div>

                {/* Parameters Details */}
                {template.required_parameters && Object.keys(template.required_parameters).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Required Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(template.required_parameters).map(([key, config]: [string, any]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{config.label}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              config.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {config.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span className="font-medium text-gray-900">{config.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Example:</span>
                              <span className="font-medium text-gray-900">{config.example}</span>
                            </div>
                            {config.max_length && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Max Length:</span>
                                <span className="font-medium text-gray-900">{config.max_length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTemplate('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {metaTemplate ? (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowTestModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Test Template
                      </button>
                      <a
                        href={`https://business.facebook.com/wa/manage/message-templates/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View in Meta
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowCreateModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create on Meta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Template Modal */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create WhatsApp Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">{selectedTemplate}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Structure</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{systemTemplates.find((t: any) => t.name === selectedTemplate)?.example_text}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This will create the template on Meta Business Platform with the predefined structure.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateTemplate(selectedTemplate)}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Template Modal */}
      {showTestModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test WhatsApp Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">{selectedTemplate}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Phone Number</label>
                <input
                  type="text"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Include country code</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Test messages will be sent to the provided number.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestNumber('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTestTemplate}
                disabled={!testNumber || testMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testMutation.isPending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplateManager;