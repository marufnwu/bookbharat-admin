import { useState } from 'react';
import { Modal, Button, Input } from '@/components';
import { affiliatesApi, makeIdempotencyKey } from '@/api/affiliates';
import { toast } from '@/utils/toast';
import type { AffiliatePayout } from '@/types/affiliate';

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

interface Props {
  open: boolean;
  payouts: AffiliatePayout[];
  onClose: () => void;
  onProcessed: () => void;
}

export function BulkProcessPayoutModal({ open, payouts, onClose, onProcessed }: Props) {
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = payouts.reduce((sum, p) => sum + (Number(p.amount_requested) || 0), 0);

  async function handleSubmit() {
    if (!txnRef.trim()) { setError('Transaction reference is required'); return; }
    setSubmitting(true); setError(null);
    try {
      const ids = payouts.map((p) => p.id);
      const r = await affiliatesApi.bulkProcessPayouts(ids, txnRef, makeIdempotencyKey());
      toast.success(`Processed ${r?.count ?? ids.length} payouts`);
      onProcessed(); onClose(); setTxnRef('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Process ${payouts.length} Payouts`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} loading={submitting}>Process All</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payouts:</span>
            <span className="font-medium text-gray-900">{payouts.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Total amount:</span>
            <span className="font-semibold text-gray-900">{fmt(totalAmount)}</span>
          </div>
        </div>
        <Input
          label="Transaction reference *"
          value={txnRef}
          onChange={(e) => setTxnRef(e.target.value)}
          placeholder="Bank transfer reference / UPI transaction ID"
          error={error ?? undefined}
          helper="This reference will be applied to all selected payouts."
        />
      </div>
    </Modal>
  );
}
