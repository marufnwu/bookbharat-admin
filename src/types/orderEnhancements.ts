// Order Enhancement Types

export interface OrderInternalNote {
  id: number;
  order_id: number;
  admin_user_id: number | null;
  note: string;
  created_by_name: string | null;
  adminUser?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderCommunication {
  id: number;
  order_id: number;
  admin_user_id: number | null;
  channel: 'email' | 'whatsapp' | 'sms';
  recipient: string;
  subject?: string;
  message: string;
  template_used?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  message_id?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  adminUser?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SendEmailRequest {
  subject: string;
  message: string;
  template?: string;
}

export interface SendMessageRequest {
  message: string;
  template?: string;
}

export interface PartialRefundRequest {
  amount: number;
  reason: string;
  items?: Array<{
    order_item_id: number;
    refund_amount: number;
  }>;
}

export interface UpdateAddressRequest {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface AddInternalNoteRequest {
  note: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  subject?: string;
  message: string;
  channel: 'email' | 'whatsapp' | 'sms';
}

// Predefined templates
export const EMAIL_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    subject: 'Your Order #{order_number} is Confirmed',
    message: 'Dear {customer_name},\n\nThank you for your order! Your order #{order_number} has been confirmed and is being processed.\n\nTotal Amount: ₹{total_amount}\n\nWe will notify you once your order is shipped.\n\nThank you for shopping with BookBharat!',
    channel: 'email',
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    subject: 'Your Order #{order_number} Has Been Shipped',
    message: 'Dear {customer_name},\n\nGreat news! Your order #{order_number} has been shipped.\n\nTracking Number: {tracking_number}\n\nYou can track your shipment using the tracking number above.\n\nThank you!',
    channel: 'email',
  },
  {
    id: 'order_delivered',
    name: 'Order Delivered',
    subject: 'Your Order #{order_number} Has Been Delivered',
    message: 'Dear {customer_name},\n\nYour order #{order_number} has been successfully delivered!\n\nWe hope you enjoy your books. If you have any issues, please contact our support team.\n\nThank you for choosing BookBharat!',
    channel: 'email',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    message: '',
    channel: 'email',
  },
];

export const WHATSAPP_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'order_update',
    name: 'Order Update',
    message: 'Hi {customer_name}! Your order #{order_number} status: {status}. Total: ₹{total_amount}. Track here: {tracking_url}',
    channel: 'whatsapp',
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    message: 'Hi! Your order #{order_number} payment is pending. Amount: ₹{total_amount}. Please complete payment to process your order.',
    channel: 'whatsapp',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    message: '',
    channel: 'whatsapp',
  },
];

export const SMS_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'order_shipped_sms',
    name: 'Order Shipped (SMS)',
    message: 'Your order #{order_number} shipped! Track: {tracking_number}. Thanks, BookBharat',
    channel: 'sms',
  },
  {
    id: 'delivery_today',
    name: 'Delivery Today',
    message: 'Your order #{order_number} will be delivered today. Please be available. BookBharat',
    channel: 'sms',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    message: '',
    channel: 'sms',
  },
];
