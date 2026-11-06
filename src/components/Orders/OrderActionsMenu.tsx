import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckIcon,
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Order } from '../../types';

const MENU_WIDTH = 208;

interface OrderActionsMenuProps {
  order: Order;
  hasPhone?: boolean;
  onWhatsApp: () => void;
  onStatusChange: (status: string) => void;
  onChangeStatus: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  onSelect?: () => void;
  to?: string;
}

export const OrderActionsMenu: React.FC<OrderActionsMenuProps> = ({
  order,
  hasPhone = false,
  onWhatsApp,
  onStatusChange,
  onChangeStatus,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onReposition = () => close();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, close]);

  const items: MenuItem[] = [];

  items.push({
    key: 'view',
    label: 'View order',
    icon: EyeIcon,
    to: `/orders/${order.id}`,
  });

  if (hasPhone) {
    items.push({
      key: 'whatsapp',
      label: 'Send WhatsApp',
      icon: PaperAirplaneIcon,
      className: 'text-green-700',
      onSelect: onWhatsApp,
    });
  }

  if (order.status === 'pending') {
    items.push({
      key: 'process',
      label: 'Process order',
      icon: CheckIcon,
      onSelect: () => onStatusChange('processing'),
    });
  }

  if (order.status === 'processing') {
    items.push({
      key: 'create-shipment',
      label: 'Create shipment',
      icon: TruckIcon,
      to: `/orders/${order.id}/create-shipment`,
    });
  }

  if (order.status === 'shipped') {
    items.push({
      key: 'deliver',
      label: 'Mark delivered',
      icon: CheckCircleIcon,
      className: 'text-green-700',
      onSelect: () => onStatusChange('delivered'),
    });
  }

  if (['pending', 'processing'].includes(order.status)) {
    items.push({
      key: 'cancel',
      label: 'Cancel order',
      icon: XMarkIcon,
      className: 'text-red-600',
      onSelect: () => onStatusChange('cancelled'),
    });
  }

  items.push({
    key: 'change-status',
    label: 'Change status…',
    icon: ArrowPathIcon,
    onSelect: onChangeStatus,
  });

  const handleSelect = (item: MenuItem) => {
    close();
    item.onSelect?.();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Order actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Order actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-[70] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const classes = `flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${item.className ?? 'text-gray-700'}`;

              if (item.to) {
                return (
                  <Link
                    key={item.key}
                    role="menuitem"
                    to={item.to}
                    className={classes}
                    onClick={close}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.key}
                  role="menuitem"
                  type="button"
                  className={classes}
                  onClick={() => handleSelect(item)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

export default OrderActionsMenu;
