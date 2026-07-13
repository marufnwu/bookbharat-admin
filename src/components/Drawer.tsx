import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

// Drawer positions
type DrawerPosition = 'left' | 'right' | 'bottom';

const drawerPositions = {
  left: {
    container: 'inset-y-0 left-0',
    panel: 'h-full w-80 max-w-full',
    enterFrom: '-translate-x-full',
    enterTo: 'translate-x-0',
    leaveFrom: 'translate-x-0',
    leaveTo: '-translate-x-full',
  },
  right: {
    container: 'inset-y-0 right-0',
    panel: 'h-full w-80 max-w-full',
    enterFrom: 'translate-x-full',
    enterTo: 'translate-x-0',
    leaveFrom: 'translate-x-0',
    leaveTo: 'translate-x-full',
  },
  bottom: {
    container: 'inset-x-0 bottom-0',
    panel: 'w-full max-h-[90vh] rounded-t-2xl',
    enterFrom: 'translate-y-full',
    enterTo: 'translate-y-0',
    leaveFrom: 'translate-y-0',
    leaveTo: 'translate-y-full',
  },
};

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  title?: React.ReactNode;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  position = 'right',
  title,
  description,
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  footer,
  className,
  width,
}) => {
  const positionConfig = drawerPositions[position];

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeOnOverlayClick ? onClose : () => {}}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50" />
        </Transition.Child>

        {/* Drawer Container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={cn('fixed', positionConfig.container)}>
              <Transition.Child
                as={React.Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={positionConfig.enterFrom}
                enterTo={positionConfig.enterTo}
                leave="transform transition ease-in-out duration-200"
                leaveFrom={positionConfig.leaveFrom}
                leaveTo={positionConfig.leaveTo}
              >
                <Dialog.Panel
                  className={cn(
                    'flex flex-col bg-white shadow-xl',
                    positionConfig.panel,
                    width && position !== 'bottom' && width,
                    className
                  )}
                >
                  {/* Header */}
                  {(title || showCloseButton) && (
                    <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                      <div>
                        {title && (
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-semibold text-gray-900"
                          >
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="text-sm text-gray-500 mt-1">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {showCloseButton && (
                        <button
                          type="button"
                          onClick={onClose}
                          className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

                  {/* Footer */}
                  {footer && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                      {footer}
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Drawer Header component for custom drawers
export interface DrawerHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title,
  description,
  onClose,
  showCloseButton = true,
  className,
}) => {
  return (
    <div className={cn('flex items-start justify-between px-6 py-4 border-b border-gray-100', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Drawer Footer component for custom drawers
export interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
};

// Mobile Navigation Drawer - optimized for mobile nav
export interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  open,
  onClose,
  children,
  title,
}) => {
  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0">
            <Transition.Child
              as={React.Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Drawer;