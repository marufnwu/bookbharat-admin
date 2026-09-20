import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components';
import { affiliatesApi } from '@/api/affiliates';
import type { AffiliateStatus, CommissionStatus, PayoutStatus } from '@/types/affiliate';
import type { MoneyMeta } from './moneyTruth';

// Single source: commission/hold labels from backend money-meta.
// Hook reads the cached meta (fetched once per session by moneyTruth).
function useMetaLabels(): MoneyMeta | undefined {
  const { data } = useQuery({
    queryKey: ['affiliate-money-meta'],
    queryFn: () => affiliatesApi.moneyMeta(),
    staleTime: 10 * 60_000,
  });
  return data as MoneyMeta | undefined;
}

function affiliateVariant(s: AffiliateStatus): 'success' | 'warning' | 'error' {
  switch (s) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'rejected':
    case 'suspended':
    case 'blocked': return 'error';
    default: return 'warning';
  }
}

function commissionVariant(s: CommissionStatus): 'success' | 'default' | 'warning' | 'error' {
  switch (s) {
    case 'approved': return 'success';
    case 'paid': return 'default';
    case 'pending':
    case 'on_hold': return 'warning';
    case 'reversed': return 'error';
    default: return 'default';
  }
}

function payoutVariant(s: PayoutStatus): 'success' | 'warning' | 'error' {
  switch (s) {
    case 'paid': return 'success';
    case 'requested':
    case 'under_review':
    case 'processing': return 'warning';
    case 'failed':
    case 'rejected':
    case 'cancelled': return 'error';
    default: return 'warning';
  }
}

export function AffiliateStatusBadge({ status }: { status: AffiliateStatus }) {
  return <Badge variant={affiliateVariant(status)} size="sm">{status}</Badge>;
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  const meta = useMetaLabels();
  const label = meta?.commission_status?.[status] ?? status.replace('_', ' ');
  return <Badge variant={commissionVariant(status)} size="sm">{label}</Badge>;
}

export function HoldReasonBadge({ reason }: { reason: string }) {
  const meta = useMetaLabels();
  const label = meta?.hold_reasons?.[reason] ?? reason.replace('_', ' ');
  const variant = reason === 'self_referral' ? 'error' : reason === 'refund_ratio' ? 'warning' : 'info';
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge variant={payoutVariant(status)} size="sm">{status.replace('_', ' ')}</Badge>;
}
