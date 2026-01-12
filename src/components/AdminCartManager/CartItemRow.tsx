import React, { useState } from 'react';
import { Tag, Trash2, Edit2, Save, X } from 'lucide-react';
import { CartItem } from '../../pages/AbandonedCarts/types';

interface CartItemRowProps {
  item: CartItem;
  isReadOnly?: boolean;
  onUpdate: (itemId: number, updates: { quantity?: number; unit_price?: number }) => void;
  onRemove: (itemId: number) => void;
}

export default function CartItemRow({ item, isReadOnly, onUpdate, onRemove }: CartItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Resolve product details safely
  const product = item.product;
  const variant = item.variant;
  
  // Calculate effective price with fallback
  const effectivePrice = parseFloat(String(item.unit_price)) || product?.price || variant?.price || 0;

  const [quantity, setQuantity] = useState(item.quantity);
  const [price, setPrice] = useState(effectivePrice);
  const name = product?.name || 'Unknown Product';
  const sku = variant?.sku || product?.sku || 'N/A';
  const image = product?.image_url || '';
  
  const handleSave = () => {
      onUpdate(item.id, { quantity, unit_price: price });
      setIsEditing(false);
  };

  const handleCancel = () => {
      setQuantity(item.quantity);
      setPrice(parseFloat(String(item.unit_price)));
      setIsEditing(false);
  }

  // Calculate row total dynamically if editing, else use saved total
  const displayTotal = isEditing ? (quantity * price) : item.total || (quantity * price);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {image ? (
            <img src={image} alt={name} className="h-10 w-10 rounded object-cover border border-gray-200" />
          ) : (
            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
              <Tag className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">SKU: {sku}</p>
            {variant && (
              <p className="text-xs text-gray-400">
                {Object.values(variant.attribute_values || {}).join(' / ')}
              </p>
            )}
          </div>
        </div>
      </td>
      
      {/* Unit Price */}
      <td className="px-6 py-4 text-left text-sm text-gray-500">
          {isEditing ? (
             <div className="flex items-center gap-1">
                 <span>₹</span>
                 <input 
                   type="number"
                   min="0"
                   step="0.01"
                   value={price}
                   onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                   className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                 />
             </div>
          ) : (
            <span>₹{price.toLocaleString()}</span>
          )}
      </td>

      {/* Quantity */}
      <td className="px-6 py-4 text-center">
          {isEditing ? (
              <input 
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-indigo-500 focus:border-indigo-500 mx-auto"
            />
          ) : (
              <span className="text-sm text-gray-500">{item.quantity}</span>
          )}
      </td>

      {/* Total */}
      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
        ₹{displayTotal.toLocaleString()}
      </td>

      {/* Actions */}
      {!isReadOnly && (
          <td className="px-6 py-4 text-right text-sm font-medium">
             {isEditing ? (
                 <div className="flex justify-end gap-2">
                     <button onClick={handleSave} className="text-green-600 hover:text-green-900"><Save className="h-4 w-4" /></button>
                     <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
                 </div>
             ) : (
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => onRemove(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                </div>
             )}
          </td>
      )}
    </tr>
  );
}
