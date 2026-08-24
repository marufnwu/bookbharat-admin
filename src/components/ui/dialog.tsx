import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

interface DialogProps extends DivProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className = '', ...rest }) => {
  React.useEffect(() => {
    if (open) document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange?.(false)}
      {...rest}
    >
      <div
        className={'relative z-50 bg-background rounded-lg shadow-lg max-w-lg w-full mx-4 ' + className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <div className={'p-6 ' + className} {...rest}>
    {children}
  </div>
);

export const DialogHeader: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <div className={'mb-4 ' + className} {...rest}>
    {children}
  </div>
);

export const DialogTitle: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <h2 className={'text-lg font-semibold ' + className} {...rest}>
    {children}
  </h2>
);

export const DialogDescription: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <p className={'text-sm text-muted-foreground mt-1 ' + className} {...rest}>
    {children}
  </p>
);

export const DialogFooter: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <div className={'mt-6 flex justify-end gap-2 ' + className} {...rest}>
    {children}
  </div>
);

export default Dialog;