import React, { useState } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import Button from './Button';
import Input from './Input';

interface RefundModalProps {
  order: {
    id: number;
    order_number: string;
    total: number;
    payment_method: string;
    payment_status: string;
  };
  onClose: () => void;
  onSubmit: (refundData: {
    amount: number;
    reason: string;
    notes?: string;
    refund_type: 'full' | 'partial';
  }) => Promise<void>;
}

export function RefundModal({ order, onClose, onSubmit }: RefundModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [refundData, setRefundData] = useState({
    refund_type: 'full' as 'full' | 'partial',
    amount: order.total,
    reason: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!refundData.reason) {
      newErrors.reason = 'Refund reason is required';
    }

    if (refundData.refund_type === 'partial') {
      if (!refundData.amount || refundData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (refundData.amount > order.total) {
        newErrors.amount = `Amount cannot exceed ${formatCurrency(order.total)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(refundData);
      onClose();
    } catch (error) {
      console.error('Refund failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const refundReasons = [
    'Customer Request',
    'Product Defect/Damage',
    'Wrong Product Shipped',
    'Product Not as Described',
    'Delivery Issues',
    'Order Cancellation',
    'Price Adjustment',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'form' ? 'Initiate Refund' : 'Confirm Refund'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">Order #{order.order_number}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Total Amount: {formatCurrency(order.total)} • Payment Method: {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundData({
                        ...refundData,
                        refund_type: 'full',
                        amount: order.total
                      });
                      setErrors({ ...errors, amount: '' });
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      refundData.refund_type === 'full'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Full Refund</p>
                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(order.total)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundData({
                        ...refundData,
                        refund_type: 'partial',
                        amount: 0
                      });
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      refundData.refund_type === 'partial'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Partial Refund</p>
                    <p className="text-sm text-gray-600 mt-1">Specify amount</p>
                  </button>
                </div>
              </div>

              {/* Refund Amount (for partial refund) */}
              {refundData.refund_type === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      value={refundData.amount || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 });
                        setErrors({ ...errors, amount: '' });
                      }}
                      placeholder="0.00"
                      className="pl-10"
                      min="0"
                      max={order.total}
                      step="0.01"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum refund amount: {formatCurrency(order.total)}
                  </p>
                </div>
              )}

              {/* Refund Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={refundData.reason}
                  onChange={(e) => {
                    setRefundData({ ...refundData, reason: e.target.value });
                    setErrors({ ...errors, reason: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  {refundReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (Optional)
                </label>
                <textarea
                  value={refundData.notes}
                  onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any internal notes about this refund..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  These notes are for internal use only and won't be visible to the customer
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confirmation Summary */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Please review carefully</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This action will initiate a refund. Make sure all details are correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-semibold">{order.order_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Refund Type</span>
                  <span className="font-semibold capitalize">{refundData.refund_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {formatCurrency(refundData.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Reason</span>
                  <span className="font-semibold">{refundData.reason}</span>
                </div>
                {refundData.notes && (
                  <div className="py-2 border-b">
                    <span className="text-gray-600 block mb-1">Notes</span>
                    <span className="text-sm text-gray-900">{refundData.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-3">
          {step === 'form' ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processing...' : 'Confirm Refund'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

