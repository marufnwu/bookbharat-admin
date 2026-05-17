import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Send, CheckCircle, Clock, AlertTriangle, Pause, AlertCircle, Loader2, Trash2, RotateCcw, MessageSquare, ExternalLink, ChevronDown, Search } from 'lucide-react';
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
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

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

  const loadOrders = async (search: string = '') => {
    setLoadingOrders(true);
    try {
      const response = await api.get('/orders', {
        params: {
          search: search,
          per_page: 20,
        }
      });
      // Handle the nested response structure from the existing orders API
      const ordersData = response.data?.data || response.data?.orders || response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 20) : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
    setTestPhone(order.customer_phone || order.user?.phone || '');
    setShowOrderDropdown(false);
    setOrderSearch('');

    // Auto-fill test data based on order and event type
    if (selectedTemplate) {
      const eventType = selectedTemplate.event_type;
      const sampleData: Record<string, any> = {
        login_otp: { name: order.customer_name || order.user?.name || 'Test User', otp: '123456', order_id: order.order_number },
        cart_recovery: { name: order.customer_name || order.user?.name || 'Test User', items_count: '3', cart_value: order.total_amount, recovery_url: `https://bookbharat.com/cart/recover?token=${order.id}` },
        order_placed: { customer_name: order.customer_name || order.user?.name || 'Customer', order_number: order.order_number, amount: order.total_amount, order_id: order.order_number },
        order_shipped: { customer_name: order.customer_name || order.user?.name || 'Customer', order_number: order.order_number, carrier: order.courier_partner || 'BlueDart', tracking_number: order.tracking_number || 'TRK123456', delivery_date: 'Monday', order_id: order.order_number },
        order_delivered: { order_number: order.order_number, order_id: order.order_number },
        payment_failed: { customer_name: order.customer_name || order.user?.name || 'Customer', order_number: order.order_number, amount: order.total_amount, payment_method: order.payment_method || 'Card' },
      };
      setTestData(JSON.stringify(sampleData[eventType] || {}, null, 2));
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
    // If order is selected, use the sendForOrder endpoint
    if (selectedOrder) {
      try {
        const orderId = selectedOrder.id || selectedOrder.order_id;
        const response = await api.post(
          `/settings/messaging/whatsapp/orders/${orderId}/send`,
          {
            event_type: template.event_type,
            phone: testPhone || selectedOrder.customer_phone || (selectedOrder.user as any)?.phone,
          }
        );

        if (response.data.success) {
          toast.success('Message sent successfully!');
          setSelectedTemplate(null);
          setSelectedOrder(null);
        } else {
          toast.error(response.data.message);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
      return;
    }

    // Fallback to manual test send
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

  const isOrderTemplate = (eventType: string) => {
    return ['order_placed', 'order_shipped', 'order_delivered', 'order_cancelled'].includes(eventType);
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
                                login_otp: { name: 'Test User', otp: '123456', order_id: 'ORD-123' },
                                cart_recovery: { name: 'Test User', items_count: '3', cart_value: '599', recovery_url: 'https://bookbharat.com/cart/recover?token=abc123' },
                                order_placed: { customer_name: 'Test User', order_number: 'ORD-123', amount: '999', order_id: 'ORD-123' },
                                order_shipped: { customer_name: 'Test User', order_number: 'ORD-123', carrier: 'BlueDart', tracking_number: 'TRK123456', delivery_date: 'Monday', order_id: 'ORD-123' },
                                order_delivered: { order_number: 'ORD-123', order_id: 'ORD-123' },
                                payment_failed: { customer_name: 'Test User', order_number: 'ORD-123', amount: '999', payment_method: 'Card' },
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

                      {/* WhatsApp Message Preview */}
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Preview</label>
                        <div className="bg-[#ECE5DD] rounded-lg p-3 max-w-[280px]">
                          {/* WhatsApp Header */}
                          {selectedTemplate.components?.find((c: any) => c.type === 'HEADER') && (
                            <div className="bg-[#00A884] text-white text-xs p-2 rounded-t-lg font-medium">
                              {selectedTemplate.components.find((c: any) => c.type === 'HEADER')?.text || 'BookBharat'}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            {/* Header */}
                            {selectedTemplate.components?.find((c: any) => c.type === 'HEADER')?.format === 'TEXT' && (
                              <h4 className="font-semibold text-gray-800 mb-1 text-sm">
                                {selectedTemplate.components.find((c: any) => c.type === 'HEADER')?.text}
                              </h4>
                            )}

                            {/* Body */}
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text?.replace(/\{\{(\d+)\}\}/g, '{{$1}}')}
                            </p>

                            {/* Footer */}
                            {selectedTemplate.components?.find((c: any) => c.type === 'FOOTER') && (
                              <p className="text-xs text-gray-400 mt-2">
                                {selectedTemplate.components.find((c: any) => c.type === 'FOOTER')?.text}
                              </p>
                            )}

                            {/* Buttons */}
                            {selectedTemplate.components?.find((c: any) => c.type === 'BUTTONS')?.buttons && (
                              <div className="mt-3 space-y-2">
                                {selectedTemplate.components.find((c: any) => c.type === 'BUTTONS').buttons.map((button: any, idx: number) => (
                                  button.type === 'URL' ? (
                                    <a
                                      key={idx}
                                      href={button.url?.replace(/\{\{(\d+)\}\}/g, '{{$1}}')}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 bg-[#00A884] text-white text-xs font-medium py-2 px-3 rounded cursor-pointer hover:bg-[#008069] transition-colors"
                                    >
                                      {button.text}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : button.type === 'COPY_CODE' ? (
                                    <button
                                      key={idx}
                                      className="flex items-center justify-center gap-2 bg-[#00A884] text-white text-xs font-medium py-2 px-3 rounded w-full cursor-pointer hover:bg-[#008069] transition-colors"
                                      onClick={() => toast.success('OTP copied to clipboard!')}
                                    >
                                      <span className="flex-1">{button.text}</span>
                                      <span className="text-[10px] opacity-75">[TAP TO COPY]</span>
                                    </button>
                                  ) : (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-center gap-2 bg-[#00A884] text-white text-xs font-medium py-2 px-3 rounded"
                                    >
                                      {button.text}
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Sample Data Note */}
                          <div className="text-[10px] text-gray-500 mt-2 text-center">
                            <span>{'{{'}customer_name{'}}'} = Test User</span>
                            <br />
                            <span>{'{{'}order_number{'}}'} = ORD-123</span>
                          </div>
                        </div>
                      </div>

                      {selectedTemplate.status === 'APPROVED' && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Test Send</h4>
                          <div className="space-y-3">
                            {/* Order Selection Dropdown - Only for order templates */}
                            {isOrderTemplate(selectedTemplate.event_type) && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Select Order (optional)
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search orders..."
                                    value={orderSearch}
                                    onChange={(e) => {
                                      setOrderSearch(e.target.value);
                                      setShowOrderDropdown(true);
                                      loadOrders(e.target.value);
                                    }}
                                    onFocus={() => {
                                      setShowOrderDropdown(true);
                                      loadOrders();
                                    }}
                                  />
                                  {selectedOrder && (
                                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                      <span className="font-medium">{selectedOrder.order_number}</span>
                                      <span className="text-gray-500 ml-2">- {selectedOrder.customer_name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrder(null);
                                          setOrderSearch('');
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  )}
                                  {showOrderDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                      {loadingOrders ? (
                                        <div className="p-2 text-sm text-gray-500 flex items-center">
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          Loading orders...
                                        </div>
                                      ) : orders.length === 0 ? (
                                        <div className="p-2 text-sm text-gray-500">No orders found</div>
                                      ) : (
                                        orders.map((order) => (
                                          <div
                                            key={order.id}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            onClick={() => handleOrderSelect(order)}
                                          >
                                            <div className="font-medium text-sm">{order.order_number}</div>
                                            <div className="text-xs text-gray-500">
                                              {order.customer_name} - ₹{order.total_amount}
                                              <span className={`ml-2 px-1 py-0.5 rounded text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                              </span>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Selecting an order will auto-fill the message data</p>
                              </div>
                            )}
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
                                {(selectedTemplate.required_parameters?.buttons?.count > 0) && (
                                  <span className="block">Button URL params: {Object.keys(selectedTemplate.required_parameters?.buttons?.mapping || {}).join(', ')}</span>
                                )}
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
