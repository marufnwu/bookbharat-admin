import { useState } from 'react';
import { Modal } from '@/components';
import Button from '@/components/Button';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmModal({ open, title, description, confirmLabel, confirmVariant = 'default', onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function handle() {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
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
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant={confirmVariant === 'destructive' ? 'danger' : 'primary'}
            onClick={handle}
            disabled={submitting}
            loading={submitting}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </Modal>
  );
}

export default ConfirmModal;
