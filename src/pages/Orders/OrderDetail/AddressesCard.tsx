import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, AddressBlock } from '../../../components';

/**
 * Side-by-side shipping + billing address blocks on desktop, stacked on mobile.
 */
interface Props {
  shipping: any;
  billing: any;
  onEditShipping: () => void;
  onEditBilling: () => void;
}

export const AddressesCard: React.FC<Props> = ({
  shipping,
  billing,
  onEditShipping,
  onEditBilling,
}) => {
  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <MapPin className="h-4 w-4" />
          </span>
          Addresses
        </h2>
      </div>
      <CardContent className="pt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AddressBlock
            title="Shipping"
            address={shipping}
            editable
            onEdit={onEditShipping}
          />
          <AddressBlock
            title="Billing"
            address={billing}
            editable
            onEdit={onEditBilling}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressesCard;