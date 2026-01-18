/**
 * Cart Table Component
 * Reusable table for displaying abandoned carts with actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Eye,
  Gift,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { Cart } from '../types';
import { SEGMENT_COLORS, STATUS_COLORS } from '../types';

interface CartTableProps {
  carts: Cart[];
  selectedCarts: number[];
  onSelectCart: (cartId: number, selected: boolean) => void;
  onSelectAll: () => void;
  selectAll: boolean;
  onSendRecovery: (cart: Cart) => void;
  onGenerateDiscount: (cart: Cart) => void;
  onMarkRecovered: (cart: Cart) => void;
  isLoading?: boolean;
}

const CartTable: React.FC<CartTableProps> = ({
  carts,
  selectedCarts,
  onSelectCart,
  onSelectAll,
  selectAll,
  onSendRecovery,
  onGenerateDiscount,
  onMarkRecovered,
  isLoading,
}) => {
  const navigate = useNavigate();

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-600';
    if (prob >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-4 border-b">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No abandoned carts found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cart Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Segment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Recovery %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Abandoned
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {carts.map((cart) => (
              <tr
                key={cart.id}
                className={`hover:bg-gray-50 ${
                  selectedCarts.includes(cart.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCarts.includes(cart.id)}
                    onChange={(e) => onSelectCart(cart.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(cart.device_type)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {cart.user?.name || cart.user?.email || 'Guest'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {cart.user?.email || `Session: ${cart.session_id?.substring(0, 8)}...`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-gray-900">
                    ₹{cart.total?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{cart.total_items} items</p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[cart.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cart.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      SEGMENT_COLORS[cart.customer_segment] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cart.customer_segment}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-4 w-4 ${getProbabilityColor(cart.recovery_probability)}`} />
                    <span className={`font-medium ${getProbabilityColor(cart.recovery_probability)}`}>
                      {cart.recovery_probability}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatTimeAgo(cart.abandoned_at)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/abandoned-carts/${cart.id}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onSendRecovery(cart)}
                      className="p-2 hover:bg-blue-100 rounded-lg"
                      title="Send Recovery"
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => onGenerateDiscount(cart)}
                      className="p-2 hover:bg-purple-100 rounded-lg"
                      title="Generate Discount"
                    >
                      <Gift className="h-4 w-4 text-purple-600" />
                    </button>
                    {cart.status !== 'recovered' && (
                      <button
                        onClick={() => onMarkRecovered(cart)}
                        className="p-2 hover:bg-green-100 rounded-lg"
                        title="Mark Recovered"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;
