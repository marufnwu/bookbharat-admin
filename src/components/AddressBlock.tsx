import React from 'react';
import { MapPin, Edit, Phone } from 'lucide-react';
import {
  buildAddressLines,
  buildAddressLocality,
  getAddressName,
  getAddressPhone,
} from '../features/orders';
import { cn } from '../utils/cn';
import Button from './Button';
import CopyButton from './CopyButton';

/**
 * AddressBlock — single shipping/billing renderer.
 *
 * Renders name, full address lines, locality, country, phone, optional
 * GSTIN, and an optional edit button. Phone and pincode include copy
 * affordances; the "Copy full address" action copies the entire
 * formatted block on multiple lines.
 */

export interface AddressBlockProps {
  title: string;
  address: any;
  editable?: boolean;
  onEdit?: () => void;
  /** Optional gstin / tax id to display below address. */
  gstin?: string;
  className?: string;
}

export const AddressBlock: React.FC<AddressBlockProps> = ({
  title,
  address,
  editable = false,
  onEdit,
  gstin,
  className,
}) => {
  const name = getAddressName(address);
  const lines = buildAddressLines(address);
  const locality = buildAddressLocality(address);
  const phone = getAddressPhone(address);
  const pincode = address?.pincode || address?.postal_code;

  const fullAddressText = [name, lines, locality, address?.country, gstin]
    .filter(Boolean)
    .join('\n');

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <MapPin className="h-4 w-4 text-gray-400" />
          {title}
        </div>
        <div className="flex items-center gap-1.5">
          <CopyButton
            value={fullAddressText}
            label={`${title} (full)`}
            successMessage={`${title} copied`}
            size="xs"
            ariaLabel={`Copy ${title}`}
          />
          {editable && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
      <div className="px-4 py-3 space-y-1">
        <div className="font-medium text-gray-900 inline-flex items-center gap-1.5">
          <span>{name}</span>
          <CopyButton
            value={name}
            label="Name"
            successMessage="Name copied"
            size="xs"
            ariaLabel={`Copy ${title} name`}
          />
        </div>
        {lines !== 'N/A' && (
          <div className="text-sm text-gray-600">{lines}</div>
        )}
        {locality && (
          <div className="text-sm text-gray-600 inline-flex items-center gap-1.5 flex-wrap">
            <span>{locality}</span>
            {pincode && (
              <CopyButton
                value={String(pincode)}
                label="Pincode"
                successMessage="Pincode copied"
                size="xs"
                ariaLabel="Copy pincode"
              />
            )}
          </div>
        )}
        {address?.country && (
          <div className="text-sm text-gray-600">{address.country}</div>
        )}
        {gstin && (
          <div className="text-sm text-gray-600 inline-flex items-center gap-1.5">
            <span>GSTIN: {gstin}</span>
            <CopyButton
              value={gstin}
              label="GSTIN"
              successMessage="GSTIN copied"
              size="xs"
              ariaLabel="Copy GSTIN"
            />
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 pt-1">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>{phone}</span>
            <CopyButton
              value={phone}
              label="Phone"
              successMessage="Phone copied"
              size="xs"
              ariaLabel={`Copy ${title} phone`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBlock;