import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, Banner } from '../../../components';

interface Props {
  order: any;
}

/**
 * Pre-order info card. Only renders when order.is_preorder is true.
 */
export const PreorderCard: React.FC<Props> = ({ order }) => {
  if (!order.is_preorder) return null;

  const releaseDate = order.release_date ? new Date(order.release_date) : null;
  const validRelease = releaseDate && !Number.isNaN(releaseDate.getTime());
  const estimatedShip = validRelease
    ? new Date(releaseDate!.getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <Card className="overflow-hidden animate-fade-in border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <div className="px-6 pt-5 pb-4 border-b border-purple-100">
        <h2 className="text-base font-semibold text-purple-900 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <Calendar className="h-4 w-4" />
          </span>
          Preorder Information
        </h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Stat
            label="Release Date"
            value={
              validRelease
                ? releaseDate!.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Not set'
            }
          />
          <Stat
            label="Estimated Shipping"
            value={
              estimatedShip
                ? estimatedShip.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'N/A'
            }
          />
        </div>
        <Banner
          tone="info"
          title="Pre-order notice"
          description="Items will ship within 3–5 business days after the release date."
        />
      </div>
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg bg-white border border-purple-100 px-4 py-3">
    <div className="text-xs font-medium uppercase tracking-wide text-purple-600 mb-1">
      {label}
    </div>
    <div className="text-base font-semibold text-purple-900">{value}</div>
  </div>
);

export default PreorderCard;