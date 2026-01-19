import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-apple bg-white',
          {
            // Variants
            'shadow-apple': variant === 'default',
            'border border-gray-200': variant === 'outlined',
            'bg-gray-100': variant === 'filled',
            // Padding
            '': padding === 'none',
            'p-3': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
            // Interactive
            'cursor-pointer transition-all duration-150 hover:shadow-apple-md active:scale-[0.99]':
              interactive,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
