import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Modal, Badge } from '@/components';
import { CommissionStatusBadge } from './StatBadge';

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

interface Props {
  open: boolean;
  commissionId: number;
  onClose: () => void;
}

export function CommissionDetailModal({ open, commissionId, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['commission-detail', commissionId],
    queryFn: () => affiliatesApi.getCommission(commissionId),
    enabled: open && !!commissionId,
  });

  const c = data?.commission;

  return (
    <Modal open={open} onClose={onClose} title={`Commission #${commissionId}`} size="lg">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : !c ? (
        <p className="text-sm text-gray-500">Commission not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <CommissionStatusBadge status={c.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-sm font-semibold text-gray-900">{fmt(c.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rate</p>
              <p className="text-sm text-gray-900">{c.rate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order #</p>
              <p className="text-sm font-mono text-gray-900">{c.order_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Affiliate:</span> <span className="font-medium text-gray-900">{c.affiliate?.full_name ?? '—'}</span></div>
            <div><span className="text-gray-500">Product:</span> <span className="text-gray-900">{c.product_name ?? '—'}</span></div>
            <div><span className="text-gray-500">Quantity:</span> <span className="text-gray-900">{c.quantity}</span></div>
            <div><span className="text-gray-500">Unit Price:</span> <span className="text-gray-900">{fmt(c.unit_price)}</span></div>
            <div><span className="text-gray-500">Line Total:</span> <span className="text-gray-900">{fmt(c.line_total)}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(c.created_at).toLocaleString('en-IN')}</span></div>
            {c.approved_at && <div><span className="text-gray-500">Approved:</span> <span className="text-gray-900">{new Date(c.approved_at).toLocaleString('en-IN')}</span></div>}
            {c.reversed_at && <div><span className="text-gray-500">Reversed:</span> <span className="text-gray-900">{new Date(c.reversed_at).toLocaleString('en-IN')}</span></div>}
            {c.reason && <div className="col-span-2"><span className="text-gray-500">Reason:</span> <span className="text-gray-900">{c.reason}</span></div>}
          </div>

          {c.metadata && Object.keys(c.metadata).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(c.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-gray-500">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-gray-900 font-mono text-xs">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {c.holds && c.holds.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Hold History</h4>
              <div className="space-y-2">
                {c.holds.map((h: any) => (
                  <div key={h.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <Badge variant={h.reason_code === 'self_referral' ? 'error' : 'warning'} size="sm">{h.reason_code?.replace('_', ' ')}</Badge>
                      <span className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{h.reason_detail ?? '—'}</p>
                    {h.resolved_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Resolved: {h.resolution} by {h.resolved_by?.name ?? 'System'} on {new Date(h.resolved_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
