import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * BrutalInput
 * Heavy-bordered, rectangular input with hard focus ring and tactile inset response.
 */
const BrutalInput = forwardRef(function BrutalInput(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    inputClassName = '',
    wrapperClassName = '',
    disabled = false,
    ...props
  },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
      {label && (
        <label className="font-mono text-xs font-bold uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center justify-between">
          <span>{label}</span>
          {props.required && <span className="text-brutal-accent font-black">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-brutal-black dark:text-brutal-white">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white',
            'font-mono text-sm px-3.5 py-2.5 border-2 border-brutal-black dark:border-brutal-yellow',
            'placeholder:text-brutal-muted dark:placeholder:text-brutal-muted-dark placeholder:font-normal',
            'outline-none transition-all duration-100',
            'focus:bg-brutal-paper dark:focus:bg-brutal-dark-surface focus:shadow-brutal focus:-translate-y-0.5',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            Icon && 'pl-10',
            error && 'border-brutal-accent focus:border-brutal-accent shadow-brutal',
            inputClassName
          )}
          {...props}
        />
      </div>

      {error ? (
        <span className="font-mono text-xs text-brutal-accent font-bold tracking-tight">
          ! {error}
        </span>
      ) : helperText ? (
        <span className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark">
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

export default BrutalInput;
