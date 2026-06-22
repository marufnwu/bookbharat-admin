import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { orderEnhancementsApi } from '../../api/orderEnhancements';
import {
  EMAIL_TEMPLATES,
  WHATSAPP_TEMPLATES,
  SMS_TEMPLATES,
  type CommunicationTemplate,
} from '../../types/orderEnhancements';

interface CommunicationPanelProps {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber: string;
  totalAmount: number;
  trackingNumber?: string;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  orderNumber,
  totalAmount,
  trackingNumber,
}) => {
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp' | 'sms' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch communication history
  const { data: communicationsData, refetch: refetchCommunications } = useQuery({
    queryKey: ['order-communications', orderId],
    queryFn: () => orderEnhancementsApi.getCommunications(orderId),
  });

  const communications = communicationsData?.communications || [];

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: () => orderEnhancementsApi.sendEmail(orderId, { subject, message }),
    onSuccess: () => {
      toast.success('Email sent successfully!');
      setActiveChannel(null);
      setSubject('');
      setMessage('');
      refetchCommunications();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send email');
    },
  });

  // Send WhatsApp Mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: () => orderEnhancementsApi.sendWhatsApp(orderId, { message }),
    onSuccess: () => {
      toast.success('WhatsApp message sent!');
      setActiveChannel(null);
      setMessage('');
      refetchCommunications();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send WhatsApp message');
    },
  });

  // Send SMS Mutation
  const sendSmsMutation = useMutation({
    mutationFn: () => orderEnhancementsApi.sendSms(orderId, { message }),
    onSuccess: () => {
      toast.success('SMS sent successfully!');
      setActiveChannel(null);
      setMessage('');
      refetchCommunications();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    let templates: CommunicationTemplate[] = [];
    if (activeChannel === 'email') templates = EMAIL_TEMPLATES;
    if (activeChannel === 'whatsapp') templates = WHATSAPP_TEMPLATES;
    if (activeChannel === 'sms') templates = SMS_TEMPLATES;

    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Replace placeholders
      let processedMessage = template.message
        .replace(/{customer_name}/g, customerName)
        .replace(/{order_number}/g, orderNumber)
        .replace(/{total_amount}/g, totalAmount.toString())
        .replace(/{tracking_number}/g, trackingNumber || 'N/A')
        .replace(/{status}/g, 'Processing');

      setMessage(processedMessage);
      
      if (template.subject) {
        let processedSubject = template.subject
          .replace(/{order_number}/g, orderNumber);
        setSubject(processedSubject);
      }
    }
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (activeChannel === 'email') {
      if (!subject.trim()) {
        toast.error('Please enter a subject');
        return;
      }
      sendEmailMutation.mutate();
    } else if (activeChannel === 'whatsapp') {
      sendWhatsAppMutation.mutate();
    } else if (activeChannel === 'sms') {
      sendSmsMutation.mutate();
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getChannelIcon = (channel: string) => {
    if (channel === 'email') return <Mail className="h-4 w-4" />;
    if (channel === 'whatsapp') return <MessageSquare className="h-4 w-4" />;
    return <Send className="h-4 w-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Send className="h-5 w-5" />
          Customer Communication
        </h2>
      </div>

      <div className="p-6">
        {!activeChannel ? (
          <div className="space-y-3">
            <button
              onClick={() => setActiveChannel('email')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-blue-900">Send Email</div>
                  <div className="text-xs text-blue-600">{customerEmail}</div>
                </div>
              </div>
              <Send className="h-4 w-4 text-blue-600" />
            </button>

            <button
              onClick={() => {
                if (!customerPhone) {
                  toast.error('No phone number available');
                  return;
                }
                setActiveChannel('whatsapp');
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              disabled={!customerPhone}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-green-900">Send WhatsApp</div>
                  <div className="text-xs text-green-600">{customerPhone || 'No phone number'}</div>
                </div>
              </div>
              <Send className="h-4 w-4 text-green-600" />
            </button>

            <button
              onClick={() => {
                if (!customerPhone) {
                  toast.error('No phone number available');
                  return;
                }
                setActiveChannel('sms');
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              disabled={!customerPhone}
            >
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-purple-900">Send SMS</div>
                  <div className="text-xs text-purple-600">{customerPhone || 'No phone number'}</div>
                </div>
              </div>
              <Send className="h-4 w-4 text-purple-600" />
            </button>

            {/* Communication History */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Communications</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {communications.length > 0 ? (
                  communications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="mt-0.5">{getChannelIcon(comm.channel)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{comm.channel}</span>
                          {getStatusIcon(comm.status)}
                        </div>
                        <div className="text-gray-600 truncate">{comm.subject || comm.message}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">
                          {new Date(comm.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No communications yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium capitalize flex items-center gap-2">
                {activeChannel === 'email' && <Mail className="h-5 w-5 text-blue-600" />}
                {activeChannel === 'whatsapp' && <MessageSquare className="h-5 w-5 text-green-600" />}
                {activeChannel === 'sms' && <Send className="h-5 w-5 text-purple-600" />}
                Send {activeChannel}
              </h3>
              <button
                onClick={() => {
                  setActiveChannel(null);
                  setSubject('');
                  setMessage('');
                  setSelectedTemplate('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose a template --</option>
                {(activeChannel === 'email' ? EMAIL_TEMPLATES :
                  activeChannel === 'whatsapp' ? WHATSAPP_TEMPLATES :
                  SMS_TEMPLATES).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (Email only) */}
            {activeChannel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={activeChannel === 'sms' ? 3 : 6}
                placeholder={`Enter your ${activeChannel} message...`}
                maxLength={activeChannel === 'sms' ? 160 : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {activeChannel === 'sms' && (
                <p className="text-xs text-gray-500 mt-1">{message.length}/160 characters</p>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sendEmailMutation.isPending || sendWhatsAppMutation.isPending || sendSmsMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(sendEmailMutation.isPending || sendWhatsAppMutation.isPending || sendSmsMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send {activeChannel}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationPanel;
