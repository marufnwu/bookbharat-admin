import React, { useState } from 'react';
import { Tag, X, Check, Search } from 'lucide-react';

interface CouponManagerProps {
  cartId: number;
  currentCoupon?: string | null;
  discountAmount?: number | null;
  isReadOnly?: boolean;
  onApply: (code: string) => Promise<boolean>;
  onRemove: () => Promise<void>;
}

export default function CouponManager({ 
  currentCoupon, 
  discountAmount, 
  isReadOnly,
  onApply,
  onRemove
}: CouponManagerProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!code.trim()) return;
      
      setApplying(true);
      setError(null);
      setSuccess(null);

      try {
          const applied = await onApply(code);
          if (applied) {
              setSuccess('Coupon applied successfully');
              setCode('');
          } else {
              setError('Invalid or expired coupon code');
          }
      } catch (err) {
          setError('Failed to apply coupon');
      } finally {
          setApplying(false);
      }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove this coupon?')) return;
    await onRemove();
    setSuccess(null);
    setError(null);
  }

  // If a coupon is active
  if (currentCoupon) {
      return (
          <div className="bg-gray-50 border border-green-200 rounded-md p-3">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                       <Tag className="h-4 w-4 text-green-600" />
                       <div>
                           <p className="text-sm font-medium text-gray-900">
                               Coupon <span className="font-bold text-green-700">{currentCoupon}</span> applied
                           </p>
                           {discountAmount && (
                               <p className="text-xs text-green-600">
                                   Saving ₹{discountAmount.toLocaleString()}
                               </p>
                           )}
                       </div>
                  </div>
                  {!isReadOnly && (
                        <button 
                            onClick={handleRemove}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove Coupon"
                        >
                            <X className="h-4 w-4" />
                        </button>
                  )}
              </div>
          </div>
      );
  }

  // Applying new coupon
  if (isReadOnly) return null;

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon Code"
            className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={applying || !code}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
        >
          {applying ? '...' : 'Apply'}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 pl-1">{error}</p>}
      {success && <p className="text-xs text-green-600 pl-1 flex items-center gap-1"><Check className="h-3 w-3" />{success}</p>}
    </div>
  );
}
