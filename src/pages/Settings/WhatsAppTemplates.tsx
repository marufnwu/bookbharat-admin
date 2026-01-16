import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Send, CheckCircle, Clock, AlertTriangle, Pause, AlertCircle, X, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface WhatsAppTemplate {
  id: number;
  template_name: string;
  template_id: string;
  status: string;
  language: string;
  category: string;
  event_type: string;
  components: any;
  required_parameters: any;
  synced_at: string;
  structure_changed?: boolean;
  code_template_name?: string;
}

interface TemplateStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  paused: number;
}

const WhatsAppTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testData, setTestData] = useState('');

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings/messaging/whatsapp/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/settings/messaging/whatsapp/stats');
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/settings/messaging/whatsapp/sync');
      if (response.data.success) {
        toast.success('Templates synced successfully!');
        loadTemplates();
        loadStats();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const createTemplate = async (eventType: string) => {
    setCreatingId(eventType);
    try {
      const response = await api.post('/settings/messaging/whatsapp/create', {
        event_type: eventType
      });

      if (response.data.success) {
        toast.success(response.data.message);
        loadTemplates();
        loadStats();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setCreatingId(null);
    }
  };

  const testTemplate = async (template: WhatsAppTemplate) => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const data = JSON.parse(testData);
      const response = await api.post(
        `/settings/messaging/whatsapp/templates/${template.id}/test`,
        {
          phone: testPhone,
          data,
        }
      );

      if (response.data.success) {
        toast.success('Test message sent successfully!');
        setSelectedTemplate(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send test message');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string, text: string, icon: React.ReactNode }> = {
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" /> },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
      PAUSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Pause className="w-3 h-3 mr-1" /> },
      NOT_SYNCED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <RefreshCw className="w-3 h-3 mr-1" /> },
    };

    const config = configs[status] || configs.PAUSED;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
        <div className="flex gap-2">
            <button
                onClick={async () => {
                    if (!window.confirm('This will create all missing templates in your Meta account. Continue?')) return;
                    setSyncing(true); // Re-use loading state
                    try {
                        const response = await api.post('/settings/messaging/whatsapp/bulk-create');
                        if (response.data.success) {
                             toast.success(response.data.message);
                             loadTemplates();
                             loadStats();
                        } else {
                            toast.error(response.data.message);
                        }
                    } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Bulk create failed');
                    } finally {
                        setSyncing(false);
                    }
                }}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {syncing ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Send className="-ml-1 mr-2 h-4 w-4" />}
                Create All Missing
            </button>
            <button
            onClick={syncTemplates}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
            {syncing ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <RefreshCw className="-ml-1 mr-2 h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync Status from Meta'}
            </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Templates</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.approved}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.rejected}</dd>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Templates are defined in code (<code>WhatsAppTemplates.php</code>) and synced <strong>TO</strong> Meta Business Manager.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Params</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No templates defined in code. Check <code>WhatsAppTemplates.php</code>.
                  </td>
                </tr>
              ) : (
                templates.map((template, index) => (
                  <tr key={template.id || `template-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.template_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{template.event_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(template.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.required_parameters?.body?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {template.status === 'NOT_SYNCED' && (
                          <button
                            onClick={() => createTemplate(template.event_type)}
                            disabled={creatingId === template.event_type}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            title="Create in Meta"
                          >
                            {creatingId === template.event_type ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Create'
                            )}
                          </button>
                        )}
                        {template.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              const sampleData: Record<string, any> = {
                                login_otp: { name: 'Test User', otp: '123456' },
                                cart_recovery: { name: 'Test User', items_count: '3', cart_value: '599' },
                                order_placed: { customer_name: 'Test User', order_number: 'ORD-123', total_amount: '999' },
                                order_shipped: { customer_name: 'Test User', order_number: 'ORD-123', courier_name: 'BlueDart', tracking_number: 'TRK123456', estimated_delivery: 'Monday' },
                                order_delivered: { customer_name: 'Test User', order_number: 'ORD-123' },
                                payment_failed: { customer_name: 'Test User', order_number: 'ORD-123', amount: '999', failure_reason: 'Bank declined' },
                              };
                              setTestData(JSON.stringify(sampleData[template.event_type] || {}, null, 2));
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Test Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {template.id && template.status !== 'NOT_SYNCED' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete template "${template.template_name}" from Meta and database?`)) return;
                              try {
                                const response = await api.delete(`/settings/messaging/whatsapp/templates/${template.id}`);
                                if (response.data.success) {
                                  toast.success('Template deleted!');
                                  loadTemplates();
                                  loadStats();
                                } else {
                                  toast.error(response.data.message);
                                }
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Delete failed');
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {template.structure_changed && template.status !== 'NOT_SYNCED' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Recreate template "${template.template_name}"? This will delete the old version and create a new one with the updated structure. You'll need to wait for re-approval.`)) return;
                              try {
                                const response = await api.post('/settings/messaging/whatsapp/recreate', { event_type: template.event_type });
                                if (response.data.success) {
                                  toast.success(response.data.message);
                                  loadTemplates();
                                  loadStats();
                                } else {
                                  toast.error(response.data.message);
                                }
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Recreate failed');
                              }
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-orange-500 hover:bg-orange-600"
                            title="Code structure changed - Recreate template in Meta"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Recreate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedTemplate(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4" id="modal-title">
                      {selectedTemplate.template_name}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedTemplate.status)}</div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Structure</label>
                        <div className="mt-1 bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-60 border border-gray-200">
                          <pre>{JSON.stringify(selectedTemplate.components, null, 2)}</pre>
                        </div>
                      </div>

                      {selectedTemplate.status === 'APPROVED' && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Test Send</h4>
                          <div className="space-y-3">
                             <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                               <input 
                                 type="text" 
                                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                 placeholder="+919876543210"
                                 value={testPhone}
                                 onChange={(e) => setTestPhone(e.target.value)}
                               />
                               <p className="mt-1 text-xs text-gray-500">Include country code</p>
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Variables (JSON)</label>
                               <textarea
                                 rows={4}
                                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                                 value={testData}
                                 onChange={(e) => setTestData(e.target.value)}
                               />
                               <p className="mt-1 text-xs text-gray-500">
                                 Required params: {Object.values(selectedTemplate.required_parameters?.body?.mapping || {}).join(', ')}
                               </p>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedTemplate.status === 'APPROVED' && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => testTemplate(selectedTemplate)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplates;
