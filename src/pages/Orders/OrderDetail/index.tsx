/**
 * OrderDetail — orchestrator page.
 *
 * Composes the sub-components under ./OrderDetail/*. Each section of the
 * page (header, status stepper, items, shipment, addresses, activity,
 * sidebar) is its own component. The state, queries and mutations
 * remain here so all sub-components remain pure/presentational.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import { ordersApi } from '../../../api';
import { api } from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { orderEnhancementsApi } from '../../../api/orderEnhancements';
import { toast } from '../../../utils/toast';

import {
  PageSkeleton,
  ConfirmModal,
  Button,
} from '../../../components';
import { Package, ArrowLeft } from 'lucide-react';

import CommunicationPanel from '../../../components/Orders/CommunicationPanel';
import InternalNotesSection from '../../../components/Orders/InternalNotesSection';
import EditAddressModal from '../../../components/Orders/EditAddressModal';
import PartialRefundModal from '../../../components/Orders/PartialRefundModal';

import OrderHeader from './OrderHeader';
import OrderStatusStepper from './OrderStatusStepper';
import OrderItemsCard from './OrderItemsCard';
import ShipmentCard from './ShipmentCard';
import AddressesCard from './AddressesCard';
import PreorderCard from './PreorderCard';
import OrderActivityTimeline from './OrderActivityTimeline';
import StatusUpdateModal from './StatusUpdateModal';
import WhatsAppSendDrawer from './WhatsAppSendDrawer';
import MobileActionBar from './MobileActionBar';
import {
  CustomerCard,
  PaymentCard,
  CodCard,
  DeliveryCard,
  PackagingCard,
  ReferralCard,
  OrderSourceCard,
  RefundsCard,
  NotesCard,
  FinancialSummaryCard,
} from './OrderSidebar';

import { getOrderItems, getOrderPhone } from '../../../features/orders';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ---------------------- UI state (consolidated) ---------------------- */
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<
    { type: 'shipping' | 'billing'; address: any } | null
  >(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  /* -------------------------- Data queries ---------------------------- */
  const {
    data: orderResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(Number(id)),
    enabled: !!id,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const order = orderResponse?.order;

  const { data: shipmentResponse, refetch: refetchShipment } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/orders/${id}/shipment`);
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!id,
  });
  const shipment = shipmentResponse?.shipment;

  /* -------------------------- Mutations -------------------------------- */
  const updateStatusMutation = useMutation({
    mutationFn: ({
      status,
      note,
      overrideWorkflow,
    }: {
      status: string;
      note: string;
      overrideWorkflow: boolean;
    }) => ordersApi.updateStatus(Number(id), status, note, overrideWorkflow),
    onSuccess: () => {
      toast.success('Order status updated successfully');
      setStatusModalOpen(false);
      refetch();
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  const manualShipMutation = useMutation({
    mutationFn: (data: any) => ordersApi.updateTracking(Number(id), data),
    onSuccess: () => {
      toast.success('Order marked as shipped with tracking info');
      setStatusModalOpen(false);
      refetch();
      refetchShipment();
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Failed to update tracking'),
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/orders/${id}/shipment`);
      return res.data;
    },
    onSuccess: (data: any) => {
      if (data.warning) {
        toast.success('Shipment cancelled in system', { duration: 4000 });
        toast(data.warning, { icon: '⚠️', duration: 6000 });
      } else {
        toast.success('Shipment cancelled successfully');
      }
      setCancelConfirmOpen(false);
      refetch();
      refetchShipment();
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Failed to cancel shipment'),
  });

  const generateLabelMutation = useMutation({
    mutationFn: async () => {
      if (!shipment?.id) throw new Error('No shipment found.');
      const res = await api.post(
        `/shipping/multi-carrier/shipments/${shipment.id}/generate-label`,
      );
      return res.data;
    },
    onSuccess: (data: any) => {
      if (data.success && data.data?.label_url) {
        toast.success('Shipping label generated successfully');
        refetchShipment();
      } else {
        toast.error(data.message || 'Failed to generate label');
      }
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Failed to generate shipping label'),
  });

  /* ----------------------- Side-effect handlers ------------------------ */
  const handlePrintInvoice = () => {
    const url = orderEnhancementsApi.getInvoicePdfUrl(Number(id));
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => win.print();
      toast.success('Opening invoice for printing...');
    } else {
      toast.error('Please allow popups to print invoice');
    }
  };

  const handleDownloadInvoice = async () => {
    let loadingId: any;
    try {
      loadingId = toast.loading('Preparing invoice download...');
      const token = useAuthStore.getState().token;
      const url = orderEnhancementsApi.getInvoicePdfUrl(Number(id));
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Failed to download invoice');
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `invoice-${order?.order_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objUrl);
      document.body.removeChild(a);
      toast.success('Invoice downloaded successfully!', { id: loadingId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download invoice', { id: loadingId });
    }
  };

  const handleDownloadPackingSlip = async () => {
    try {
      const loadingId = toast.loading('Preparing packing slip...');
      const token = useAuthStore.getState().token;
      const url = orderEnhancementsApi.getPackingSlipPdfUrl(Number(id));
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Failed to download packing slip');
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `packing-slip-${order?.order_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objUrl);
      document.body.removeChild(a);
      toast.success('Packing slip downloaded successfully!', { id: loadingId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download packing slip');
    }
  };

  const handleDownloadShippingLabel = async () => {
    try {
      if (!shipment?.id) {
        toast.error('No shipment found. Please create a shipment first.');
        return;
      }
      const loadingId = toast.loading('Preparing shipping label...');
      const res = await api.get(`/shipping/multi-carrier/shipments/${shipment.id}/label`);
      const data = res.data;
      if (!data?.success || !data?.data?.label_base64) {
        toast.error(data?.message || 'Label not available');
        toast.dismiss(loadingId);
        return;
      }
      const binary = atob(data.data.label_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = data.data.filename || `shipping-label-${shipment.tracking_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objUrl);
      document.body.removeChild(a);
      toast.success('Shipping label downloaded successfully!', { id: loadingId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download shipping label');
    }
  };

  const handleSendWhatsApp = async (eventType: string, phone: string) => {
    if (!order) return;
    setSendingWhatsApp(true);
    try {
      const response = await api.post(
        `/settings/messaging/whatsapp/orders/${order.id}/send`,
        { event_type: eventType, phone },
      );
      if (response.data.success) {
        toast.success('WhatsApp message sent successfully!');
        setWhatsAppOpen(false);
      } else {
        toast.error(response.data.message || 'Failed to send WhatsApp message');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  /* ----------------------------- States -------------------------------- */
  if (isLoading) {
    return <PageSkeleton type="detail" />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Order not found</h3>
        <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  /* ------------------------------ Render ------------------------------- */
  const orderItems = getOrderItems(order);
  const canShowRefund = order.status === 'delivered' && order.payment_status === 'paid';

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <OrderHeader
        order={order}
        shipment={shipment}
        orderId={id || ''}
        onPrint={handlePrintInvoice}
        onDownloadInvoice={handleDownloadInvoice}
        onDownloadPackingSlip={handleDownloadPackingSlip}
        onCancelShipment={() => setCancelConfirmOpen(true)}
        onOpenStatusModal={() => setStatusModalOpen(true)}
        onOpenWhatsApp={() => setWhatsAppOpen(true)}
        isCancelling={cancelShipmentMutation.isPending}
      />

      <OrderStatusStepper status={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <OrderItemsCard order={order} />

          <ShipmentCard
            order={order}
            shipment={shipment}
            orderId={id || ''}
            onCancelShipment={() => setCancelConfirmOpen(true)}
            onGenerateLabel={() => generateLabelMutation.mutate()}
            onDownloadLabel={handleDownloadShippingLabel}
            onRefetchShipment={() => refetchShipment()}
            isCancelling={cancelShipmentMutation.isPending}
            isGeneratingLabel={generateLabelMutation.isPending}
            onEditAddress={() =>
              setEditAddress({ type: 'shipping', address: order.shipping_address })
            }
          />

          <AddressesCard
            shipping={order.shipping_address}
            billing={order.billing_address}
            onEditShipping={() =>
              setEditAddress({ type: 'shipping', address: order.shipping_address })
            }
            onEditBilling={() =>
              setEditAddress({ type: 'billing', address: order.billing_address })
            }
          />

          <PreorderCard order={order} />

          <OrderActivityTimeline order={order} timeline={orderResponse?.timeline} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <CustomerCard order={order} />
          <PaymentCard order={order} onRefund={() => setRefundOpen(true)} />
          <CodCard order={order} />
          <FinancialSummaryCard order={order} />
          <DeliveryCard order={order} />
          <PackagingCard order={order} />
          <ReferralCard order={order} />
          <OrderSourceCard order={order} />
          <RefundsCard refunds={order.refunds_list || []} />
          <NotesCard notes={order.notes} />
          <CommunicationPanel
            orderId={Number(id)}
            customerName={
              `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() ||
              order.user?.name ||
              'Customer'
            }
            customerEmail={order.user?.email || ''}
            customerPhone={getOrderPhone(order)}
            orderNumber={order.order_number}
            totalAmount={order.total_amount}
            trackingNumber={shipment?.tracking_number}
          />
          <InternalNotesSection orderId={Number(id)} />
        </aside>
      </div>

      {/* --------------------------- Modals/Drawers --------------------------- */}
      <StatusUpdateModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        order={order}
        initialStatus={order.status}
        onUpdateStatus={({ status, note, overrideWorkflow }) =>
          updateStatusMutation.mutate({ status, note, overrideWorkflow })
        }
        onManualShip={(params) => manualShipMutation.mutate(params)}
        isPending={updateStatusMutation.isPending || manualShipMutation.isPending}
      />

      <ConfirmModal
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => cancelShipmentMutation.mutate()}
        title="Cancel Shipment"
        message="Are you sure you want to cancel this shipment? This may incur cancellation charges from the carrier."
        confirmText="Cancel Shipment"
        variant="danger"
        loading={cancelShipmentMutation.isPending}
      />

      {editAddress && (
        <EditAddressModal
          orderId={Number(id)}
          addressType={editAddress.type}
          currentAddress={editAddress.address}
          onClose={() => setEditAddress(null)}
        />
      )}

      {refundOpen && canShowRefund && (
        <PartialRefundModal
          orderId={Number(id)}
          orderNumber={order.order_number}
          totalAmount={order.total_amount}
          orderItems={orderItems}
          onClose={() => setRefundOpen(false)}
        />
      )}

      <WhatsAppSendDrawer
        open={whatsAppOpen}
        onClose={() => setWhatsAppOpen(false)}
        order={order}
        onSend={handleSendWhatsApp}
        isSending={sendingWhatsApp}
      />

      <MobileActionBar
        order={order}
        shipment={shipment}
        orderId={id || ''}
        onPrint={handlePrintInvoice}
        onQuickStatusUpdate={(status) =>
          updateStatusMutation.mutate({ status, note: '', overrideWorkflow: false })
        }
        onOpenStatusModal={() => setStatusModalOpen(true)}
      />
    </div>
  );
};

export default OrderDetail;