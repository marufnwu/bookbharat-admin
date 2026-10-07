/**
 * Message Templates — the ONLY screen where template content lives.
 * Tabs: WhatsApp (Meta-controlled status/sync/test), Email (existing CRUD),
 * SMS (admin-editable with DLT guardrails).
 */

import React, { useState } from 'react';
import WhatsAppTemplates from './WhatsAppTemplates';
import EmailTemplates from '../Content/EmailTemplates';
import SmsTemplatesTab from './MessageTemplates/SmsTemplatesTab';

type TemplateChannel = 'whatsapp' | 'email' | 'sms';

const TABS: { key: TemplateChannel; label: string; description: string }[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Templates are approved at Meta — content is managed in Meta Business Manager.',
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Freely editable. Placeholders are validated against the variables the code provides.',
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'Editable, but the body must match the DLT-registered template or the gateway rejects sends.',
  },
];

export const MessageTemplates: React.FC = () => {
  const [tab, setTab] = useState<TemplateChannel>('whatsapp');
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          The content customers receive for each notification, per channel.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Template channels">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <p className="text-sm text-gray-500">{active.description}</p>

      {tab === 'whatsapp' && <WhatsAppTemplates />}
      {tab === 'email' && <EmailTemplates />}
      {tab === 'sms' && <SmsTemplatesTab />}
    </div>
  );
};

export default MessageTemplates;
