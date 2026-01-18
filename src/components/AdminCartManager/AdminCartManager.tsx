import React, { useState } from 'react';
import { ShoppingCart, Plus, Tag, RefreshCw } from 'lucide-react';
import { Cart } from '../../pages/AbandonedCarts/types'; // Assuming shared types
import { adminApi } from '../../pages/AbandonedCarts/api'; // Or a new dedicated API file
import CartItemRow from './CartItemRow';
import CouponManager from './CouponManager';
import ProductSearchModal from './ProductSearchModal';

interface AdminCartManagerProps {
  cartId: number;
  initialCartData?: Cart;
  isReadOnly?: boolean;
  onUpdate?: () => void;
  fetchCartDetails?: (id: number) => Promise<{ success: boolean; data: Cart }>;
}

export default function AdminCartManager({ 
  cartId, 
  initialCartData, 
  isReadOnly = false,
  onUpdate,
  fetchCartDetails
}: AdminCartManagerProps) {
  const [cart, setCart] = useState<Cart | undefined>(initialCartData);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch cart data if not provided or to refresh
  const fetchCart = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetcher = fetchCartDetails || adminApi.getCartDetails;
      const response = await fetcher(cartId);
      if (response && response.success) { // Added check for response existence
        setCart(response.data);
      } else {
        console.error('Fetch failed or invalid response:', response);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [cartId, fetchCartDetails]); // Added dependencies

  React.useEffect(() => {
    if (cartId) {
        fetchCart();
    }
  }, [cartId, fetchCart]);

  // Handlers for child components
  const handleItemUpdate = async (itemId: number, updates: { quantity?: number; unit_price?: number }) => {
    try {
      const response = await adminApi.updateCartItem(cartId, itemId, updates);
      if (response.success) {
        setCart(response.data); // Optimistically fetch or use returned data
        onUpdate?.();
      }
    } catch (error) {
        console.error('Error updating item:', error);
    }
  };

  const handleItemRemove = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
        const response = await adminApi.removeCartItem(cartId, itemId);
        if (response.success) {
            setCart(response.data);
            onUpdate?.();
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
  };
  
  const handleAddItem = async (productId: number, variantId?: number, quantity: number = 1, unitPrice?: number) => {
      try {
          const response = await adminApi.addCartItem(cartId, { product_id: productId, variant_id: variantId, quantity, unit_price: unitPrice });
          if(response.success) {
              setCart(response.data);
              setIsSearchOpen(false);
              onUpdate?.();
          }
      } catch (error) {
          console.error('Error adding item:', error);
      }
  };

  const handleApplyCoupon = async (code: string) => {
      try {
          const response = await adminApi.applyCoupon(cartId, code);
          if (response.success) {
              setCart(response.data);
              onUpdate?.();
              return true;
          }
      } catch (error) {
          console.error('Error applying coupon:', error);
      }
      return false;
  };

  const handleRemoveCoupon = async () => {
      try {
          const response = await adminApi.removeCoupon(cartId);
          if (response.success) {
              setCart(response.data);
              onUpdate?.();
          }
      } catch (error) {
          console.error('Error removing coupon:', error);
      }
  }

  if (!cart) return <div className="p-4 text-center">Loading cart data...</div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gray-500" />
          Cart Items ({cart.total_items})
        </h3>
        <div className="flex gap-2">
           {!isReadOnly && (
               <>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
               </>
           )}
           <button 
             onClick={fetchCart}
             className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
             title="Refresh Cart"
           >
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Unit)</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              {!isReadOnly && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cart.items?.map((item) => (
              <CartItemRow 
                key={item.id} 
                item={item} 
                isReadOnly={isReadOnly}
                onUpdate={handleItemUpdate}
                onRemove={handleItemRemove}
              />
            ))}
            {(!cart.items || cart.items.length === 0) && (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                  Cart is empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          {/* Left: Coupon & Notes */}
          <div className="w-full md:w-1/2 space-y-4">
             <CouponManager 
               cartId={cartId}
               currentCoupon={cart.coupon_code} // Assuming cart has coupon_code field
               discountAmount={cart.discount_amount} // Assuming cart has discount_amount
               isReadOnly={isReadOnly}
               onApply={handleApplyCoupon}
               onRemove={handleRemoveCoupon}
             />
          </div>

          {/* Right: Totals */}
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{parseFloat(String(cart.subtotal || 0)).toLocaleString()}</span>
            </div>
            
            {(cart.discount_amount && cart.discount_amount > 0) ? (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</span>
                <span>-₹{parseFloat(String(cart.discount_amount)).toLocaleString()}</span>
                </div>
            ) : null}

            {/* Tax if applicable */}
            {/* <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span>
              <span>₹{cart.tax_total}</span>
            </div> */}

            <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>₹{parseFloat(String(cart.total || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

       {/* Modals */}
       {isSearchOpen && (
           <ProductSearchModal 
             isOpen={isSearchOpen} 
             onClose={() => setIsSearchOpen(false)}
             onAdd={handleAddItem}
           />
       )}
    </div>
  );
}
