import React from 'react';
import { Package, Tag, Ruler } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '../../../components';
import {
  formatCurrency,
  getBundleDetails,
  getItemLineTotal,
  getOrderItems,
  isBundleItem,
} from '../../../features/orders';
import { formatWeight } from '../../../utils/weight';

interface Props {
  order: any;
}

/**
 * Order line items. Renders a card with a header summary, then a list
 * of items each with image, title, metadata, qty × price, and total.
 * Bundle items get a softer blue tint and an inline savings row.
 */
export const OrderItemsCard: React.FC<Props> = ({ order }) => {
  const items = getOrderItems(order);
  const totalWeight = (items as any[]).reduce(
    (sum, item) => sum + (item?.product?.weight || 0) * (item?.quantity || 0),
    0,
  );

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package className="h-4 w-4" />
            </span>
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No items in this order.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package className="h-4 w-4" />
            </span>
            Order Items
            <span className="ml-1 text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          </h2>
          {totalWeight > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
              <Ruler className="h-3 w-3" />
              Total Weight: <span className="font-medium text-gray-700">{formatWeight(totalWeight)}</span>
            </span>
          )}
        </div>
      </div>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100">
          {items.map((item: any) => {
            const isBundle = isBundleItem(item);
            const bundle = getBundleDetails(item);
            return (
              <li
                key={item.id}
                className={`px-6 py-4 transition-colors hover:bg-gray-50/60 ${
                  isBundle ? 'bg-primary-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product?.name || 'Product'}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover bg-gray-100 border border-gray-200"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Middle: title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.product_name || item.product?.name || 'Product'}
                      </h3>
                      {isBundle && (
                        <Badge variant="info" size="sm">
                          Bundle
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-400">SKU:</span>
                        <span className="font-mono">
                          {item.product_sku || item.product?.sku || 'N/A'}
                        </span>
                      </span>
                      {item.product?.isbn && (
                        <span>
                          <span className="text-gray-400">ISBN:</span>{' '}
                          <span className="font-mono">{item.product.isbn}</span>
                        </span>
                      )}
                      {item.product?.weight && (
                        <span>
                          <span className="text-gray-400">Weight:</span>{' '}
                          <span className="font-mono">{formatWeight(item.product.weight)}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 text-sm text-gray-600">
                      <span className="text-gray-400">Qty</span>{' '}
                      <span className="font-medium text-gray-900">{item.quantity}</span>{' '}
                      <span className="text-gray-400">×</span>{' '}
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </span>
                    </div>

                    {bundle && bundle.discount_amount != null && bundle.discount_amount > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success-700 bg-success-50 border border-success-100 px-2 py-0.5 rounded-md">
                        <Tag className="h-3 w-3" />
                        Bundle savings: -{formatCurrency(bundle.discount_amount)}
                      </div>
                    )}
                  </div>

                  {/* Right: total */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-base font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(getItemLineTotal(item))}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Total</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default OrderItemsCard;