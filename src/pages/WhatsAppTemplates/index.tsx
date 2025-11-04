import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  RotateCcw,
  TestTube,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { notificationSettingsApi } from '../../api/notificationSettings';
import { toast } from 'react-hot-toast';

// Type definitions
interface WhatsAppTemplate {
  name: string;
  category: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  components: any[];
  required_for_events?: string[];
}

interface WhatsAppDashboardData {
  success: boolean;
  data: {
    health_status: {
      overall_status: string;
      total_templates: number;
      synced_templates: number;
      missing_templates: number;
      pending_review: number;
      errors: string[];
    };
    validation_report: {
      valid_templates: Record<string, any>;
      invalid_templates: Record<string, any>;
      warnings: Record<string, string[]>;
      summary: {
        total: number;
        valid: number;
        invalid: number;
        warnings: number;
      };
    };
    static_templates: string[];
    supported_events: string[];
    sync_config: Record<string, any>;
    connection_status: {
      status: 'connected' | 'disconnected' | 'error';
      message: string;
      business_id?: string;
      business_name?: string;
      last_checked: string;
    };
    last_updated: string;
  };
}

interface TemplateAnalytics {
  success: boolean;
  data: {
    template_usage: {
      total_sent: number;
      by_template: Record<string, number>;
      by_event: Record<string, number>;
    };
    event_performance: {
      delivery_rate: number;
      open_rate: number;
      click_rate: number;
    };
    delivery_rates: {
      overall_delivery_rate: number;
      daily_breakdown: Array<{
        date: string;
        delivered: number;
        total: number;
      }>;
    };
    error_rates: {
      overall_error_rate: number;
      common_errors: Array<{
        error_type: string;
        count: number;
        percentage: number;
      }>;
    };
  };
  period: string;
  generated_at: string;
}

interface TemplateStatus {
  success: boolean;
  data: {
    template_name: string;
    static_definition: WhatsAppTemplate;
    whatsapp_status: WhatsAppTemplate | null;
    validation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    events_using: string[];
    last_checked: string;
  };
}

const WhatsAppTemplateManagement: React.FC = () => {
  const { templateName } = useParams<{ templateName?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateTestNumber, setTemplateTestNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'analytics'>('dashboard');

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard
  } = useQuery<WhatsAppDashboardData>({
    queryKey: ['whatsapp-template-dashboard'],
    queryFn: () => notificationSettingsApi.getWhatsAppTemplateDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch template status
  const {
    data: templateStatus,
    isLoading: templateStatusLoading
  } = useQuery<TemplateStatus>({
    queryKey: ['whatsapp-template-status', selectedTemplate],
    queryFn: () => notificationSettingsApi.getWhatsAppTemplateStatus(selectedTemplate),
    enabled: !!selectedTemplate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading
  } = useQuery<TemplateAnalytics>({
    queryKey: ['whatsapp-template-analytics'],
    queryFn: () => notificationSettingsApi.getWhatsAppTemplateAnalytics('7days'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const syncTemplatesMutation = useMutation({
    mutationFn: (data?: { force?: boolean }) =>
      notificationSettingsApi.syncWhatsAppTemplates(data),
    onSuccess: () => {
      toast.success('Templates synchronized successfully');
      refetchDashboard();
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-dashboard'] });
    },
    onError: (error: any) => {
      toast.error('Failed to sync templates');
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: (data: { template_name: string; test_number: string; sample_data?: any }) =>
      notificationSettingsApi.testWhatsAppTemplate(data),
    onSuccess: () => {
      toast.success('Test message sent successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to send test message');
    },
  });

  const clearCachesMutation = useMutation({
    mutationFn: () => notificationSettingsApi.clearWhatsAppTemplateCaches(),
    onSuccess: () => {
      toast.success('Template caches cleared successfully');
      refetchDashboard();
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-dashboard'] });
    },
    onError: (error: any) => {
      toast.error('Failed to clear caches');
    },
  });

  // Event handlers
  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    navigate(`/whatsapp/templates/${templateName}`);
  };

  const handleSyncTemplates = (force = false) => {
    syncTemplatesMutation.mutate({ force });
  };

  const handleTestTemplate = (data: { template_name: string; test_number: string; sample_data?: any }) => {
    testTemplateMutation.mutate(data);
  };

  const handleClearCaches = () => {
    clearCachesMutation.mutate();
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  // Auto-select first template when dashboard loads
  useEffect(() => {
    if (dashboardData?.data?.static_templates && dashboardData.data.static_templates.length > 0 && !selectedTemplate) {
      const firstTemplate = dashboardData.data.static_templates[0];
      setSelectedTemplate(firstTemplate);
    }
  }, [dashboardData?.data, selectedTemplate]);

  // Tab content components
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Template Health Overview
          </h2>
          <button
            onClick={() => refetchDashboard()}
            disabled={dashboardLoading}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {dashboardLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.data.health_status.total_templates}
              </div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.data.health_status.synced_templates}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardData?.data.health_status.pending_review}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {dashboardData?.data.health_status.missing_templates}
              </div>
              <div className="text-sm text-gray-600">Missing/Rejected</div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">WhatsApp Connection</h3>
          <div className="flex items-center gap-2">
            {getStatusIcon(dashboardData?.data.connection_status.status || 'error')}
            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(dashboardData?.data.connection_status.status || 'error')}`}>
              {dashboardData?.data.connection_status.status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              {dashboardData?.data.connection_status.message}
            </span>
          </div>
          {dashboardData?.data.connection_status.business_name && (
            <div className="text-sm text-gray-500 mt-1">
              Business: {dashboardData?.data.connection_status.business_name}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleSyncTemplates(false)}
            disabled={syncTemplatesMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {syncTemplatesMutation.isPending ? 'Syncing...' : 'Sync Templates'}
          </button>
          <button
            onClick={() => handleSyncTemplates(true)}
            disabled={syncTemplatesMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {syncTemplatesMutation.isPending ? 'Force Syncing...' : 'Force Sync'}
          </button>
          <button
            onClick={handleClearCaches}
            disabled={clearCachesMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {clearCachesMutation.isPending ? 'Clearing...' : 'Clear Caches'}
          </button>
        </div>
      </div>

      {/* Validation Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Template Validation</h2>
        {dashboardLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.data.validation_report.summary.valid}
              </div>
              <div className="text-sm text-gray-600">Valid Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {dashboardData?.data.validation_report.summary.invalid}
              </div>
              <div className="text-sm text-gray-600">Invalid Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardData?.data.validation_report.summary.warnings}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">WhatsApp Cloud Templates - Real-Time Status</h2>
        <p className="text-sm text-gray-600 mb-4">
          Templates are fetched directly from WhatsApp Cloud API with real-time status updates
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData?.data.static_templates.map((templateName) => (
            <button
              key={templateName}
              onClick={() => handleSelectTemplate(templateName)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedTemplate === templateName
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{templateName}</div>
              <div className="text-sm text-gray-600 mt-1">
                Status: {templateStatus?.data?.whatsapp_status?.status || 'Checking...'}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Click to view real-time WhatsApp Cloud status
              </div>
            </button>
          ))}
        </div>

        {/* Template Details */}
        {selectedTemplate && templateStatusLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : selectedTemplate && templateStatus?.data ? (
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Template Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {templateStatus.data.template_name}
                </div>
                <div>
                  <strong>WhatsApp Status:</strong>{' '}
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(templateStatus.data.whatsapp_status?.status || 'error')}`}>
                    {templateStatus.data.whatsapp_status?.status || 'Not Synced'}
                  </span>
                </div>
                <div>
                  <strong>Events Using:</strong>{' '}
                  {templateStatus.data.events_using.length > 0
                    ? templateStatus.data.events_using.join(', ')
                    : 'None'
                  }
                </div>
                <div>
                  <strong>Validation:</strong>{' '}
                  <span className={`px-2 py-1 rounded text-sm ${
                    templateStatus.data.validation.valid
                      ? 'text-green-600 bg-green-100'
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {templateStatus.data.validation.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>

              {templateStatus.data.validation.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside text-red-600">
                    {templateStatus.data.validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {templateStatus.data.validation.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside text-yellow-600">
                    {templateStatus.data.validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Template Testing */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Test Template</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={templateTestNumber}
                    onChange={(e) => setTemplateTestNumber(e.target.value)}
                    placeholder="+911234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleTestTemplate({
                      template_name: selectedTemplate,
                      test_number: templateTestNumber
                    })}
                    disabled={!templateTestNumber || testTemplateMutation.isPending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    {testTemplateMutation.isPending ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select a template to view real-time WhatsApp Cloud status
          </div>
        )}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      {/* Template Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Template Analytics</h2>
        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData?.data.template_usage.total_sent}
              </div>
              <div className="text-sm text-gray-600">Total Sent</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(analyticsData?.data.event_performance.delivery_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(analyticsData?.data.event_performance.open_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(analyticsData?.data.event_performance.click_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Click Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* Usage by Template */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Usage by Template</h3>
        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(analyticsData?.data.template_usage.by_template || {}).map(([template, count]) => (
              <div key={template} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{template}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Template Management</h1>
          </div>
          <p className="text-gray-600">
            Manage your WhatsApp message templates, sync with WhatsApp Business API, and monitor template performance.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default WhatsAppTemplateManagement;