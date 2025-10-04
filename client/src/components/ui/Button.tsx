import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/index';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'white', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      outline: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      white: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          sizes[size],
          variants[variant],
          className, // Apply className last so it can override variant styles if needed
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;