import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-apple-sm':
              variant === 'primary',
            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 shadow-apple-sm':
              variant === 'secondary',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200':
              variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-apple-sm':
              variant === 'danger',
            // Sizes
            'text-xs px-2 py-1 rounded-md gap-1': size === 'sm',
            'text-sm px-3 py-1.5 rounded-lg gap-1.5': size === 'md',
            'text-base px-4 py-2 rounded-lg gap-2': size === 'lg',
          },
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
