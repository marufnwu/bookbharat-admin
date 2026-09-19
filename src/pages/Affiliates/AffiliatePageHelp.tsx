import { useState } from 'react';
import { InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

interface HelpCopy {
  what: string;
  dos: string[];
}

// Plain-language help for non-technical admins. One line always visible,
// details expand on click. Keys are page ids used by each screen.
const HELP: Record<string, HelpCopy> = {
  dashboard: {
    what: 'Your money summary — how much you owe affiliates right now.',
    dos: [
      'To pay now = approved earnings waiting for a payout.',
      'Coming up = earnings not yet approved (paid after delivery + return days).',
      'New applications, Payouts waiting, Needs review turn color when they need you.',
    ],
  },
  affiliates: {
    what: 'People who sell your books with their coupon code or link.',
    dos: [
      'Approve new applications from the Pending tab.',
      'Click a name to change what they earn or what buyers get.',
      'Earning column: Standard = program rates, % = special rate for this person.',
    ],
  },
  detail: {
    what: "This person's full record — earnings, orders, payouts and controls.",
    dos: [
      'Money rules shows what they earn and what buyers get.',
      'Stop earnings = no future commission. Stop buyer discount = buyers pay full price.',
      'Earning limits (advanced) controls which orders count.',
    ],
  },
  'earning-rules': {
    what: 'Special earning rates for products or categories. Standard rates live in Settings.',
    dos: [
      "Use Check a product's earning to see the exact rate — pick coupon or link order.",
      'Products with no rule earn 0% — see the red coverage line.',
      'Effective per-product rates: Advanced → Product Rates.',
    ],
  },
  earnings: {
    what: 'What each affiliate earned per order.',
    dos: [
      'Waiting approval → select and Approve to make it payable.',
      'Taken back = order was returned or refunded.',
      'Needs review = paused for a check (own purchase, too many refunds, over cap).',
    ],
  },
  holds: {
    what: 'Earnings paused for a check.',
    dos: [
      'Own purchase = affiliate bought with their own code — usually reject.',
      'Too many refunds / Over earning cap — check the order, then approve or reject.',
      'Approve releases the money. Reject cancels it forever.',
    ],
  },
  payouts: {
    what: 'Money affiliates asked to withdraw.',
    dos: [
      'Open a Waiting request, enter your bank/UPI reference, Mark as paid.',
      'If you change the amount, tax and net are recalculated on save.',
      'Refund dues are subtracted automatically — see Advanced → Money To Take Back.',
    ],
  },
  clawbacks: {
    what: 'Money affiliates owe you back because orders were refunded after payout.',
    dos: [
      'Nothing to do by hand — this amount is subtracted from their next payout.',
      'Pending = not yet recovered. Settled = already deducted.',
    ],
  },
  links: {
    what: 'Links affiliates share to bring buyers.',
    dos: [
      'Clicks = visits. Orders = purchases. Conv % = orders ÷ clicks.',
      "Lots of clicks but no orders = people look but don't buy.",
    ],
  },
  orders: {
    what: "Orders that came from an affiliate's coupon or link.",
    dos: [
      'Commission column = earning created for the affiliate.',
      'Blocked = the affiliate bought with their own code — no earning.',
      'Click an order number to open the order.',
    ],
  },
  insights: {
    what: 'Charts of what brings buyers — clicks, orders and top links/products.',
    dos: [
      'Use 7d / 30d / 90d to change the period.',
      'Top Links and Top Products are all-time — not affected by the period buttons.',
    ],
  },
  reports: {
    what: 'Tables and downloads for accounts and reviews.',
    dos: [
      'Outstanding = approved but unpaid. Pending = not yet approved.',
      'Export CSV buttons download the tables for your records.',
    ],
  },
  activity: {
    what: 'Who changed what in the affiliate program.',
    dos: [
      'People = affiliate accounts. Earnings = commissions. Rules = rate changes.',
      'Use this to check who approved or edited something.',
    ],
  },
  automations: {
    what: 'Background tasks that run every day by themselves.',
    dos: [
      'Approve earnings = makes delivered-order earnings payable after return days.',
      "Run Now only if you just changed something and don't want to wait.",
      'Green status = last run worked. Red = open it and check the error.',
    ],
  },
  'product-rates': {
    what: 'What affiliates actually earn per product, after all rules.',
    dos: [
      'Switch Order came from between coupon and link — rates can differ.',
      'Toggle off = this product earns nothing at all.',
      'No rule — 0% = nobody configured a rate for this product yet.',
    ],
  },
  settings: {
    what: "The program's main switches — buyer discount, affiliate earning, payouts, tax.",
    dos: [
      'Start with Quick earning presets instead of typing % blindly.',
      'Green preview shows what happens on a ₹1000 order.',
      'Technical options hide under Show advanced — you rarely need them.',
    ],
  },
};

export function AffiliatePageHelp({ page }: { page: string }) {
  const copy = HELP[page];
  const [open, setOpen] = useState(false);
  if (!copy) return null;
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
        <span className="flex-1 text-sm text-gray-700">{copy.what}</span>
        <span className="flex-shrink-0 text-xs font-medium text-blue-600">
          {open ? 'Hide' : 'What is this page?'}
        </span>
        <ChevronDownIcon
          className={cn('h-4 w-4 flex-shrink-0 text-blue-500 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ul className="mt-2 space-y-1 pl-7 text-sm text-gray-600">
          {copy.dos.map((d) => (
            <li key={d} className="list-disc">
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
