import React, { InputHTMLAttributes } from 'react';
import './CustomCheckbox.css';

interface CustomCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label: string | React.ReactNode;
  register?: any;
  required?: boolean;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ 
  id, 
  label, 
  register, 
  required = false, 
  className = "",
  ...props 
}) => {
  return (
    <div className={`flex items-center checkbox-wrapper-19 ${className}`}>
      <input
        {...(register ? register(id) : {})}
        id={id}
        type="checkbox"
        required={required}
        {...props}
      />
      <label htmlFor={id} className="check-box"></label>
      <span className={`ml-2 block text-gray-900 ${className.includes('text-xs') ? 'text-xs' : 'text-sm'}`}>
        {label}
      </span>
    </div>
  );
};

export default CustomCheckbox;
