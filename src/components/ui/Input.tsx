// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border-gray-300 shadow-sm
              focus:ring-whatsapp-primary focus:border-whatsapp-primary
              disabled:bg-gray-50 disabled:text-gray-500
              ${icon ? 'pl-10' : 'px-3'}
              py-2 text-sm
              ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              ${className || ''}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            block w-full rounded-lg border-gray-300 shadow-sm
            focus:ring-whatsapp-primary focus:border-whatsapp-primary
            disabled:bg-gray-50 disabled:text-gray-500
            px-3 py-2 text-sm
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${className || ''}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';