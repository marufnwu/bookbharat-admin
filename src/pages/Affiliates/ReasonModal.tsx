import { useState } from 'react';
import { Modal } from '@/components';
import Button from '@/components/Button';
import { Textarea } from '@/components/Input';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function ReasonModal({
  open, title, description, reasonLabel = 'Reason', reasonRequired = false,
  confirmLabel, confirmVariant = 'default', onClose, onConfirm,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (reasonRequired && !reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant === 'destructive' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {reasonLabel}
          {reasonRequired && <span className="text-error-500 ml-1">*</span>}
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={reasonRequired ? 'Required' : 'Optional'}
          error={error ?? undefined}
        />
      </div>
    </Modal>
  );
}
