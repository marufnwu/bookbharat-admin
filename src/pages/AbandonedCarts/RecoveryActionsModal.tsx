import React, { useState } from 'react';
import { api } from '../../api/axios';
import {
  X,
  Tag,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Gift,
  Clock,
  RefreshCw,
  TrendingUp,
  Zap,
  Send,
  CheckCircle,
  AlertCircle,
  Target,
  BarChart3,
  User,
  DollarSign,
  Bell,
  Settings,
  Plus,
  Eye,
} from 'lucide-react';
import ErrorDisplay from './ErrorDisplay';
import {
  DISCOUNT_DEFAULTS,
  URGENCY_THRESHOLDS,
} from '../../constants/abandonedCarts';

interface RecoveryActionsModalProps {
  cart: any;
  onClose: () => void;
  onActionComplete: () => void;
}

const RecoveryActionsModal: React.FC<RecoveryActionsModalProps> = ({
  cart,
  onClose,
  onActionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'discount' | 'reminder' | 'message' | 'template' | 'history'>('insights');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<any>(null);

  // Form states
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(String(DISCOUNT_DEFAULTS.MAX_PERCENTAGE));
  const [validDays, setValidDays] = useState(String(DISCOUNT_DEFAULTS.VALID_DAYS));
  const [usageLimit, setUsageLimit] = useState('');
  const [reminderType, setReminderType] = useState('email');
  const [scheduledAt, setScheduledAt] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('email');
  const [subject, setSubject] = useState('');
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [templates, setTemplates] = useState<any>(null);

  // Fetch cart insights
  React.useEffect(() => {
    fetchInsights();
    fetchTemplates();
  }, [cart.id]);

  const fetchInsights = async () => {
    try {
      const response = await api.get(`/abandoned-carts/${cart.id}/insights`);
      const data = response.data;
      setInsights(data.insights);
    } catch (error: any) {
      console.error('Failed to fetch insights:', error);
      setActionError(error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/abandoned-carts/recovery-templates');
      const data = response.data;
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
      setActionError(error);
    }
  };

  const handleGenerateDiscount = async (discountData: any) => {
    setLoading(true);
    setActionError(null);
    try {
      const response = await api.post(`/abandoned-carts/${cart.id}/generate-discount`, discountData);
      const result = response.data;

      if (result.success) {
        onActionComplete();
        onClose();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReminder = async (reminderData: any) => {
    setLoading(true);
    setActionError(null);
    try {
      const response = await api.post(`/abandoned-carts/${cart.id}/schedule-reminder`, reminderData);
      const result = response.data;

      if (result.success) {
        onActionComplete();
        onClose();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageData: any) => {
    setLoading(true);
    setActionError(null);
    try {
      const response = await api.post(`/abandoned-carts/${cart.id}/send-personalized-message`, messageData);
      const result = response.data;

      if (result.success) {
        onActionComplete();
        onClose();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateName: string, sendImmediately: boolean = false) => {
    setLoading(true);
    setActionError(null);
    try {
      const response = await api.post(`/abandoned-carts/${cart.id}/apply-template`, {
        template_name: templateName,
        send_immediately: sendImmediately,
      });
      const result = response.data;

      if (result.success) {
        onActionComplete();
        onClose();
      } else {
        setActionError({ response: { data: { message: result.message } } });
      }
    } catch (error: any) {
      setActionError(error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= URGENCY_THRESHOLDS.CRITICAL) return 'text-green-600 bg-green-100';
    if (score >= URGENCY_THRESHOLDS.HIGH) return 'text-blue-600 bg-blue-100';
    if (score >= URGENCY_THRESHOLDS.MEDIUM) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recovery Actions
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Cart #{cart.id} • ₹{cart.total_amount} • {cart.items_count} items
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {actionError && (
          <div className="p-4 border-b border-gray-200">
            <ErrorDisplay
              error={actionError}
              title="Action Failed"
              onDismiss={() => setActionError(null)}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'insights', label: 'AI Insights', icon: BarChart3 },
            { id: 'discount', label: 'Discount', icon: Gift },
            { id: 'reminder', label: 'Reminder', icon: Bell },
            { id: 'message', label: 'Message', icon: Send },
            { id: 'template', label: 'Templates', icon: Zap },
            { id: 'history', label: 'History', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* AI Insights Tab */}
          {activeTab === 'insights' && insights && (
            <div className="space-y-6">
              {/* Priority & Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${getPriorityColor(insights.priority_score)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Priority Score</h4>
                      <p className="text-2xl font-bold mt-1">{insights.priority_score}/100</p>
                    </div>
                    <Target className="h-8 w-8" />
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${getUrgencyColor(insights.urgency_level)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Urgency Level</h4>
                      <p className="text-lg font-bold mt-1 capitalize">{insights.urgency_level}</p>
                    </div>
                    <AlertCircle className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  {insights.suggested_actions?.map((action: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{action.description}</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          action.priority === 'high' ? 'bg-red-200 text-red-800' :
                          action.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {action.priority} priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Best Contact Method
                  </h4>
                  <p className="text-sm text-gray-600 capitalize">{insights.best_contact_method}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Optimal Contact Time
                  </h4>
                  <p className="text-sm text-gray-600">{insights.optimal_contact_time}</p>
                </div>
              </div>

              {/* Recovery Probability */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Recovery Probability</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Base: {insights.recovery_probability?.base}%</span>
                      <span>Adjusted: {insights.recovery_probability?.adjusted}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${insights.recovery_probability?.adjusted}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discount Tab */}
          {activeTab === 'discount' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900">Quick Discount Generation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Generate a discount code to incentivize cart recovery
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    id="discountValue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '15' : '500'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : '9999'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Days
                  </label>
                  <input
                    type="number"
                    id="validDays"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    placeholder="7"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Limit (optional)
                  </label>
                  <input
                    type="number"
                    id="usageLimit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>

                <button
                  onClick={() => handleGenerateDiscount({
                    discount_type: discountType,
                    discount_value: parseFloat(discountValue) || 15,
                    valid_days: parseInt(validDays) || 7,
                    usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
                  })}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Generate Discount
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Reminder Tab */}
          {activeTab === 'reminder' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900">Schedule Recovery Reminder</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Set a reminder to follow up with this customer
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Type
                  </label>
                  <select id="reminderType" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="manual_followup">Manual Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled At
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledAt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    id="messageContent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="Enter your reminder message..."
                  ></textarea>
                </div>

                <button
                  onClick={() => handleScheduleReminder({
                    reminder_type: reminderType,
                    scheduled_at: scheduledAt,
                    message_content: messageContent,
                  })}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      Schedule Reminder
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Message Tab */}
          {activeTab === 'message' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900">Send Personalized Message</h4>
                <p className="text-sm text-green-700 mt-1">
                  Send a custom message to this customer
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Type
                  </label>
                  <select id="messageType" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {messageType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter email subject..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    id="messageContentMsg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={6}
                    placeholder="Enter your message..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeDiscount"
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="includeDiscount" className="text-sm text-gray-700">
                    Include discount code with this message
                  </label>
                </div>

                <button
                  onClick={() => handleSendMessage({
                    message_type: messageType,
                    subject: subject,
                    message_content: messageContent,
                    include_discount: includeDiscount,
                  })}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'template' && templates && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900">Recovery Templates</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Quick-apply pre-built recovery templates
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templates).map(([key, template]: any) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-900">{template.name}</h5>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {template.discount_percentage}% off
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.message}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyTemplate(key, false)}
                        className="flex-1 bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleApplyTemplate(key, true)}
                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                      >
                        Send Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Recovery History</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Complete history of recovery actions for this cart
                </p>
              </div>

              {/* This would fetch and display the recovery history */}
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Recovery history will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryActionsModal;