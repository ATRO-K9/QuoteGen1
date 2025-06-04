import React from 'react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, label, error, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <select
          className={cn(
            "block w-full rounded-md border border-slate-300 py-2 px-3 shadow-sm appearance-none bg-white",
            "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;