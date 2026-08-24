import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ChevronRight,
  CreditCard,
  Truck,
  Package,
  RefreshCw,
  FileText,
  Info,
  Tag,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  Button,
  StatusBadge,
  Badge,
  Banner,
  CourierLogoList,
  CopyButton,
} from '../../../components';
import {
  formatCurrency,
  formatDate,
  sanitizeCookieValue,
  getCustomerTotalOrders,
  getDeliveryOptionName,
} from '../../../features/orders';
import OrderFinancialSummary from '../../../components/Orders/OrderFinancialSummary';

/**
 * Reusable section header for sidebar cards — icon in soft-tinted circle
 * + title + optional right slot. Keeps the visual rhythm consistent.
 */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  right?: React.ReactNode;
}> = ({ icon, iconBg, title, right }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </span>
      {title}
    </h3>
    {right}
  </div>
);

/* ----------------------------- Customer Card ----------------------------- */
interface CustomerCardProps {
  order: any;
}
export const CustomerCard: React.FC<CustomerCardProps> = ({ order }) => {
  const navigate = useNavigate();
  const user = order.user || {};
  const customerId = order.user_id || order.customer_id;
  const fullName = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.name;

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<User className="h-4 w-4 text-primary-700" />}
          iconBg="bg-primary-50"
          title="Customer"
        />
        <div className="space-y-3">
          {fullName && (
            <DetailRow
              label="Name"
              value={<span className="font-semibold text-gray-900">{fullName}</span>}
              copyValue={fullName}
              copyLabel="Customer name"
            />
          )}
          {user.email && (
            <DetailRow
              label="Email"
              value={
                <a
                  href={`mailto:${user.email}`}
                  className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 truncate"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </a>
              }
              copyValue={user.email}
              copyLabel="Customer email"
            />
          )}
          <DetailRow
            label="Phone"
            value={
              user.phone ? (
                <a
                  href={`tel:${user.phone}`}
                  className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </a>
              ) : (
                <span className="text-gray-400">Not provided</span>
              )
            }
            copyValue={user.phone}
            copyLabel="Phone number"
          />
          {user.id && (
            <DetailRow
              label="Customer ID"
              value={<span className="font-mono text-sm">#{user.id}</span>}
              copyValue={String(user.id)}
              copyLabel="Customer ID"
            />
          )}
          <DetailRow
            label="Total Orders"
            value={<span className="font-semibold">{getCustomerTotalOrders(order)}</span>}
          />
        </div>
      </CardContent>
      <CardFooter align="between" bordered className="bg-gray-50/50">
        <span className="text-xs text-gray-500">Profile</span>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${customerId}`)}>
          View Customer <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

/* ------------------------------ Payment Card ----------------------------- */
interface PaymentCardProps {
  order: any;
  onRefund: () => void;
}
export const PaymentCard: React.FC<PaymentCardProps> = ({ order, onRefund }) => {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<CreditCard className="h-4 w-4 text-success-700" />}
          iconBg="bg-success-50"
          title="Payment"
        />
        <div className="space-y-3">
          <DetailRow
            label="Method"
            value={<span className="font-medium capitalize">{order.payment_method || 'N/A'}</span>}
          />
          <DetailRow
            label="Status"
            value={
              <StatusBadge
                status={
                  order.payment_status === 'paid'
                    ? 'success'
                    : order.payment_status === 'pending'
                      ? 'warning'
                      : 'error'
                }
              >
                {order.payment_status || 'Pending'}
              </StatusBadge>
            }
          />
          {order.payment_transaction_id && (
            <DetailRow
              label="Transaction ID"
              value={
                <span className="font-mono text-xs break-all">
                  {order.payment_transaction_id}
                </span>
              }
              copyValue={order.payment_transaction_id}
              copyLabel="Transaction ID"
            />
          )}
          {order.status === 'delivered' && order.payment_status === 'paid' && (
            <Button
              variant="outline"
              fullWidth
              className="text-error-700 border-error-200 hover:bg-error-50 mt-2"
              onClick={onRefund}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Process Refund
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------------------ COD Card --------------------------------- */
interface CodCardProps {
  order: any;
}
export const CodCard: React.FC<CodCardProps> = ({ order }) => {
  if (!order.is_cod) return null;
  return (
    <Card className="animate-fade-in border-warning-200 bg-warning-50/30">
      <CardContent className="p-5">
        <SectionHeader
          icon={<CreditCard className="h-4 w-4 text-warning-700" />}
          iconBg="bg-warning-100"
          title="COD Details"
        />
        <Banner
          tone="warning"
          title={order.is_cod_advance ? 'COD with Advance' : 'Full COD'}
          className="mb-4"
        />
        <div className="space-y-2">
          {order.is_cod_advance && order.advance_amount && (
            <DetailRow
              label="Advance Paid"
              value={<span className="text-success-700 font-semibold">{formatCurrency(order.advance_amount)}</span>}
            />
          )}
          {order.is_cod_advance && order.balance_amount && (
            <DetailRow
              label="Balance (COD)"
              value={<span className="text-warning-700 font-semibold">{formatCurrency(order.balance_amount)}</span>}
            />
          )}
          {!order.is_cod_advance && (
            <DetailRow
              label="Amount to Collect"
              value={<span className="text-warning-700 font-semibold">{formatCurrency(order.total_amount)}</span>}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ----------------------------- Delivery Card ----------------------------- */
interface DeliveryCardProps {
  order: any;
}
export const DeliveryCard: React.FC<DeliveryCardProps> = ({ order }) => {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<Truck className="h-4 w-4 text-primary-700" />}
          iconBg="bg-primary-50"
          title="Delivery"
        />
        <div className="space-y-3">
          {getDeliveryOptionName(order) && (
            <DetailRow
              label="Option"
              value={<span className="font-medium">{getDeliveryOptionName(order)}</span>}
            >
              {order.delivery_option?.description && (
                <div className="text-xs text-gray-500 mt-0.5">{order.delivery_option.description}</div>
              )}
              {order.shipping_breakdown?.zone_name && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Zone: <span className="font-mono">{order.shipping_breakdown.zone_name}</span>
                </div>
              )}
            </DetailRow>
          )}
          {order.pickup_pincode && (
            <DetailRow label="Pickup" value={<span className="font-mono">{order.pickup_pincode}</span>} />
          )}
          {order.delivery_pincode && (
            <DetailRow label="Delivery" value={<span className="font-mono">{order.delivery_pincode}</span>} />
          )}
          {order.estimated_delivery_date && (
            <DetailRow
              label="ETA"
              value={
                <span className="text-primary-700 font-semibold">
                  {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              }
            />
          )}
          {order.shipping_zone && (
            <DetailRow label="Zone" value={<Badge variant="outline">{order.shipping_zone}</Badge>} />
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <CourierLogoList order={order} />
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------------- Packaging & Insurance ------------------------- */
interface PackagingCardProps {
  order: any;
}
export const PackagingCard: React.FC<PackagingCardProps> = ({ order }) => {
  if (!order.packaging_option && !(order.packaging_amount > 0) && !(order.insurance_amount > 0))
    return null;
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<Package className="h-4 w-4 text-primary-700" />}
          iconBg="bg-primary-50"
          title="Packaging & Insurance"
        />
        <div className="space-y-3">
          {order.packaging_option && (
            <DetailRow label="Packaging" value={<span className="font-medium">{order.packaging_option.name}</span>}>
              {order.packaging_option.description && (
                <div className="text-xs text-gray-500 mt-0.5">{order.packaging_option.description}</div>
              )}
            </DetailRow>
          )}
          {order.packaging_amount > 0 && (
            <DetailRow label="Cost" value={<span className="font-medium">{formatCurrency(order.packaging_amount)}</span>} />
          )}
          {order.insurance_amount > 0 && (
            <DetailRow label="Insurance" value={<span className="font-medium">{formatCurrency(order.insurance_amount)}</span>} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------------------ Referral Card --------------------------- */
interface ReferralCardProps {
  order: any;
}
export const ReferralCard: React.FC<ReferralCardProps> = ({ order }) => {
  // Legacy coupon-referral payload — absent on new affiliate-attributed
  // orders, so every access below must be guarded.
  const ref = order.referral_details ?? null;
  const hasNew = !!order.affiliate_id;
  if (!ref && !hasNew) return null;
  return (
    <Card className="animate-fade-in border-purple-200 bg-purple-50/40">
      <CardContent className="p-5">
        <SectionHeader
          icon={<Tag className="h-4 w-4 text-purple-700" />}
          iconBg="bg-purple-100"
          title="Referral"
        />
        {ref && (
          <div className="rounded-lg border border-purple-200 bg-white p-3 flex items-center justify-between mb-3 gap-2">
            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Code</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono font-bold text-purple-900">{ref.code}</span>
              <CopyButton
                value={ref.code}
                label="Referral code"
                successMessage="Referral code copied"
                size="xs"
                ariaLabel="Copy referral code"
              />
            </span>
          </div>
        )}
        {ref && ref.discount_amount > 0 && (
          <DetailRow
            label="Discount"
            value={<span className="font-semibold text-success-700">-{formatCurrency(ref.discount_amount)}</span>}
          />
        )}
        {ref && ref.discount_type && (
          <DetailRow label="Type" value={<span className="text-gray-600">{ref.discount_type}</span>} />
        )}
        {hasNew && (
          <div className="mt-3 pt-3 border-t border-purple-200 text-sm">
            <div className="text-xs text-purple-700 mb-1 font-medium uppercase tracking-wide">Affiliate</div>
            <DetailRow
              label="Affiliate"
              value={
                <Link
                  to={`/affiliates/${order.affiliate_id}`}
                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  title="Open affiliate profile"
                >
                  {order.affiliate_name || `#${order.affiliate_id}`}
                </Link>
              }
            />
            <DetailRow label="Source" value={<span className="capitalize">{order.attribution_source || '—'}</span>} />
            <DetailRow label="Ref code" value={<span className="font-mono text-xs">{order.attribution_ref_code || '—'}</span>} />
            {!!order.is_self_referral_blocked && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                ⚠ Self-referral blocked — commission withheld
              </div>
            )}
            {(() => {
              const gate = (order as any)?.metadata?.commission_gate;
              if (!gate) return null;
              const labels: Record<string, string> = {
                below_min_order: 'Below min order amount',
                not_first_order: 'Not buyer\'s first order',
                per_customer_limit: 'Per-customer limit reached',
                total_limit: 'Affiliate total cap reached',
              };
              return (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Commission gated: {labels[gate] ?? gate}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ---------------------------- Order Source Card -------------------------- */
function getSourceLabel(order: any) {
  if (order.recovered_from) return 'Recovery';
  if (order.order_source === 'utm') return 'UTM';
  if (order.order_source === 'organic') return 'Organic';
  if (order.order_source === 'referral') return 'Referral';
  return 'Direct';
}
function getSourceBadge(order: any): 'success' | 'info' | 'warning' | 'default' {
  if (order.recovered_from) return 'success';
  if (order.order_source === 'utm') return 'info';
  if (order.order_source === 'organic') return 'success';
  if (order.order_source === 'referral') return 'warning';
  return 'default';
}

interface OrderSourceCardProps {
  order: any;
}
export const OrderSourceCard: React.FC<OrderSourceCardProps> = ({ order }) => {
  // Sanitise backend values that may contain Laravel cookie-deletion
  // strings like "utm_source=deleted; expires=...; Max-Age=0; ...".
  const utm = {
    source: sanitizeCookieValue(order.utm_source),
    medium: sanitizeCookieValue(order.utm_medium),
    campaign: sanitizeCookieValue(order.utm_campaign),
    content: sanitizeCookieValue(order.utm_content),
    term: sanitizeCookieValue(order.utm_term),
  };
  const gclid = sanitizeCookieValue(order.gclid);
  const fbclid = sanitizeCookieValue(order.fbclid);

  const hasAnyUtm = Object.values(utm).some(Boolean);
  const hasAnyAd = gclid || fbclid;

  // Hide the entire card if every meaningful signal is missing.
  if (
    !order.order_source &&
    !order.recovered_from &&
    !hasAnyUtm &&
    !hasAnyAd
  ) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-primary-200 bg-primary-50/40">
      <CardContent className="p-5">
        <SectionHeader
          icon={<Globe className="h-4 w-4 text-primary-700" />}
          iconBg="bg-primary-100"
          title="Order Source"
        />
        <DetailRow
          label="Source"
          value={<Badge variant={getSourceBadge(order)}>{getSourceLabel(order)}</Badge>}
        />

        {hasAnyUtm && (
          <div className="mt-3 pt-3 border-t border-primary-100 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              UTM Attribution
            </div>
            {utm.source && (
              <DetailRow
                label="Source"
                value={utm.source}
                compact
                copyValue={utm.source}
                copyLabel="UTM source"
              />
            )}
            {utm.medium && (
              <DetailRow
                label="Medium"
                value={utm.medium}
                compact
                copyValue={utm.medium}
                copyLabel="UTM medium"
              />
            )}
            {utm.campaign && (
              <DetailRow
                label="Campaign"
                value={utm.campaign}
                compact
                copyValue={utm.campaign}
                copyLabel="UTM campaign"
              />
            )}
            {utm.content && (
              <DetailRow
                label="Content"
                value={utm.content}
                compact
                copyValue={utm.content}
                copyLabel="UTM content"
              />
            )}
            {utm.term && (
              <DetailRow
                label="Term"
                value={utm.term}
                compact
                copyValue={utm.term}
                copyLabel="UTM term"
              />
            )}
          </div>
        )}

        {order.recovered_from && (
          <div className="mt-3 pt-3 border-t border-primary-100 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-2">
              Recovery Attribution
            </div>
            <DetailRow
              label="From"
              value={
                order.recovered_from.includes('whatsapp')
                  ? 'WhatsApp'
                  : order.recovered_from.includes('email')
                    ? 'Email'
                    : 'Campaign'
              }
              compact
            />
            {order.recovered_at && (
              <DetailRow label="At" value={formatDate(order.recovered_at)} compact />
            )}
          </div>
        )}

        {hasAnyAd && (
          <div className="mt-3 pt-3 border-t border-primary-100 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-2">
              Ad Tracking
            </div>
            {gclid && (
              <div className="text-xs text-gray-600 font-mono break-all inline-flex items-center gap-1.5">
                <span>
                  <span className="text-gray-400">GCLID:</span> {gclid}
                </span>
                <CopyButton
                  value={gclid}
                  label="GCLID"
                  successMessage="GCLID copied"
                  size="xs"
                  ariaLabel="Copy GCLID"
                />
              </div>
            )}
            {fbclid && (
              <div className="text-xs text-gray-600 font-mono break-all inline-flex items-center gap-1.5">
                <span>
                  <span className="text-gray-400">FBCLID:</span> {fbclid}
                </span>
                <CopyButton
                  value={fbclid}
                  label="FBCLID"
                  successMessage="FBCLID copied"
                  size="xs"
                  ariaLabel="Copy FBCLID"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ----------------------------- Refunds Card ------------------------------ */
interface RefundsCardProps {
  refunds: any[];
}
export const RefundsCard: React.FC<RefundsCardProps> = ({ refunds }) => {
  if (!refunds?.length) return null;
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<RefreshCw className="h-4 w-4 text-error-700" />}
          iconBg="bg-error-50"
          title={`Refunds (${refunds.length})`}
        />
        <div className="space-y-3">
          {refunds.map((refund, idx) => (
            <div key={refund.id || idx} className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                  <span>Refund #{refund.id}</span>
                  <CopyButton
                    value={String(refund.id)}
                    label="Refund ID"
                    successMessage="Refund ID copied"
                    size="xs"
                    ariaLabel="Copy refund ID"
                  />
                </span>
                <StatusBadge
                  status={
                    refund.status === 'completed'
                      ? 'success'
                      : refund.status === 'pending'
                        ? 'warning'
                        : 'error'
                  }
                >
                  {refund.status}
                </StatusBadge>
              </div>
              <DetailRow
                label="Amount"
                value={<span className="font-semibold text-error-700">{formatCurrency(refund.amount)}</span>}
                copyValue={formatCurrency(refund.amount)}
                copyLabel="Refund amount"
              />
              {refund.reason && (
                <p className="text-xs text-gray-500 mt-2 italic">"{refund.reason}"</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{formatDate(refund.created_at)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/* ----------------------------- Order Notes ------------------------------- */
interface NotesCardProps {
  notes?: string | null;
}
export const NotesCard: React.FC<NotesCardProps> = ({ notes }) => {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <SectionHeader
          icon={<FileText className="h-4 w-4 text-gray-700" />}
          iconBg="bg-gray-100"
          title="Order Notes"
          right={
            notes ? (
              <CopyButton
                value={notes}
                label="Notes"
                successMessage="Notes copied"
                size="xs"
                ariaLabel="Copy order notes"
              />
            ) : undefined
          }
        />
        {notes ? (
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{notes}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No notes added</p>
        )}
      </CardContent>
    </Card>
  );
};

/* -------------------------- Detail Row helper --------------------------- */
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  /** Compact = smaller text (used inside sub-sections) */
  compact?: boolean;
  /** When provided, render a small copy button next to the value. */
  copyValue?: string | null;
  /** Optional label override for the copy button (e.g. "Customer email"). */
  copyLabel?: string;
  children?: React.ReactNode;
}
export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  compact,
  copyValue,
  copyLabel,
  children,
}) => {
  return (
    <div className={compact ? '' : 'flex items-start justify-between gap-3'}>
      <span
        className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'} ${compact ? 'inline-block min-w-[80px]' : 'flex-shrink-0'}`}
      >
        {label}
      </span>
      <div className={`${compact ? '' : 'text-right'} min-w-0 text-sm flex-1`}>
        <div
          className={`text-gray-900 ${copyValue ? 'inline-flex items-center gap-1.5 flex-wrap justify-end' : ''}`}
        >
          {value}
          {copyValue && (
            <CopyButton
              value={copyValue}
              label={copyLabel ?? label}
              successMessage={`${copyLabel ?? label} copied`}
              size="xs"
              ariaLabel={`Copy ${copyLabel ?? label}`}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

/**
 * Sidebar aggregator.
 */
export const OrderSidebar: React.FC<{ order: any; onRefund?: () => void }> = ({
  order,
  onRefund,
}) => (
  <>
    <CustomerCard order={order} />
    <PaymentCard order={order} onRefund={onRefund ?? (() => undefined)} />
    <CodCard order={order} />
    <DeliveryCard order={order} />
    <PackagingCard order={order} />
    <ReferralCard order={order} />
    <OrderSourceCard order={order} />
    <RefundsCard refunds={order.refunds_list || []} />
    <NotesCard notes={order.notes} />
  </>
);

/**
 * FinancialSummaryCard — wraps the existing OrderFinancialSummary
 * component and injects the centralised formatter.
 */
export const FinancialSummaryCard: React.FC<{ order: any }> = ({ order }) => (
  <OrderFinancialSummary order={order} formatCurrency={formatCurrency} />
);

export default OrderSidebar;