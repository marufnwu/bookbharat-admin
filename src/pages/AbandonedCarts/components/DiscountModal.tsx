/**
 * Discount Modal Component
 * Modal for generating recovery discount codes
 */

import React, { useState } from 'react';
import { X, Gift, Calendar, DollarSign, Percent } from 'lucide-react';
import type { GenerateDiscountForm, Cart } from '../types';

interface DiscountModalProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateDiscountForm) => void;
  isPending: boolean;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  cart,
  isOpen,
  onClose,
  onGenerate,
  isPending,
}) => {
  const [formData, setFormData] = useState<GenerateDiscountForm>({
    discount_type: 'percentage',
    discount_value: '10',
    valid_days: '7',
    min_purchase_amount: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Generate Discount
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={formData.discount_type === 'percentage'}
                  onChange={() => setFormData({ ...formData, discount_type: 'percentage' })}
                  className="text-blue-600"
                />
                <span>Percentage (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={formData.discount_type === 'fixed'}
                  onChange={() => setFormData({ ...formData, discount_type: 'fixed' })}
                  className="text-blue-600"
                />
                <span>Fixed Amount (₹)</span>
              </label>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.discount_type === 'percentage' ? 'Percentage Value' : 'Amount Value'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.discount_type === 'percentage' ? (
                  <Percent className="h-4 w-4 text-gray-400" />
                ) : (
                  <DollarSign className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="number"
                required
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value"
              />
            </div>
          </div>

          {/* Validity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid For (Days)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={formData.valid_days}
                onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Min Purchase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Purchase Amount (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                value={formData.min_purchase_amount}
                onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="No minimum"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Gift className="h-4 w-4" />
              {isPending ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountModal;
