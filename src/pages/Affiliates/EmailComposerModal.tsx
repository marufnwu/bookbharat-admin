import { useState } from 'react';
import { Modal, Button, Input } from '@/components';
import { Textarea } from '@/components/Input';
import { affiliatesApi } from '@/api/affiliates';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  affiliateId: number;
  affiliateName: string;
  onClose: () => void;
}

export function EmailComposerModal({ open, affiliateId, affiliateName, onClose }: Props) {
  const [subject, setSubject] = useState(`Regarding your BookBharat affiliate account`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }
    setSending(true); setError(null);
    try {
      await affiliatesApi.sendEmail(affiliateId, subject, body);
      toast.success('Email sent successfully');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Email ${affiliateName}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} loading={sending}>Send Email</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
        <Textarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="Write your message..."
          error={error ?? undefined}
        />
      </div>
    </Modal>
  );
}
