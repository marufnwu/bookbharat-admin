// Simple clsx implementation for class names
export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (typeof input === 'object') {
      if (Array.isArray(input)) {
        const result = clsx(...input);
        if (result) classes.push(result);
      } else {
        for (const key in input) {
          if (input[key]) classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Simple class variance authority implementation
export type VariantProps<T extends (...args: any) => any> = T extends (props: infer P) => any
  ? P
  : never;

export function cva(base: string, config: any) {
  return ({ variant, size, className }: any = {}) => {
    const defaultVariant = config.defaultVariants?.variant || 'default';
    const defaultSize = config.defaultVariants?.size || 'default';

    const variantClass = config.variants?.variant?.[variant || defaultVariant] || '';
    const sizeClass = config.variants?.size?.[size || defaultSize] || '';

    return `${base} ${variantClass} ${sizeClass} ${className || ''}`.trim();
  };
}