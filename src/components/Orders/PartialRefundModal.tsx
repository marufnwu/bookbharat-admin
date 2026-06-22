import React, { useState } from 'react';
import { X, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { orderEnhancementsApi } from '../../api/orderEnhancements';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PartialRefundModalProps {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  orderItems: OrderItem[];
  onClose: () => void;
}

const PartialRefundModal: React.FC<PartialRefundModalProps> = ({
  orderId,
  orderNumber,
  totalAmount,
  orderItems,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [refundType, setRefundType] = useState<'full' | 'partial'>('partial');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});

  const calculateSelectedTotal = () => {
    return Object.entries(selectedItems).reduce((sum, [itemId, refundAmt]) => {
      return sum + refundAmt;
    }, 0);
  };

  const handleItemRefundChange = (itemId: number, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: numAmount,
    }));
  };

  const refundMutation = useMutation({
    mutationFn: () => {
      const refundData = {
        amount: refundType === 'partial' ? (refundAmount || calculateSelectedTotal()) : totalAmount,
        reason,
        items: Object.entries(selectedItems).map(([id, amount]) => ({
          order_item_id: parseInt(id),
          refund_amount: amount,
        })),
      };
      return orderEnhancementsApi.partialRefund(orderId, refundData);
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    const finalAmount = refundType === 'partial' ? (refundAmount || calculateSelectedTotal()) : totalAmount;

    if (finalAmount <= 0) {
      toast.error('Refund amount must be greater than 0');
      return;
    }

    if (finalAmount > totalAmount) {
      toast.error('Refund amount cannot exceed order total');
      return;
    }

    refundMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Refund - Order #{orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Refund Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={() => setRefundType('partial')}
                  className="mr-2"
                />
                <span>Partial Refund</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={() => setRefundType('full')}
                  className="mr-2"
                />
                <span>Full Refund (₹{totalAmount.toFixed(2)})</span>
              </label>
            </div>
          </div>

          {/* Partial Refund Options */}
          {refundType === 'partial' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                Select items and amounts to refund:
              </h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)} = ₹{item.total_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        max={item.total_price}
                        step="0.01"
                        placeholder="₹0.00"
                        value={selectedItems[item.id] || ''}
                        onChange={(e) => handleItemRefundChange(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-blue-200 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">Selected Items Total:</span>
                <span className="text-lg font-bold text-blue-900">₹{calculateSelectedTotal().toFixed(2)}</span>
              </div>

              <p className="text-xs text-blue-700 mt-2">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Or enter a custom amount below:
              </p>
            </div>
          )}

          {/* Custom Refund Amount */}
          {refundType === 'partial' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Refund Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  min="0.01"
                  max={totalAmount}
                  step="0.01"
                  value={refundAmount || ''}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use selected items total. Max: ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Enter the reason for this refund..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Refund Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-red-600 pt-2 border-t">
                <span>Refund Amount:</span>
                <span>
                  ₹{(refundType === 'full' ? totalAmount : (refundAmount || calculateSelectedTotal())).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Warning</p>
              <p>This action will process a refund. Please ensure all details are correct before proceeding.</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Refund'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartialRefundModal;
