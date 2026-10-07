/**
 * SMS templates tab for the Message Templates screen. Admin-editable with
 * DLT guardrails: the body must match the DLT-registered template for the
 * event, so a DLT template ID is required and a live preview + test send
 * are provided before going live.
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, Save, Send } from 'lucide-react';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmModal,
  SkeletonList,
} from '../../../components';
import {
  useResetSmsTemplate,
  useSmsTemplatePreview,
  useSmsTemplates,
  useTestSmsTemplate,
  useUpdateSmsTemplate,
} from '../../../api/messaging/hooks';
import type { SmsTemplate } from '../../../api/messaging/types';

export const SmsTemplatesTab: React.FC = () => {
  const { data: templates, isLoading } = useSmsTemplates();
  const updateTemplate = useUpdateSmsTemplate();
  const resetTemplate = useResetSmsTemplate();
  const testTemplate = useTestSmsTemplate();

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [dltId, setDltId] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const selected: SmsTemplate | undefined = templates?.find((t) => t.event_code === selectedEvent);
  const { data: preview } = useSmsTemplatePreview(selectedEvent ?? '');

  useEffect(() => {
    if (selected) {
      setBody(selected.body);
      setDltId(selected.dlt_template_id ?? '');
    }
  }, [selectedEvent, selected]);

  if (isLoading) return <SkeletonList items={6} />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Template list */}
      <div className="space-y-2">
        {(templates ?? []).map((template) => (
          <button
            key={template.event_code}
            type="button"
            onClick={() => setSelectedEvent(template.event_code)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
              selectedEvent === template.event_code
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">{template.label}</span>
              {template.is_customised ? (
                <span className="text-xs font-medium text-warning-600">customised</span>
              ) : (
                <span className="text-xs text-gray-400">default</span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 font-mono text-xs text-gray-500">{template.body}</p>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="space-y-4 lg:col-span-2">
          <Banner
            tone="warning"
            title="DLT constraint"
            description="The SMS gateway rejects any message that does not match the DLT-registered template exactly. After editing here, update the template in the DLT portal and record its ID below."
          />

          <Card>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Variables the code provides
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => setBody((current) => `${current}{${variable}}`)}
                      className="rounded bg-primary-50 px-2 py-0.5 font-mono text-xs text-primary-700 hover:bg-primary-100"
                    >
                      {`{${variable}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">
                  DLT template ID (required)
                </label>
                <input
                  type="text"
                  value={dltId}
                  onChange={(e) => setDltId(e.target.value)}
                  placeholder="e.g. 1707172665758589401"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  leftIcon={<Save className="h-4 w-4" />}
                  loading={updateTemplate.isPending}
                  disabled={!body.trim() || !dltId.trim()}
                  onClick={() =>
                    updateTemplate.mutate({
                      event: selected.event_code,
                      payload: { body, dlt_template_id: dltId, is_active: true },
                    })
                  }
                >
                  Save
                </Button>
                {selected.is_customised && (
                  <Button
                    variant="outline"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => setConfirmReset(true)}
                  >
                    Reset to default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardContent className="pt-2">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Live preview (sample data)
              </p>
              <div className="mt-2 rounded-lg bg-gray-100 px-4 py-3">
                <div className="inline-block max-w-full rounded-xl rounded-br-sm bg-[#ECE5DD] px-3 py-2">
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-900">
                    {preview?.preview ?? '—'}
                  </p>
                </div>
              </div>
              {preview && preview.unresolved_placeholders.length > 0 && (
                <p className="mt-2 text-xs text-error-600">
                  Unresolved placeholders (code does not provide them):{' '}
                  {preview.unresolved_placeholders.map((p) => `{${p}}`).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Test send */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Send test SMS to
                </label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="+9198XXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                leftIcon={<Send className="h-4 w-4" />}
                disabled={!testRecipient}
                loading={testTemplate.isPending}
                onClick={() => testTemplate.mutate({ event: selected.event_code, recipient: testRecipient })}
              >
                Send test
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 lg:col-span-2">
          <p className="p-10 text-sm text-gray-500">Select a template to view and edit it.</p>
        </div>
      )}

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          if (selected) resetTemplate.mutate(selected.event_code);
          setConfirmReset(false);
        }}
        title="Reset to default"
        message="Remove the admin override and restore the DLT-registered default body for this event?"
        confirmText="Reset"
        variant="warning"
        loading={resetTemplate.isPending}
      />
    </div>
  );
};

export default SmsTemplatesTab;
