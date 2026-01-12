/**
 * Recovery Modal Component
 * Modal for sending recovery messages (email/sms/whatsapp)
 */

import React, { useState } from 'react';
import { X, Mail, MessageSquare, MessageCircle, Send } from 'lucide-react';
import type { SendRecoveryForm, Cart } from '../types';

interface RecoveryModalProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: SendRecoveryForm) => void;
  isPending: boolean;
}

const RecoveryModal: React.FC<RecoveryModalProps> = ({
  cart,
  isOpen,
  onClose,
  onSend,
  isPending,
}) => {
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [emailType, setEmailType] = useState<'first_reminder' | 'second_reminder' | 'final_reminder'>('first_reminder');

  if (!isOpen) return null;

  const channels = [
    { id: 'email', label: 'Email', icon: Mail, available: !!cart.user?.email },
    { id: 'sms', label: 'SMS', icon: MessageSquare, available: !!cart.user?.phone },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, available: !!cart.user?.phone },
  ];

  const handleSubmit = () => {
    onSend({ channel, email_type: emailType });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send Recovery Message</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Sending to: <span className="font-medium">{cart.user?.email || 'Guest'}</span>
          </p>
          <p className="text-sm text-gray-600">
            Cart Value: <span className="font-medium">₹{cart.total?.toLocaleString()}</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => ch.available && setChannel(ch.id as any)}
                  disabled={!ch.available}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition ${
                    channel === ch.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : ch.available
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ch.icon className="h-5 w-5" />
                  <span className="text-xs">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="first_reminder">First Reminder</option>
              <option value="second_reminder">Second Reminder (with discount)</option>
              <option value="final_reminder">Final Reminder (last chance)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {emailType === 'first_reminder' && 'Gentle reminder about their cart'}
              {emailType === 'second_reminder' && 'Includes a discount code'}
              {emailType === 'final_reminder' && 'Urgency message with best offer'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;
