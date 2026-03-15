import React from 'react';
import { cn } from '../utils/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Input variants
type InputVariant = 'default' | 'filled' | 'flush';
type InputSize = 'sm' | 'md' | 'lg';

const inputVariants = {
  default: 'border border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-500/20',
  filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-primary-500/20',
  flush: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-primary-500 focus:ring-0 px-0',
};

const inputSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      containerClassName,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-lg text-gray-900',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'transition-colors duration-200',
              // Variant styles
              inputVariants[variant],
              // Size styles
              inputSizes[inputSize],
              // Icon padding
              leftIcon ? 'pl-10' : '',
              (rightIcon || clearable) ? 'pr-10' : '',
              // Error state
              hasError && !variant.includes('flush') ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : '',
              className
            )}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />
          {clearable && props.value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          {rightIcon && !clearable && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helper,
      containerClassName,
      className,
      id,
      required,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || `textarea-${generatedId}`;
    const hasError = !!error;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'transition-colors duration-200',
            'resize-none',
            hasError && 'border-error-300 focus:border-error-500 focus:ring-error-500/20',
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${textareaId}-error` : helper ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helper,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;
    const hasError = !!error;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'transition-colors duration-200',
              'appearance-none cursor-pointer',
              'pr-10',
              hasError && 'border-error-300 focus:border-error-500 focus:ring-error-500/20',
              className
            )}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'clearable' | 'onClear'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value);
      }
      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        clearable
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;