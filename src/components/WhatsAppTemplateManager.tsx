import React, { useState } from 'react';
import { RotateCw, Trash2, TestTube } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notificationSettingsApi } from '../api/notificationSettings';
import { showToast } from '../utils/toast';

interface WhatsAppTemplate {
  name: string;
  status: string;
  category?: string;
  language?: string;
  components?: Array<{
    type: string;
    text?: string;
    parameters?: Array<{
      type: string;
      text: string;
    }>;
  }>;
  created_at?: string;
  last_synced?: string;
  is_synced?: boolean;
}

interface WhatsAppDashboard {
  connection_status: {
    status: string;
    message: string;
    last_checked: string;
  };
  templates: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    list: WhatsAppTemplate[];
  };
}

const WhatsAppTemplateManager: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateTestNumber, setTemplateTestNumber] = useState<string>('');

  // Fetch WhatsApp dashboard data
  const { data: whatsappDashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['whatsapp-dashboard'],
    queryFn: () => notificationSettingsApi.getWhatsAppTemplateDashboard(),
    retry: 1,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Sync templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: (data?: { templates?: string[]; force?: boolean }) =>
      notificationSettingsApi.syncWhatsAppTemplates(data || {}),
    onSuccess: (result) => {
      showToast.success(result.message || 'Templates synced successfully!');
      refetchDashboard();
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to sync templates');
    },
  });

  // Clear caches mutation
  const clearCachesMutation = useMutation({
    mutationFn: () => notificationSettingsApi.clearWhatsAppTemplateCaches(),
    onSuccess: (result) => {
      showToast.success(result.message || 'Caches cleared successfully!');
      refetchDashboard();
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to clear caches');
    },
  });

  // Test template mutation
  const testTemplateMutation = useMutation({
    mutationFn: (data: { template_name: string; test_number: string }) =>
      notificationSettingsApi.testWhatsAppTemplate(data),
    onSuccess: (result) => {
      showToast.success(result.message || 'Test template sent successfully!');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to send test template');
    },
  });

  // Local template definitions for development and reference
  const getLocalTemplateDefinitions = () => {
    return [
      {
        name: 'order_confirmation',
        description: 'Order placement confirmation message',
        category: 'TRANSACTIONAL',
        variables: ['{{customer_name}}', '{{order_number}}', '{{total_amount}}', '{{delivery_date}}'],
        example: 'Hello {{customer_name}}, your order {{order_number}} for ₹{{total_amount}} has been confirmed. Expected delivery by {{delivery_date}}.'
      },
      {
        name: 'shipping_update',
        description: 'Shipping status update with tracking',
        category: 'TRANSACTIONAL',
        variables: ['{{customer_name}}', '{{order_number}}', '{{tracking_number}}', '{{carrier_name}}', '{{delivery_date}}'],
        example: 'Hi {{customer_name}}, your order {{order_number}} has been shipped via {{carrier_name}}. Tracking: {{tracking_number}}. Expected delivery: {{delivery_date}}.'
      },
      {
        name: 'delivery_confirmation',
        description: 'Order delivery confirmation',
        category: 'TRANSACTIONAL',
        variables: ['{{customer_name}}', '{{order_number}}'],
        example: 'Great news {{customer_name}}! Your order {{order_number}} has been delivered successfully. Thank you for shopping with BookBharat!'
      },
      {
        name: 'welcome_message',
        description: 'New user welcome message',
        category: 'MARKETING',
        variables: ['{{customer_name}}', '{{welcome_offer}}'],
        example: 'Welcome to BookBharat {{customer_name}}! Enjoy {{welcome_offer}} on your first order. Happy reading!'
      },
      {
        name: 'promotional_offer',
        description: 'Special promotional offers',
        category: 'MARKETING',
        variables: ['{{customer_name}}', '{{offer_details}}', '{{discount_percentage}}', '{{valid_until}}'],
        example: 'Hi {{customer_name}}! Special offer: {{offer_details}}. Get {{discount_percentage}}% off on selected books. Offer valid until {{valid_until}}.'
      },
      {
        name: 'payment_reminder',
        description: 'Payment due reminder',
        category: 'UTILITY',
        variables: ['{{customer_name}}', '{{order_number}}', '{{amount_due}}', '{{due_date}}'],
        example: 'Hi {{customer_name}}, payment reminder for order {{order_number}}. Amount due: ₹{{amount_due}}. Please pay by {{due_date}} to avoid order cancellation.'
      },
      {
        name: 'abandoned_cart_recovery',
        description: 'Cart abandonment recovery message',
        category: 'MARKETING',
        variables: ['{{customer_name}}', '{{cart_items}}', '{{total_value}}'],
        example: 'Hi {{customer_name}}, you left some amazing books in your cart! Total value: ₹{{total_value}}. Complete your order now and enjoy reading!'
      },
      {
        name: 'order_cancellation',
        description: 'Order cancellation confirmation',
        category: 'TRANSACTIONAL',
        variables: ['{{customer_name}}', '{{order_number}}', '{{reason}}', '{{refund_amount}}'],
        example: 'Hello {{customer_name}}, your order {{order_number}} has been cancelled. Reason: {{reason}}. Refund of ₹{{refund_amount}} will be processed within 5-7 business days.'
      }
    ];
  };

  // Handle testing local template (for development)
  const handleTestLocalTemplate = (templateName: string) => {
    const template = getLocalTemplateDefinitions().find(t => t.name === templateName);
    if (template) {
      showToast.info(`Local template "${templateName}" is for reference only. To test, create this template in your WhatsApp Business Manager first.`);
    }
  };

  // Handle sync single template
  const handleSyncSingleTemplate = (templateName: string) => {
    syncTemplatesMutation.mutate({
      templates: [templateName],
      force: true
    });
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template Dashboard Stats */}
      {whatsappDashboard?.templates && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{whatsappDashboard.templates.total || 0}</div>
            <div className="text-xs text-gray-600">Total Templates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{whatsappDashboard.templates.approved || 0}</div>
            <div className="text-xs text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{whatsappDashboard.templates.pending || 0}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{whatsappDashboard.templates.rejected || 0}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Template Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => syncTemplatesMutation.mutate({})}
          disabled={syncTemplatesMutation.isPending}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
        >
          <RotateCw className={`h-4 w-4 ${syncTemplatesMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Sync Templates</span>
        </button>
        <button
          onClick={() => clearCachesMutation.mutate()}
          disabled={clearCachesMutation.isPending}
          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Caches</span>
        </button>
      </div>

      {whatsappDashboard ? (
        <>
          {/* Local Template Definitions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-900">Predefined Template Structures</h5>
              <div className="text-xs text-gray-500">
                {getLocalTemplateDefinitions().length} local definitions
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getLocalTemplateDefinitions().map((template: any) => {
                const apiTemplate = whatsappDashboard.templates?.list?.find((api: any) => api.name === template.name);
                return (
                  <div key={template.name} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h6 className="font-medium text-gray-900 text-sm">{template.name}</h6>
                          {apiTemplate && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md">
                              Synced
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                          {template.category}
                        </span>
                        {!apiTemplate && (
                          <button
                            onClick={() => handleTestLocalTemplate(template.name)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Reference
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      <p className="font-medium mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable: string, index: number) => (
                          <span key={index} className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>

                    {template.example && (
                      <div className="text-xs text-gray-500 italic">
                        Example: {template.example}
                      </div>
                    )}

                    {apiTemplate && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            API Status: {apiTemplate.status}
                          </span>
                          <button
                            onClick={() => setSelectedTemplate(template.name)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            Test
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Templates (if available) */}
          {whatsappDashboard.templates?.list && whatsappDashboard.templates.list.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-900">API Template Details</h5>
                <div className="text-xs text-gray-500">
                  {whatsappDashboard.templates.list.length} templates from WhatsApp API
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {whatsappDashboard.templates.list.map((template: any, index: number) => (
                  <div key={template.name || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Template Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h6 className="font-medium text-gray-900">{template.name}</h6>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            template.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : template.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : template.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.status || 'UNKNOWN'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Language: {template.language || 'en'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Category: {template.category || 'MARKETING'} •
                          Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>

                      {/* Template Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSyncSingleTemplate(template.name)}
                          disabled={syncTemplatesMutation.isPending}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <RotateCw className={`h-3 w-3 ${syncTemplatesMutation.isPending ? 'animate-spin' : ''}`} />
                          <span>Sync</span>
                        </button>
                        {template.status === 'APPROVED' && (
                          <button
                            onClick={() => setSelectedTemplate(template.name)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Test
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Template Components */}
                    {template.components && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Components:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {template.components.map((component: any, index: number) => (
                            <li key={index}>
                              {component.type}: {component.text ? `"${component.text.substring(0, 100)}${component.text.length > 100 ? '...' : ''}"` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Template Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Last synced: {template.last_synced ? new Date(template.last_synced).toLocaleString() : 'Never'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {template.is_synced ? (
                          <span className="text-green-600 flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Synced</span>
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center space-x-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Pending Sync</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No API Templates Message */}
          {(!whatsappDashboard.templates?.list || whatsappDashboard.templates.list.length === 0) && (
            <div className="text-center py-6 mt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">No API Templates Found</h4>
              <p className="text-xs text-gray-500 mb-4">
                {whatsappDashboard.connection_status?.status === 'error'
                  ? `Unable to sync templates from WhatsApp API: ${whatsappDashboard.connection_status.message || 'Connection error'}`
                  : "No templates found in your WhatsApp Business account. Please create templates in your WhatsApp Business Manager first."
                }
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => syncTemplatesMutation.mutate({})}
                  disabled={syncTemplatesMutation.isPending}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Try Sync Again
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">
                  However, you can use the <strong>predefined template structures</strong> above for reference and development.
                </p>
                <p className="text-xs text-gray-500">
                  Create these templates in your WhatsApp Business Manager to enable full functionality.
                </p>
              </div>
            </div>
          )}

          {/* Template Testing - Always Available */}
          <div className="space-y-3 border-t pt-4 mt-6">
            <h5 className="text-sm font-medium text-gray-900">Test Template</h5>
            <div className="flex space-x-3">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select a template</option>
                {/* Show local templates for reference */}
                <optgroup label="Local Definitions (Reference)">
                  {getLocalTemplateDefinitions().map((template: any) => (
                    <option key={`local-${template.name}`} value={template.name} disabled>
                      {template.name} ({template.category}) - Reference Only
                    </option>
                  ))}
                </optgroup>
                {/* Show approved API templates */}
                {whatsappDashboard.templates?.list && whatsappDashboard.templates.list.length > 0 && (
                  <optgroup label="API Templates (Testable)">
                    {whatsappDashboard.templates.list
                      .filter((t: any) => t.status === 'APPROVED')
                      .map((template: any) => (
                        <option key={template.name} value={template.name}>
                          {template.name} ({template.category || 'MARKETING'})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <input
                type="tel"
                value={templateTestNumber}
                onChange={(e) => setTemplateTestNumber(e.target.value)}
                placeholder="Test number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={() => {
                  if (selectedTemplate && templateTestNumber) {
                    testTemplateMutation.mutate({
                      template_name: selectedTemplate,
                      test_number: templateTestNumber
                    });
                  } else {
                    showToast.error('Please select a template and enter test number');
                  }
                }}
                disabled={!selectedTemplate || !templateTestNumber || testTemplateMutation.isPending}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
              >
                <TestTube className="h-4 w-4" />
                <span>Test</span>
              </button>
            </div>
            {selectedTemplate && (
              <p className="text-xs text-gray-500">
                Selected template: <span className="font-medium">{selectedTemplate}</span>
                {getLocalTemplateDefinitions().find(t => t.name === selectedTemplate) && (
                  <span className="text-amber-600 ml-2">(Local reference - create in WhatsApp Business Manager to test)</span>
                )}
              </p>
            )}
          </div>

          {/* Connection Status */}
          {whatsappDashboard.connection_status && (
            <div className={`p-3 rounded-lg ${
              whatsappDashboard.connection_status.status === 'connected'
                ? 'bg-green-50 border border-green-200'
                : whatsappDashboard.connection_status.status === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  whatsappDashboard.connection_status.status === 'connected'
                    ? 'bg-green-500'
                    : whatsappDashboard.connection_status.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium capitalize">
                  {whatsappDashboard.connection_status.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {whatsappDashboard.connection_status.message}
              </p>
              {whatsappDashboard.connection_status.last_checked && (
                <p className="text-xs text-gray-500 mt-1">
                  Last checked: {new Date(whatsappDashboard.connection_status.last_checked).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Connection Status with Better UX */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Connection Issue</h3>
            <p className="text-gray-500 mb-4">
              Unable to connect to WhatsApp Business API. Please check your configuration in the Configuration tab.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-900 mb-2">To fix this issue:</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Update the WhatsApp Access Token in the Configuration tab</li>
                <li>• Ensure the Phone Number ID is correct</li>
                <li>• Verify your WhatsApp Business API permissions</li>
                <li>• Click "Sync Templates" after updating credentials</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="text-center py-4 text-gray-500">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="text-sm font-medium text-blue-900 mb-2">Template Management</h6>
          <p className="text-xs text-blue-700 mb-3">
            Connect your WhatsApp Business API to view and manage templates. Templates allow you to send structured messages to your customers.
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <p>• Approved templates can be used for messaging</p>
            <p>• Sync templates to see the latest status</p>
            <p>• Test templates before sending to customers</p>
            <p>• Local definitions show expected template format</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTemplateManager;