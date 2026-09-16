import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, Button, Input } from '@/components';
import { affiliatesApi, makeIdempotencyKey } from '@/api/affiliates';
import type { AffiliatePayout, AdminPaymentDetails } from '@/types/affiliate';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/utils/toast';

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

interface Props { open: boolean; payout: AffiliatePayout; onClose: () => void; onProcessed: () => void }

export function ProcessPayoutModal({ open, payout, onClose, onProcessed }: Props) {
  const [txnRef, setTxnRef] = useState('');
  const [amount, setAmount] = useState(String(payout.amount_requested));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canProcess = useCan('payouts.process');

  const { data: pdData, isLoading: pdLoading } = useQuery({
    queryKey: ['admin-payment-details', payout.affiliate_id],
    queryFn: () => affiliatesApi.getPaymentDetails(payout.affiliate_id),
    enabled: !!open && !!payout.affiliate_id,
    staleTime: 60_000,
  });
  const pd: AdminPaymentDetails | undefined = pdData?.payment_details;

  async function handleSubmit() {
    if (!txnRef.trim()) { setError('Transaction reference is required'); return; }
    setSubmitting(true); setError(null);
    try {
      const parsed = parseFloat(amount);
      const amountArg = Number.isFinite(parsed) ? parsed : undefined;
      await affiliatesApi.processPayout(payout.id, txnRef, amountArg, makeIdempotencyKey());
      toast.success('Payout processed');
      onProcessed(); onClose(); setTxnRef('');
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Process Payout ${payout.request_number}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canProcess}
            loading={submitting}
            title={!canProcess ? 'You need the payouts.process permission' : undefined}
          >
            Mark as paid
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Requested:</span>
          <span className="font-medium">{fmt(payout.amount_requested)}</span>
        </div>
        {payout.tds_amount != null && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">TDS:</span>
              <span>{fmt(payout.tds_amount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Net payable:</span>
              <span>{fmt(payout.amount_net ?? 0)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Method:</span>
          <span>{payout.method.toUpperCase()}</span>
        </div>
        {pdLoading && open && (
          <p className="text-xs text-gray-400">Loading payment details…</p>
        )}
        {pd && (
          <div className="border-t border-gray-200 pt-3 mt-1">
            <div className="text-xs font-medium text-gray-500 mb-2">Payment Details (admin)</div>
            {pd.pan && (
              <div className="flex justify-between">
                <span className="text-gray-500">PAN:</span>
                <span className="font-mono text-xs">{pd.pan}</span>
              </div>
            )}
            {pd.gstin && (
              <div className="flex justify-between">
                <span className="text-gray-500">GSTIN:</span>
                <span className="font-mono text-xs">{pd.gstin}</span>
              </div>
            )}
            {pd.payment_details.bank && (
              <div className="flex justify-between">
                <span className="text-gray-500">Bank:</span>
                <span className="font-mono text-xs">{pd.payment_details.bank.account_number} / IFSC {pd.payment_details.bank.ifsc} / {pd.payment_details.bank.holder_name}</span>
              </div>
            )}
            {pd.payment_details.upi && (
              <div className="flex justify-between">
                <span className="text-gray-500">UPI:</span>
                <span className="font-mono text-xs">{pd.payment_details.upi.id}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
        <Input
          label="Transaction reference *"
          value={txnRef}
          onChange={(e) => setTxnRef(e.target.value)}
          placeholder="UPI ref / bank transaction ID"
          error={error ?? undefined}
        />
        <Input
          label="Amount paid (gross)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helper="Defaults to requested amount. Adjust if you paid a different amount."
        />
      </div>
    </Modal>
  );
}
