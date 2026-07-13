import React, { useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import { Drawer, Button, Banner } from '../../../components';
import { getOrderPhone } from '../../../features/orders';

interface Props {
  open: boolean;
  onClose: () => void;
  order: any;
  onSend: (eventType: string, phone: string) => Promise<void>;
  isSending: boolean;
}

interface NotificationOption {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
}

const NOTIFICATIONS: NotificationOption[] = [
  {
    type: 'order_placed',
    label: 'Order Confirmation',
    description: 'Send order placed notification to customer',
    icon: <span className="text-xl">📦</span>,
    bg: 'bg-blue-50',
  },
  {
    type: 'order_shipped',
    label: 'Shipping Update',
    description: 'Send shipment notification with tracking details',
    icon: <span className="text-xl">🚚</span>,
    bg: 'bg-purple-50',
  },
  {
    type: 'order_delivered',
    label: 'Delivery Confirmation',
    description: 'Send delivery confirmation message',
    icon: <span className="text-xl">✅</span>,
    bg: 'bg-green-50',
  },
];

/**
 * WhatsApp notification composer. Rendered as a right-side drawer for
 * less context-switching. Auto-derives the phone number from order data.
 */
export const WhatsAppSendDrawer: React.FC<Props> = ({
  open,
  onClose,
  order,
  onSend,
  isSending,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const phone = getOrderPhone(order);

  const handleSend = async () => {
    if (!selectedType || !phone) return;
    await onSend(selectedType, phone);
    setSelectedType(null);
  };

  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose();
        setSelectedType(null);
      }}
      title={
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
            <MessageSquare className="h-4 w-4" />
          </span>
          <span>Send WhatsApp Notification</span>
        </div>
      }
      width="w-full sm:w-[480px]"
    >
      <div className="space-y-5">
        {/* Order summary */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-2">
          <Row label="Order" value={<span className="font-mono font-semibold">#{order?.order_number}</span>} />
          <Row label="Customer" value={<span className="font-medium">{order?.user?.name || 'Customer'}</span>} />
          <Row
            label="Phone"
            value={
              phone ? (
                <span className="font-mono font-medium">{phone}</span>
              ) : (
                <span className="text-error-600">Not available</span>
              )
            }
          />
        </div>

        {!phone && (
          <Banner
            tone="danger"
            title="No phone number available"
            description="Cannot send WhatsApp message — no phone number on file for this order."
          />
        )}

        {phone && (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Select Notification Type</div>
              <div className="space-y-2">
                {NOTIFICATIONS.map((notification) => {
                  const isSelected = selectedType === notification.type;
                  return (
                    <button
                      key={notification.type}
                      type="button"
                      onClick={() => setSelectedType(notification.type)}
                      aria-pressed={isSelected}
                      className={`group w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-success-500 bg-success-50/60 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${notification.bg}`}
                      >
                        {notification.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{notification.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {notification.description}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  onClose();
                  setSelectedType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSend}
                loading={isSending}
                disabled={!selectedType}
                className="bg-success-600 hover:bg-success-700"
                leftIcon={<MessageSquare className="h-4 w-4" />}
              >
                Send Message
              </Button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};

interface RowProps {
  label: string;
  value: React.ReactNode;
}
const Row: React.FC<RowProps> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

export default WhatsAppSendDrawer;