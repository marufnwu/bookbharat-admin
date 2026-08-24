import React from 'react';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value: valueProp, onValueChange, children, className = '', ...rest }) => {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const value = valueProp ?? internal;
  const setValue = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [onValueChange, valueProp]
  );
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
  <div className={'inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ' + className} {...rest}>
    {children}
  </div>
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children, ...rest }) => {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      data-state={active ? 'active' : 'inactive'}
      className={
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
        (active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground') +
        ' ' +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children, ...rest }) => {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return (
    <div className={'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' + className} {...rest}>
      {children}
    </div>
  );
};

export default Tabs;