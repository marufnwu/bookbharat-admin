import { Badge } from '@/components';
import type { AffiliateStatus, CommissionStatus, PayoutStatus } from '@/types/affiliate';

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
  return <Badge variant={commissionVariant(status)} size="sm">{status.replace('_', ' ')}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge variant={payoutVariant(status)} size="sm">{status.replace('_', ' ')}</Badge>;
}
