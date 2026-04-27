import api from './axios';
import { useAuthStore } from '../store/authStore';
import type {
  SendEmailRequest,
  SendMessageRequest,
  PartialRefundRequest,
  UpdateAddressRequest,
  AddInternalNoteRequest,
  OrderInternalNote,
  OrderCommunication,
} from '../types/orderEnhancements';

const ORDER_ENHANCEMENTS_BASE = '/orders';

export const orderEnhancementsApi = {
  // Customer Communication
  sendEmail: async (orderId: number, data: SendEmailRequest) => {
    const response = await api.post(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/send-email`, data);
    return response.data;
  },

  sendWhatsApp: async (orderId: number, data: SendMessageRequest) => {
    const response = await api.post(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/send-whatsapp`, data);
    return response.data;
  },

  sendSms: async (orderId: number, data: SendMessageRequest) => {
    const response = await api.post(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/send-sms`, data);
    return response.data;
  },

  getCommunications: async (orderId: number): Promise<{ success: boolean; communications: OrderCommunication[] }> => {
    const response = await api.get(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/communications`);
    return response.data;
  },

  // Refunds
  partialRefund: async (orderId: number, data: PartialRefundRequest) => {
    const response = await api.post(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/refund-partial`, data);
    return response.data;
  },

  // Address Management
  updateShippingAddress: async (orderId: number, data: UpdateAddressRequest) => {
    const response = await api.put(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/shipping-address`, data);
    return response.data;
  },

  updateBillingAddress: async (orderId: number, data: UpdateAddressRequest) => {
    const response = await api.put(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/billing-address`, data);
    return response.data;
  },

  // Internal Notes
  addInternalNote: async (orderId: number, data: AddInternalNoteRequest) => {
    const response = await api.post(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/internal-note`, data);
    return response.data;
  },

  getInternalNotes: async (orderId: number): Promise<{ success: boolean; notes: OrderInternalNote[] }> => {
    const response = await api.get(`${ORDER_ENHANCEMENTS_BASE}/${orderId}/internal-notes`);
    return response.data;
  },

  // PDF Generation
  getInvoicePdfUrl: (orderId: number) => {
    return `${api.defaults.baseURL}${ORDER_ENHANCEMENTS_BASE}/${orderId}/invoice/pdf`;
  },

  getPackingSlipPdfUrl: (orderId: number) => {
    return `${api.defaults.baseURL}${ORDER_ENHANCEMENTS_BASE}/${orderId}/packing-slip/pdf`;
  },
};
