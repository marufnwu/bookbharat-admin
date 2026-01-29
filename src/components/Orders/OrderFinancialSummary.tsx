import React from 'react';
import { Receipt, Tag, TrendingDown, PackageCheck } from 'lucide-react';

interface FinancialSummaryProps {
  order: any;
  formatCurrency: (amount: number) => string;
}

const OrderFinancialSummary: React.FC<FinancialSummaryProps> = ({ order, formatCurrency }) => {
  // Calculate financial breakdown - MUST match backend calculation exactly
  const subtotal = parseFloat(String(order.subtotal || 0));
  const couponDiscount = parseFloat(String(order.coupon_discount || 0));
  const bundleDiscount = parseFloat(String(order.bundle_discount || 0));
  const totalDiscount = couponDiscount + bundleDiscount;
  
  // Discounted subtotal
  const discountedSubtotal = subtotal - totalDiscount;
  
  // Core components
  const shipping = parseFloat(String(order.shipping_amount || order.shipping_cost || 0));
  const tax = parseFloat(String(order.tax_amount || order.tax || 0));
  
  // Packaging - separate from charges
  const packagingAmount = parseFloat(String(order.packaging_amount || 0));
  
  // Additional charges (COD, etc.) - should NOT include packaging
  const charges = (order.charges || []).filter((c: any) => 
    c.code !== 'packaging_charge' // Packaging counted separately
  );
  const chargesTotal = charges.reduce((sum: number, c: any) => 
    sum + parseFloat(String(c.amount || 0)), 0
  );
  
  // Backend total (source of truth)
  const grandTotal = parseFloat(String(order.total_amount || order.total || 0));
  
  // Calculate what the total SHOULD be based on components
  const calculatedTotal = discountedSubtotal + shipping + packagingAmount + chargesTotal + tax;
  const calculationDiff = Math.abs(grandTotal - calculatedTotal);
  
  // Debug logging
  console.log('📊 Financial Summary Data:', {
    subtotal,
    couponDiscount,
    bundleDiscount,
    discountedSubtotal,
    shipping,
    packagingAmount,
    chargesTotal,
    tax,
    grandTotal,
    calculatedTotal,
    calculationDiff: calculationDiff.toFixed(2),
    matchesBackend: calculationDiff < 0.01,
    rawCharges: order.charges,
    filteredCharges: charges
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Financial Summary
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-3 text-sm">
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          {/* Coupon Discount */}
          {couponDiscount > 0 && (
            <div className="flex justify-between items-center text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Coupon Discount
                {order.coupon_code && (
                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full font-medium">
                    {order.coupon_code}
                  </span>
                )}
              </span>
              <span className="font-semibold">-{formatCurrency(couponDiscount)}</span>
            </div>
          )}

          {/* Bundle Discount */}
          {bundleDiscount > 0 && (
            <div className="flex justify-between items-center text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="h-3.5 w-3.5" />
                Bundle Discount
              </span>
              <span className="font-semibold">-{formatCurrency(bundleDiscount)}</span>
            </div>
          )}

          {/* Total Savings Display */}
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center font-semibold text-green-800 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2.5 rounded-lg border-2 border-green-300">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Total Savings
              </span>
              <span className="text-base">-{formatCurrency(totalDiscount)}</span>
            </div>
          )}

          {/* Discounted Subtotal (if discounts exist) */}
          {totalDiscount > 0 && (
            <>
              <div className="border-t border-dashed border-gray-300 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discounted Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal - totalDiscount)}</span>
              </div>
            </>
          )}

          {/* Shipping */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Shipping:</span>
            <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
              {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
            </span>
          </div>

          {/* Packaging - shown separately */}
          {packagingAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Packaging
                {order.packaging_details?.name && ` (${order.packaging_details.name})`}
              </span>
              <span className="font-medium">+{formatCurrency(packagingAmount)}</span>
            </div>
          )}

          {/* Additional Charges (COD, etc.) - Packaging excluded */}
          {charges && charges.length > 0 && (
            <>
              {charges.map((charge: any, index: number) => {
                const isCOD = charge.code?.toLowerCase().includes('cod') || 
                             charge.name?.toLowerCase().includes('cod');
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      {charge.display_label || charge.name}
                      {isCOD && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">COD</span>
                      )}
                    </span>
                    <span className={`font-medium ${isCOD ? 'text-orange-600' : ''}`}>
                      +{formatCurrency(charge.amount)}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* Total Charges Summary (if multiple non-packaging charges) */}
          {chargesTotal > 0 && charges.length > 1 && (
            <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              <span>Total Additional Charges:</span>
              <span>+{formatCurrency(chargesTotal)}</span>
            </div>
          )}

          {/* Tax Breakdown */}
          {order.taxes_breakdown && Array.isArray(order.taxes_breakdown) && order.taxes_breakdown.length > 0 ? (
            <>
              {order.taxes_breakdown.map((taxItem: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600 text-xs">
                    {taxItem.display_label || taxItem.name}
                    {taxItem.rate && <span className="ml-1 text-gray-400">({taxItem.rate})</span>}
                  </span>
                  <span className="font-medium text-xs">+{formatCurrency(taxItem.amount)}</span>
                </div>
              ))}
            </>
          ) : tax > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax (GST):</span>
              <span className="font-medium">+{formatCurrency(tax)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t-2 border-gray-300 my-2"></div>

          {/* Grand Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-gray-900">Grand Total:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Customer Savings Highlight */}
          {totalDiscount > 0 && (
            <div className="text-center text-sm bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 font-semibold p-3 rounded-lg mt-3">
              🎉 Customer saved {formatCurrency(totalDiscount)} on this order!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderFinancialSummary;
