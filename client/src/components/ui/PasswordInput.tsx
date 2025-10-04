import React, { useState, forwardRef, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
  autoComplete?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  label,
  placeholder = "Enter password",
  error,
  className = "",
  id,
  autoComplete = "current-password",
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          id={id}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 ${
            error ? 'border-red-300 focus:ring-red-500' : ''
          } ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center 
                     text-gray-400 hover:text-gray-600 
                     focus:outline-none bg-transparent border-0"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
          ) : (
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
