import React from 'react';

/**
 * Agency credit — "Crafted by <agency lockup>", linking to the agency site.
 *
 * Mirrors the storefront footer (bookbharat-frontend/src/components/layout/
 * Footer.tsx) so the credit reads the same on both surfaces.
 *
 * No white chip here, unlike the storefront: the admin shell is light
 * (bg-gray-50 page, white sidebar) and the artwork is #0D4841 teal on
 * transparency, which already sits at 10.4:1 against white. The chip exists in
 * the storefront only because that footer is ink-900, where the same teal falls
 * to 1.83:1.
 *
 * h-5 rather than the storefront's h-6: the admin shell is a dense
 * h-screen layout, so the credit strip is kept slim. The wordmark's letterforms
 * are ~40% of the artwork height, which still leaves them readable. Height is
 * declared and width left auto so the 4.17:1 ratio cannot distort.
 *
 * The asset is a copy of bookbharat-frontend/public/agency/logo.png, placed
 * here because the two apps have separate public roots. Change one and the
 * other must change too.
 */
const AGENCY_CREDIT = {
  name: 'Logic Line',
  label: 'Crafted by',
  url: 'https://logiclinetech.site',
  logo: '/images/agency/logo.png',
  width: 1543,
  height: 370,
};

const AgencyCredit: React.FC = () => (
  <a
    href={AGENCY_CREDIT.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${AGENCY_CREDIT.label} ${AGENCY_CREDIT.name}`}
    className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
  >
    <span>{AGENCY_CREDIT.label}</span>
    <img
      src={AGENCY_CREDIT.logo}
      alt={AGENCY_CREDIT.name}
      width={AGENCY_CREDIT.width}
      height={AGENCY_CREDIT.height}
      className="h-5 w-auto"
    />
  </a>
);

export default AgencyCredit;
