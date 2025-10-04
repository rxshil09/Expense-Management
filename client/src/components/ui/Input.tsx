import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/index';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  type?: string;
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          type={type}
          className={
            className ||
            cn(
              'block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm',
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
            )
          }
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
